import { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, doc, writeBatch, where, addDoc, updateDoc, getDoc, getDocs, runTransaction } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../../contexts/AuthContext';
import { createNotification } from '../../../hooks/useNotifications';

export interface CarpoolTrip {
  id: string;
  driverId: string;
  driverName?: string;
  origin: string;
  destination: string;
  stops?: string;
  date: string;
  time: string;
  totalSeats: number;
  availableSeats: number;
}

export interface CarpoolBooking {
  id: string;
  tripId: string;
  passengerId: string;
}

export function useCarpooling(selectedDate: string, currentMonth?: Date) {
  const { user } = useAuth();
  const [allMonthTrips, setAllMonthTrips] = useState<CarpoolTrip[]>([]);
  const [bookings, setBookings] = useState<CarpoolBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Determinar año y mes a consultar para allMonthTrips (mes visible en el calendario)
  const targetYear = currentMonth ? currentMonth.getFullYear() : parseInt(selectedDate.substring(0, 4), 10);
  const targetMonth = currentMonth ? currentMonth.getMonth() + 1 : parseInt(selectedDate.substring(5, 7), 10);
  const monthKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

  // Escuchar viajes del mes visible para marcar puntitos en el calendario en tiempo real
  useEffect(() => {
    const startDate = `${monthKey}-01`;
    const lastDayOfMonth = new Date(targetYear, targetMonth, 0).getDate();
    const endDate = `${monthKey}-${String(lastDayOfMonth).padStart(2, '0')}`;
    
    const q = query(
      collection(db, 'carpoolTrips'),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as CarpoolTrip));
      setAllMonthTrips(data);
      setLoading(false);
    }, (err) => {
      console.error("Error al escuchar viajes del mes:", err);
      setLoading(false);
    });
    return unsub;
  }, [monthKey, targetYear, targetMonth]);

  // Derivar viajes del día seleccionado de forma reactiva y pura
  const trips = useMemo(() => {
    return allMonthTrips.filter(t => t.date === selectedDate);
  }, [allMonthTrips, selectedDate]);

  // Escuchar únicamente las reservas del usuario autenticado
  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'carpoolBookings'), where('passengerId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as CarpoolBooking)));
    });
    return unsub;
  }, [user]);

  const publishTrip = async (data: Omit<CarpoolTrip, 'id' | 'driverId' | 'availableSeats'>) => {
    if (!user) return;
    await addDoc(collection(db, 'carpoolTrips'), {
      ...data,
      driverId: user.uid,
      driverName: user.displayName || user.email?.split('@')[0] || 'Compañero',
      availableSeats: data.totalSeats
    });
  };

  const updateTrip = async (tripId: string, data: Partial<Omit<CarpoolTrip, 'id' | 'driverId' | 'availableSeats'>>) => {
    if (!user) return;
    const trip = allMonthTrips.find(t => t.id === tripId);
    if (!trip) return;

    let newAvailableSeats = trip.availableSeats;
    if (data.totalSeats !== undefined && data.totalSeats !== trip.totalSeats) {
      const seatsTaken = trip.totalSeats - trip.availableSeats;
      newAvailableSeats = data.totalSeats - seatsTaken;
      if (newAvailableSeats < 0) {
        throw new Error('No puedes reducir los asientos por debajo de las reservas actuales');
      }
    }

    await updateDoc(doc(db, 'carpoolTrips', tripId), {
      ...data,
      ...(data.totalSeats !== undefined ? { availableSeats: newAvailableSeats } : {})
    });
  };

  const cancelTrip = async (tripId: string) => {
    if (!user) return;
    const batch = writeBatch(db);
    // Borrar el viaje
    batch.delete(doc(db, 'carpoolTrips', tripId));
    // Buscar y borrar reservas asociadas directamente en Firestore
    const q = query(collection(db, 'carpoolBookings'), where('tripId', '==', tripId));
    const snap = await getDocs(q);
    snap.docs.forEach(b => {
      batch.delete(b.ref);
    });
    await batch.commit();
  };

  const bookSeat = async (tripId: string) => {
    if (!user) return;
    const trip = trips.find(t => t.id === tripId) || allMonthTrips.find(t => t.id === tripId);
    if (!trip || trip.driverId === user.uid) return; // No auto-reservar

    const bookingId = `${tripId}_${user.uid}`;
    const bookingRef = doc(db, 'carpoolBookings', bookingId);
    const tripRef = doc(db, 'carpoolTrips', tripId);

    let driverIdToNotify = '';
    let tripTime = '';

    await runTransaction(db, async (transaction) => {
      const tripDoc = await transaction.get(tripRef);
      if (!tripDoc.exists()) {
        throw new Error('El viaje no existe o ha sido cancelado.');
      }
      const tripData = tripDoc.data() as CarpoolTrip;
      if (tripData.availableSeats <= 0) {
        throw new Error('No quedan plazas disponibles en este viaje.');
      }
      if (tripData.driverId === user.uid) {
        throw new Error('No puedes reservar tu propio viaje.');
      }

      const existingBooking = await transaction.get(bookingRef);
      if (existingBooking.exists()) {
        throw new Error('Ya tienes una plaza reservada en este viaje.');
      }

      transaction.set(bookingRef, {
        tripId,
        passengerId: user.uid,
        createdAt: new Date().toISOString()
      });
      transaction.update(tripRef, {
        availableSeats: tripData.availableSeats - 1
      });

      driverIdToNotify = tripData.driverId;
      tripTime = tripData.time;
    });

    // Check if the driver wants notifications
    if (driverIdToNotify) {
      try {
        const driverDoc = await getDoc(doc(db, 'users', driverIdToNotify));
        if (driverDoc.exists()) {
          const prefs = driverDoc.data()?.notificationPrefs;
          if (!prefs || prefs.carpooling !== false) {
            const passengerName = user.displayName || user.email?.split('@')[0] || 'Alguien';
            await createNotification(
              driverIdToNotify,
              '¡Nuevo pasajero!',
              `${passengerName} ha reservado un asiento en tu viaje a las ${tripTime}.`,
              'carpooling'
            );
          }
        }
      } catch (e) {
        console.error("No se pudo notificar al conductor", e);
      }
    }
  };

  const cancelBooking = async (bookingId: string, tripId: string) => {
    if (!user) return;
    const bookingRef = doc(db, 'carpoolBookings', bookingId);
    const tripRef = doc(db, 'carpoolTrips', tripId);

    await runTransaction(db, async (transaction) => {
      const bookingDoc = await transaction.get(bookingRef);
      if (!bookingDoc.exists()) return;

      const tripDoc = await transaction.get(tripRef);
      transaction.delete(bookingRef);

      if (tripDoc.exists()) {
        const tripData = tripDoc.data() as CarpoolTrip;
        const newSeats = Math.min(tripData.totalSeats, (tripData.availableSeats || 0) + 1);
        transaction.update(tripRef, { availableSeats: newSeats });
      }
    });
  };

  return {
    trips,
    allMonthTrips,
    bookings,
    loading,
    publishTrip,
    updateTrip,
    cancelTrip,
    bookSeat,
    cancelBooking
  };
}
