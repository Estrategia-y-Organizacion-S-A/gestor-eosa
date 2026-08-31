import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: 'carpooling' | 'system';
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react/set-state-in-effect
      setNotifications([]);
      // eslint-disable-next-line react/set-state-in-effect
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    } catch (e) {
      console.error('Error marking notification as read', e);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      markAsRead(n.id);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (e) {
      console.error('Error deleting notification', e);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
}

export const createNotification = async (userId: string, title: string, message: string, type: 'carpooling' | 'system') => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    });
  } catch (e) {
    console.error('Error creating notification:', e);
  }
};
