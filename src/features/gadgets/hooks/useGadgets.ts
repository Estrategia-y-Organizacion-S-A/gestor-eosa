import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../../contexts/AuthContext';

export interface Gadget {
  id: string;
  name: string;
  category: 'audiovisual' | 'pantallas' | 'perifericos' | 'cables';
  status: 'available' | 'borrowed';
  currentBorrowerId: string | null;
  currentBorrowerName?: string | null;
  currentBorrowerEmail?: string | null;
  borrowedAt: string | null;
  expectedStartDate?: string | null;
  expectedEndDate?: string | null;
  durationLabel?: string | null;
  description?: string | null;
  location?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export function useGadgets() {
  const { user } = useAuth();
  const [gadgets, setGadgets] = useState<Gadget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'gadgets'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Gadget));
      // Ordenar: primero los más nuevos o por nombre
      setGadgets(data.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })));
      setLoading(false);
    });

    return unsub;
  }, []);

  const borrowGadget = async (
    gadgetId: string,
    options?: {
      durationLabel?: string;
      expectedStartDate?: string;
      expectedEndDate?: string;
      notes?: string;
    }
  ) => {
    if (!user) return;
    const ref = doc(db, 'gadgets', gadgetId);
    await updateDoc(ref, {
      status: 'borrowed',
      currentBorrowerId: user.uid,
      currentBorrowerName: user.displayName || user.email?.split('@')[0] || 'Compañero',
      currentBorrowerEmail: user.email || null,
      borrowedAt: new Date().toISOString(),
      expectedStartDate: options?.expectedStartDate || new Date().toISOString(),
      expectedEndDate: options?.expectedEndDate || null,
      durationLabel: options?.durationLabel || 'Flexible',
      notes: options?.notes?.trim() || null
    });
  };

  const returnGadget = async (gadgetId: string) => {
    if (!user) return;
    const ref = doc(db, 'gadgets', gadgetId);
    await updateDoc(ref, {
      status: 'available',
      currentBorrowerId: null,
      currentBorrowerName: null,
      currentBorrowerEmail: null,
      borrowedAt: null,
      expectedStartDate: null,
      expectedEndDate: null,
      durationLabel: null,
      notes: null
    });
  };

  const addGadget = async (data: {
    name: string;
    category: Gadget['category'];
    description?: string;
    location?: string;
  }) => {
    if (!user) return;
    const newId = `gadget_${Date.now()}`;
    await setDoc(doc(db, 'gadgets', newId), {
      id: newId,
      name: data.name.trim(),
      category: data.category,
      description: data.description?.trim() || null,
      location: data.location?.trim() || null,
      status: 'available',
      currentBorrowerId: null,
      currentBorrowerName: null,
      currentBorrowerEmail: null,
      borrowedAt: null,
      expectedStartDate: null,
      expectedEndDate: null,
      durationLabel: null,
      notes: null,
      createdAt: new Date().toISOString()
    });
    return newId;
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
    addGadget,
    deleteGadget,
    updateGadget
  };
}
