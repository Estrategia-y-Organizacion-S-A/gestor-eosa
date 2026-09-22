import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, writeBatch, where, addDoc, updateDoc, getDoc, increment } from 'firebase/firestore';
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

export function useCarpooling(selectedDate: string) {
  const { user } = useAuth();
  const [trips, setTrips] = useState<CarpoolTrip[]>([]);
  const [allMonthTrips, setAllMonthTrips] = useState<CarpoolTrip[]>([]);
  const [bookings, setBookings] = useState<CarpoolBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Escuchar viajes del mes para marcar puntitos en el calendario
  useEffect(() => {
    const startDate = selectedDate.substring(0, 8) + '01'; 
    const endDate = selectedDate.substring(0, 8) + '31';
    
    const q = query(collection(db, 'carpoolTrips'), where('date', '>=', startDate), where('date', '<=', endDate));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as CarpoolTrip));
      setAllMonthTrips(data);
      // Filtrar para el da seleccionado
      setTrips(data.filter(t => t.date === selectedDate));
      setLoading(false);
    });
    return unsub;
  }, [selectedDate]);

  // Escuchar todas mis reservas actuales y las reservas en mis viajes
  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'carpoolBookings')); // Simplificamos escuchando todas por ahora
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
    // Buscar y borrar reservas asociadas
    const associatedBookings = bookings.filter(b => b.tripId === tripId);
    associatedBookings.forEach(b => {
      batch.delete(doc(db, 'carpoolBookings', b.id));
    });
    await batch.commit();
  };

  const bookSeat = async (tripId: string) => {
    if (!user) return;
    const trip = trips.find(t => t.id === tripId);
    if (!trip || trip.availableSeats <= 0) return;
    if (trip.driverId === user.uid) return; // No auto-reservar

    const batch = writeBatch(db);
    const bookingRef = doc(collection(db, 'carpoolBookings'));
    batch.set(bookingRef, { tripId, passengerId: user.uid });
    
    const tripRef = doc(db, 'carpoolTrips', tripId);
    batch.update(tripRef, { availableSeats: increment(-1) });
    
    await batch.commit();

    // Check if the driver wants notifications
    try {
      const driverDoc = await getDoc(doc(db, 'users', trip.driverId));
      if (driverDoc.exists()) {
        const prefs = driverDoc.data().notificationPrefs;
        if (!prefs || prefs.carpooling !== false) { // Default to true if missing
          const passengerName = user.displayName || user.email?.split('@')[0] || 'Alguien';
          await createNotification(
            trip.driverId,
            '¡Nuevo pasajero!',
            `${passengerName} ha reservado un asiento en tu viaje a las ${trip.time}.`,
            'carpooling'
          );
        }
      }
    } catch (e) {
      console.error("No se pudo notificar al conductor", e);
    }
  };

  const cancelBooking = async (bookingId: string, tripId: string) => {
    if (!user) return;
    const trip = trips.find(t => t.id === tripId) || allMonthTrips.find(t => t.id === tripId);
    if (!trip) return;

    const batch = writeBatch(db);
    batch.delete(doc(db, 'carpoolBookings', bookingId));
    batch.update(doc(db, 'carpoolTrips', tripId), { availableSeats: increment(1) });
    
    await batch.commit();
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
