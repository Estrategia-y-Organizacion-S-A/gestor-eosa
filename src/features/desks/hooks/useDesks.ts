import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, where, writeBatch, getDocs } from 'firebase/firestore';
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
  const [futureReleases, setFutureReleases] = useState<string[]>([]);
  const [bookings, setBookings] = useState<DeskBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Escuchar Mesas y sembrar si falta
  useEffect(() => {
    const q = query(collection(db, 'officeResources'));
    const unsub = onSnapshot(q, (snap) => {
      const allDesks = snap.docs.map(d => ({ id: d.id, ...d.data() } as Desk));
      setDesks(allDesks);
      
      // Auto-alinear mesas de Entrada a la altura de "Mesa Entrada - T2" y asegurar nombres únicos
      if (user) {
        const entradaDesks = allDesks
          .filter(d => d.label?.toLowerCase().includes('entrada'))
          .sort((a, b) => (a.label || '').localeCompare(b.label || ''));
          
        if (entradaDesks.length >= 3) {
          const referenceDesk = allDesks.find(d => d.label === 'Mesa Entrada - T2') || entradaDesks[1];
          const targetY = referenceDesk.y || 25; 
          
          const e1 = entradaDesks[0];
          const e2 = entradaDesks[1];
          const e3 = entradaDesks[2];
          
          const extras = entradaDesks.slice(3);
          
          if (extras.length > 0 || e1.label !== 'Mesa Entrada - T1' || e2.label !== 'Mesa Entrada - T2' || e3.label !== 'Mesa Entrada - T3' || e1.x !== 426 || e2.x !== 464 || e3.x !== 502) {
            console.log("Renombrando y alineando mesas de entrada...");
            const batch = writeBatch(db);
            
            batch.set(doc(db, 'officeResources', e1.id), { x: 426, y: targetY, label: 'Mesa Entrada - T1' }, { merge: true });
            batch.set(doc(db, 'officeResources', e2.id), { x: 464, y: targetY, label: 'Mesa Entrada - T2' }, { merge: true });
            batch.set(doc(db, 'officeResources', e3.id), { x: 502, y: targetY, label: 'Mesa Entrada - T3' }, { merge: true });
            
            extras.forEach(extra => {
              batch.delete(doc(db, 'officeResources', extra.id));
            });
            
            batch.commit().catch(e => console.error("Error aligning:", e));
          }
        } else if (entradaDesks.length > 0 && entradaDesks.length < 3) {
           // Si por error se borró alguna, la recreamos para asegurar siempre 3
           console.log("Faltan mesas, recreando...");
           const batch = writeBatch(db);
           const targetY = entradaDesks[0].y || 25;
           const requiredLabels = ['Mesa Entrada - T1', 'Mesa Entrada - T2', 'Mesa Entrada - T3'];
           const xs = [426, 464, 502];
           
           requiredLabels.forEach((label, i) => {
             const existing = entradaDesks.find(d => d.label === label) || entradaDesks[i];
             if (existing) {
               batch.set(doc(db, 'officeResources', existing.id), { x: xs[i], y: targetY, label }, { merge: true });
             } else {
               batch.set(doc(collection(db, 'officeResources')), { x: xs[i], y: targetY, label, type: 'desk', ownerId: null, ownerName: null });
             }
           });
           batch.commit();
        }
      }
    });
    return unsub;
  }, [user]);

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
      if (!releases.some(r => r.deskId === deskId && r.date === date) && !futureReleases.includes(date)) {
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

  const cancelReleaseByDate = async (deskId: string, date: string) => {
    if (!user) return;
    
    // Actualización optimista
    setFutureReleases(prev => prev.filter(d => d !== date));
    
    // Consultar todos los releases para esa fecha y ese desk
    const q = query(
      collection(db, 'deskReleases'), 
      where('deskId', '==', deskId),
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
    
    const batch = writeBatch(db);
    const deskObj = desks.find(d => d.id === deskId);

    dates.forEach(date => {
      // Si NO es una sala de reuniones, cancelar previa del mismo usuario
      if (deskObj && deskObj.type !== 'meeting_room') {
        const existingBooking = bookings.find(b => b.date === date && b.userId === user.uid);
        if (existingBooking) {
          batch.delete(doc(db, 'deskBookings', existingBooking.id));
        }
      }

      const bookingRef = doc(collection(db, 'deskBookings'));
      batch.set(bookingRef, {
        deskId,
        userId: user.uid,
        date,
        ...(startTime ? { startTime } : {}),
        ...(endTime ? { endTime } : {}),
      });
    });

    await batch.commit();
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
    cancelReleaseByDate,
    bookDesk,
    cancelBooking,
    getDeskStatus,
    futureReleases,
    myHabitualDesk: desks.find(d => d.ownerId === user?.uid)
  };
}
