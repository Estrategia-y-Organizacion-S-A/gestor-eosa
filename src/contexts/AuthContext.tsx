import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isGadgetManager: boolean;
  canManageGadgets: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGadgetManager, setIsGadgetManager] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.email) {
        setUser(currentUser); // Siempre seteamos el usuario por defecto primero
        
        // Bloque 1: Registro de usuario (puede fallar si faltan reglas de Firebase)
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists() && userDoc.data()?.status === 'banned') {
            await signOut(auth);
            setUser(null);
            setIsAdmin(false);
            setIsGadgetManager(false);
            setLoading(false);
            alert("Tu cuenta ha sido desactivada por un administrador.");
            return;
          }

          // Register or update user info preservando displayName y asegurando lastLogin
          const existingData = userDoc.exists() ? userDoc.data() : null;
          const resolvedDisplayName = currentUser.displayName || existingData?.displayName || currentUser.email.split('@')[0];

          await setDoc(userDocRef, {
            email: currentUser.email.toLowerCase(),
            displayName: resolvedDisplayName,
            photoURL: currentUser.photoURL || existingData?.photoURL || null,
            lastLogin: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            status: existingData?.status || 'active',
            notificationPrefs: existingData?.notificationPrefs || { carpooling: true, system: true }
          }, { merge: true });
        } catch (e) {
          console.warn("No se pudo registrar/verificar el usuario en Firestore. Falta configurar reglas de seguridad de 'users':", e);
        }

        // Bloque 2: Verificación de Roles (Admin y Gestor de Gadgets)
        try {
          const emailKey = currentUser.email.toLowerCase();
          const roleRef = doc(db, 'roles', emailKey);
          const roleDoc = await getDoc(roleRef);
          
          if (roleDoc.exists()) {
            const roleData = roleDoc.data();
            const admin = roleData?.isAdmin === true;
            const manager = roleData?.isGadgetManager === true || roleData?.role === 'gadget_manager';
            setIsAdmin(admin);
            setIsGadgetManager(manager);
          } else {
            setIsAdmin(false);
            setIsGadgetManager(false);
          }
        } catch (e) {
          console.error("Error comprobando roles:", e);
          setIsAdmin(false);
          setIsGadgetManager(false);
        }
        
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsGadgetManager(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = () => signOut(auth);

  const canManageGadgets = isAdmin || isGadgetManager;

  return (
    <AuthContext.Provider value={{ user, isAdmin, isGadgetManager, canManageGadgets, loading, logout }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-red"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react/only-export-components
export const useAuth = () => useContext(AuthContext);
