import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, where, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../../contexts/AuthContext';

export interface Desk {
  id: string;
  label: string;
  x: number;
  y: number;
  ownerId: string | null;
  reservable: boolean;
  type?: 'seat' | 'meeting_room';
}

export interface DeskRelease {
  id: string;
  deskId: string;
  ownerId: string;
  date: string; // YYYY-MM-DD
}

export interface DeskBooking {
  id: string;
  deskId: string;
  userId: string;
  date: string;
  startTime?: string;
  endTime?: string;
}



export function useDesks(selectedDate: string) {
  const { user } = useAuth();
  const [desks, setDesks] = useState<Desk[]>([]);
  const [releases, setReleases] = useState<DeskRelease[]>([]);
  const [bookings, setBookings] = useState<DeskBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  // No seeding in production
  }, []);

  // Escuchar Mesas
  useEffect(() => {
    const q = query(collection(db, 'officeResources'));
    const unsub = onSnapshot(q, (snap) => {
      setDesks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Desk)));
    });
    return unsub;
  }, []);

  // Escuchar Ausencias (Releases) y Reservas (Bookings) del mes actual
  useEffect(() => {
    const startDate = selectedDate.substring(0, 8) + '01'; // Principio de mes
    const endDate = selectedDate.substring(0, 8) + '31'; // Fin de mes
    
    const releasesQ = query(collection(db, 'deskReleases'), where('date', '>=', startDate), where('date', '<=', endDate));
    const unsubR = onSnapshot(releasesQ, (snap) => {
      setReleases(snap.docs.map(d => ({ id: d.id, ...d.data() } as DeskRelease)));
    });

    const bookingsQ = query(collection(db, 'deskBookings'), where('date', '>=', startDate), where('date', '<=', endDate));
    const unsubB = onSnapshot(bookingsQ, (snap) => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as DeskBooking)));
      setLoading(false);
    });

    return () => { unsubR(); unsubB(); };
  }, [selectedDate]);

  const claimHabitualDesk = async (deskId: string) => {
    if (!user) return;
    const batch = writeBatch(db);
    // Buscar si ya tiene un puesto habitual y liberarlo
    const prevDesk = desks.find(d => d.ownerId === user.uid);
    if (prevDesk && prevDesk.id !== deskId) {
      batch.set(doc(db, 'officeResources', prevDesk.id), { ownerId: null, ownerName: null }, { merge: true });
    }
    batch.set(doc(db, 'officeResources', deskId), { 
      ownerId: user.uid,
      ownerName: user.displayName || user.email?.split('@')[0] || 'Compañero'
    }, { merge: true });
    await batch.commit();
  };

  const releaseHabitualDesk = async (deskId: string, dates: string[]) => {
    if (!user) return;
    const batch = writeBatch(db);
    dates.forEach(date => {
      const releaseRef = doc(collection(db, 'deskReleases'));
      batch.set(releaseRef, { deskId, ownerId: user.uid, date });
    });
    await batch.commit();
  };

  const abandonHabitualDesk = async (deskId: string) => {
    if (!user) return;
    const deskRef = doc(db, 'officeResources', deskId);
    await setDoc(deskRef, { ownerId: null }, { merge: true });
  };

  const cancelRelease = async (releaseId: string) => {
    if (!user) return;
    const releaseObj = releases.find(r => r.id === releaseId);
    if (releaseObj) {
      // Cancelar automáticamente cualquier reserva temporal (no sala de reuniones) que el usuario tuviera para ese mismo día
      const tempBooking = bookings.find(
        b => b.date === releaseObj.date && 
             b.userId === user.uid && 
             desks.find(d => d.id === b.deskId)?.type !== 'meeting_room'
      );
      if (tempBooking) {
        await deleteDoc(doc(db, 'deskBookings', tempBooking.id));
      }
    }
    await deleteDoc(doc(db, 'deskReleases', releaseId));
  };

  const bookDesk = async (deskId: string, date: string, startTime?: string, endTime?: string) => {
    if (!user) return;
    
    // Si NO es una sala de reuniones, debemos cancelar cualquier reserva previa de este usuario para este mismo día
    // (Un usuario solo puede tener 1 mesa reservada temporalmente al día)
    const deskObj = desks.find(d => d.id === deskId);
    if (deskObj && deskObj.type !== 'meeting_room') {
      const existingBooking = bookings.find(b => b.date === date && b.userId === user.uid);
      if (existingBooking) {
        await deleteDoc(doc(db, 'deskBookings', existingBooking.id));
      }
    }

    await addDoc(collection(db, 'deskBookings'), {
      deskId,
      userId: user.uid,
      date,
      ...(startTime ? { startTime } : {}),
      ...(endTime ? { endTime } : {}),
    });
  };

  const cancelBooking = async (bookingId: string) => {
    await deleteDoc(doc(db, 'deskBookings', bookingId));
  };

  // Helper para saber el estado de un puesto en la fecha seleccionada
  const getDeskStatus = (desk: Desk) => {
    const isReleased = releases.some(r => r.deskId === desk.id && r.date === selectedDate);
    const booking = bookings.find(b => b.deskId === desk.id && b.date === selectedDate);
    
    const isMyHabitual = desk.ownerId === user?.uid;
    const hasOwner = desk.ownerId !== null;

    if (booking) {
      return booking.userId === user?.uid ? 'mine' : 'booked';
    }

    if (isMyHabitual) {
      return isReleased ? 'available' : 'mine';
    }

    if (hasOwner && !isReleased) {
      return 'booked';
    }

    return 'available';
  };

  return {
    desks,
    releases,
    bookings,
    loading,
    claimHabitualDesk,
    releaseHabitualDesk,
    abandonHabitualDesk,
    cancelRelease,
    bookDesk,
    cancelBooking,
    getDeskStatus,
    myHabitualDesk: desks.find(d => d.ownerId === user?.uid)
  };
}
