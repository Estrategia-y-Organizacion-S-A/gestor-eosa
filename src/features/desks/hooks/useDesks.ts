import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, where, writeBatch, getDocs, runTransaction } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../../contexts/AuthContext';

export interface Desk {
  id: string;
  label: string;
  x: number;
  y: number;
  ownerId: string | null;
  ownerName?: string | null;
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
  userName?: string;
  date: string;
  startTime?: string;
  endTime?: string;
}



export function useDesks(selectedDate: string) {
  const { user } = useAuth();
  const [desks, setDesks] = useState<Desk[]>([]);
  const [releases, setReleases] = useState<DeskRelease[]>([]);
  const [futureReleases, setFutureReleases] = useState<string[]>([]);
  const [bookings, setBookings] = useState<DeskBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Escuchar Mesas de la oficina
  useEffect(() => {
    const q = query(collection(db, 'officeResources'));
    const unsub = onSnapshot(q, (snap) => {
      const allDesks = snap.docs.map(d => ({ id: d.id, ...d.data() } as Desk));
      setDesks(allDesks);
    });
    return unsub;
  }, []);

  // Escuchar ausencias futuras del usuario
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'deskReleases'), 
      where('ownerId', '==', user.uid),
      where('date', '>=', today)
    );
    const unsub = onSnapshot(q, (snap) => {
      const dates = snap.docs.map(d => d.data().date);
      setFutureReleases(Array.from(new Set(dates)).sort());
    });
    return unsub;
  }, [user]);

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
    
    // Actualización optimista de la UI
    setFutureReleases(prev => Array.from(new Set([...prev, ...dates])).sort());
    
    const batch = writeBatch(db);
      dates.forEach(date => {
        // Evitar duplicados si ya existe en este mes o en el futuro
        if (!releases.some(r => r.ownerId === user.uid && r.date === date) && !futureReleases.includes(date)) {
          const releaseRef = doc(collection(db, 'deskReleases'));
          batch.set(releaseRef, { deskId, ownerId: user.uid, date });
        }
      });
    await batch.commit();
  };

  const abandonHabitualDesk = async (deskId: string) => {
    if (!user) return;
    const deskRef = doc(db, 'officeResources', deskId);
    await setDoc(deskRef, { ownerId: null }, { merge: true });
  };

  const cancelReleaseByDate = async (date: string) => {
    if (!user) return;
    
    // Actualización optimista
    setFutureReleases(prev => prev.filter(d => d !== date));
    
    // Consultar todos los releases para esa fecha y ese usuario
    const q = query(
      collection(db, 'deskReleases'), 
      where('ownerId', '==', user.uid),
      where('date', '==', date)
    );
    const snap = await getDocs(q);
    
    const batch = writeBatch(db);
    snap.docs.forEach(d => {
      batch.delete(d.ref);
    });

    // Cancelar reservas temporales del usuario para ese día
    const bq = query(
      collection(db, 'deskBookings'),
      where('userId', '==', user.uid),
      where('date', '==', date)
    );
    const bsnap = await getDocs(bq);
    bsnap.docs.forEach(d => {
      const bData = d.data() as DeskBooking;
      const isMeetingRoom = desks.find(desk => desk.id === bData.deskId)?.type === 'meeting_room';
      if (!isMeetingRoom) {
         batch.delete(d.ref);
      }
    });

    await batch.commit();
  };

  const bookDesk = async (deskId: string, dates: string[], startTime?: string, endTime?: string) => {
    if (!user) return;
    
    const deskObj = desks.find(d => d.id === deskId);
    const isMeetingRoom = deskObj?.type === 'meeting_room';

    if (!isMeetingRoom) {
      // Para puestos individuales: reserva atómica garantizando exclusividad por puesto y fecha
      for (const date of dates) {
        const bookingId = `${deskId}_${date}`;
        const bookingRef = doc(db, 'deskBookings', bookingId);

        // Si el usuario tenía otro puesto reservado para este día, liberarlo
        const existingMyBooking = bookings.find(b => b.date === date && b.userId === user.uid && b.deskId !== deskId);
        if (existingMyBooking) {
          try {
            await deleteDoc(doc(db, 'deskBookings', existingMyBooking.id));
          } catch (e) {
            console.warn("Error al liberar reserva anterior:", e);
          }
        }

        await runTransaction(db, async (tx) => {
          const snap = await tx.get(bookingRef);
          if (snap.exists()) {
            const data = snap.data() as DeskBooking;
            if (data.userId !== user.uid) {
              throw new Error(`El puesto ya está reservado por otra persona para el día ${date}.`);
            }
          }

          tx.set(bookingRef, {
            deskId,
            userId: user.uid,
            userName: user.displayName || user.email?.split('@')[0] || 'Compañero',
            date,
          });
        });
      }
    } else {
      // Para salas de reuniones que admiten franjas horarias
      const batch = writeBatch(db);
      dates.forEach(date => {
        const bookingRef = doc(collection(db, 'deskBookings'));
        batch.set(bookingRef, {
          deskId,
          userId: user.uid,
          userName: user.displayName || user.email?.split('@')[0] || 'Compañero',
          date,
          ...(startTime ? { startTime } : {}),
          ...(endTime ? { endTime } : {}),
        });
      });
      await batch.commit();
    }
  };

  const cancelBooking = async (bookingId: string) => {
    await deleteDoc(doc(db, 'deskBookings', bookingId));
  };

  // Helper para saber el estado de un puesto en la fecha seleccionada
  const getDeskStatus = (desk: Desk) => {
    const isReleased = releases.some(r => r.ownerId === desk.ownerId && r.date === selectedDate);
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
    cancelReleaseByDate,
    bookDesk,
    cancelBooking,
    getDeskStatus,
    futureReleases,
    myHabitualDesk: desks.find(d => d.ownerId === user?.uid)
  };
}
