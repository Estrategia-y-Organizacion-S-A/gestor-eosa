import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../../contexts/AuthContext';

export interface Gadget {
  id: string;
  name: string;
  category: 'audiovisual' | 'pantallas' | 'perifericos' | 'cables';
  status: 'available' | 'borrowed';
  currentBorrowerId: string | null;
  currentBorrowerName?: string | null;
  borrowedAt: string | null;
  expectedStartDate?: string | null;
  expectedEndDate?: string | null;
  description?: string | null;
}

export function useGadgets() {
  const { user } = useAuth();
  const [gadgets, setGadgets] = useState<Gadget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'gadgets'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Gadget));
      setGadgets(data);
      setLoading(false);
    });

    return unsub;
  }, []);

  const borrowGadget = async (gadgetId: string, startDate?: string, endDate?: string) => {
    if (!user) return;
    const ref = doc(db, 'gadgets', gadgetId);
    await updateDoc(ref, {
      status: 'borrowed',
      currentBorrowerId: user.uid,
      currentBorrowerName: user.displayName || user.email?.split('@')[0] || 'Compañero',
      borrowedAt: new Date().toISOString(),
      expectedStartDate: startDate || null,
      expectedEndDate: endDate || null
    });
  };

  const returnGadget = async (gadgetId: string) => {
    if (!user) return;
    const ref = doc(db, 'gadgets', gadgetId);
    await updateDoc(ref, {
      status: 'available',
      currentBorrowerId: null,
      currentBorrowerName: null,
      borrowedAt: null,
      expectedStartDate: null,
      expectedEndDate: null
    });
  };

  const deleteGadget = async (gadgetId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'gadgets', gadgetId));
  };

  const updateGadget = async (gadgetId: string, data: Partial<Gadget>) => {
    if (!user) return;
    await updateDoc(doc(db, 'gadgets', gadgetId), data);
  };

  return {
    gadgets,
    loading,
    borrowGadget,
    returnGadget,
    deleteGadget,
    updateGadget
  };
}
