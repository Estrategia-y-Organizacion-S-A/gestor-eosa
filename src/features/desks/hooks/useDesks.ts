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

  // Escuchar Mesas y sembrar si falta
  useEffect(() => {
    const q = query(collection(db, 'officeResources'));
    const unsub = onSnapshot(q, (snap) => {
      const allDesks = snap.docs.map(d => ({ id: d.id, ...d.data() } as Desk));
      setDesks(allDesks);
      
      // Master Sync Script
      if (user) {
        const MASTER_DESKS = [
          // Mesa E (Comunicación)
          { label: 'E1', x: 50, y: 32, type: 'seat' }, { label: 'E2', x: 86, y: 32, type: 'seat' }, { label: 'E3', x: 122, y: 32, type: 'seat' }, { label: 'E4', x: 158, y: 32, type: 'seat' },
          { label: 'E8', x: 50, y: 96, type: 'seat' }, { label: 'E7', x: 86, y: 96, type: 'seat' }, { label: 'E6', x: 122, y: 96, type: 'seat' }, { label: 'E5', x: 158, y: 96, type: 'seat' },
      
          // Mesa C (Proyectos)
          { label: 'C1', x: 230, y: 32, type: 'seat' }, { label: 'C2', x: 266, y: 32, type: 'seat' }, { label: 'C3', x: 302, y: 32, type: 'seat' }, { label: 'C4', x: 338, y: 32, type: 'seat' },
          { label: 'C8', x: 230, y: 96, type: 'seat' }, { label: 'C7', x: 266, y: 96, type: 'seat' }, { label: 'C6', x: 302, y: 96, type: 'seat' }, { label: 'C5', x: 338, y: 96, type: 'seat' },
      
          // Mesa G (Administración)
          { label: 'G1', x: 428, y: 32, type: 'seat' }, { label: 'G2', x: 464, y: 32, type: 'seat' }, { label: 'G3', x: 500, y: 32, type: 'seat' },
      
          // Mesa D (Proyectos europeos)
          { label: 'D1', x: 256, y: 280, type: 'seat' }, { label: 'D2', x: 256, y: 316, type: 'seat' }, { label: 'D3', x: 256, y: 352, type: 'seat' }, { label: 'D4', x: 256, y: 388, type: 'seat' },
          { label: 'D8', x: 192, y: 280, type: 'seat' }, { label: 'D7', x: 192, y: 316, type: 'seat' }, { label: 'D6', x: 192, y: 352, type: 'seat' }, { label: 'D5', x: 192, y: 388, type: 'seat' },
      
          // Mesa B (Turismo y P.Urbana)
          { label: 'B1', x: 516, y: 217, type: 'seat' }, { label: 'B2', x: 516, y: 253, type: 'seat' }, { label: 'B3', x: 516, y: 289, type: 'seat' }, { label: 'B4', x: 516, y: 325, type: 'seat' }, { label: 'B5', x: 516, y: 361, type: 'seat' },
          { label: 'B10', x: 452, y: 217, type: 'seat' }, { label: 'B9', x: 452, y: 253, type: 'seat' }, { label: 'B8', x: 452, y: 289, type: 'seat' }, { label: 'B7', x: 452, y: 325, type: 'seat' }, { label: 'B6', x: 452, y: 361, type: 'seat' },
      
          // Mesa A (Estudios y TIC)
          { label: 'A1', x: 636, y: 251, type: 'seat' }, { label: 'A2', x: 636, y: 287, type: 'seat' }, { label: 'A3', x: 636, y: 323, type: 'seat' },
          { label: 'A6', x: 572, y: 251, type: 'seat' }, { label: 'A5', x: 572, y: 287, type: 'seat' }, { label: 'A4', x: 572, y: 323, type: 'seat' },
        ];

        // Solo sincronizamos si hay un desajuste en el número de mesas o si falta alguna etiqueta importante (ej. E1)
        const hasAllMasterLabels = MASTER_DESKS.every(md => allDesks.some(d => d.label === md.label && d.x === md.x && d.y === md.y));
        const activeSeatsCount = allDesks.filter(d => d.type !== 'meeting_room').length;

        if (!hasAllMasterLabels || activeSeatsCount !== MASTER_DESKS.length) {
          console.log("Sincronizando distribución de mesas con la DB...");
          const batch = writeBatch(db);
          const currentSeats = allDesks.filter(d => d.type !== 'meeting_room');
          let ownerIndex = 0;

          for (const newDesk of MASTER_DESKS) {
            const existing = allDesks.find(d => d.label === newDesk.label);
            if (existing) {
              batch.set(doc(db, 'officeResources', existing.id), { x: newDesk.x, y: newDesk.y, label: newDesk.label, type: 'seat' }, { merge: true });
              const idx = currentSeats.findIndex(s => s.id === existing.id);
              if (idx !== -1) currentSeats.splice(idx, 1);
            } else {
              let ownerData: { ownerId: string | null; ownerName: string | null } = { ownerId: null, ownerName: null };
              if (ownerIndex < currentSeats.length) {
                ownerData = { ownerId: currentSeats[ownerIndex].ownerId || null, ownerName: currentSeats[ownerIndex].ownerName || null };
                ownerIndex++;
              }
              const newRef = doc(collection(db, 'officeResources'));
              batch.set(newRef, { ...newDesk, ...ownerData, reservable: true });
            }
          }

          // Eliminar absolutamente todos los asientos antiguos que sobraron y no se reutilizaron (incluyendo fantasmas como Adolfo y Rodri)
          for (let i = 0; i < currentSeats.length; i++) {
            batch.delete(doc(db, 'officeResources', currentSeats[i].id));
          }

          batch.commit().catch(e => console.error("Error syncing desks:", e));
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
        userName: user.displayName || user.email?.split('@')[0] || 'Compañero',
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
