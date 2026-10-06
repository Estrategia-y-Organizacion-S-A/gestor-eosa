import { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

interface SystemSettingsContextType {
  isGadgetsMaintenance: boolean;
  loadingSettings: boolean;
  setGadgetsMaintenance: (enabled: boolean) => Promise<void>;
}

const SystemSettingsContext = createContext<SystemSettingsContextType>({
  isGadgetsMaintenance: false,
  loadingSettings: true,
  setGadgetsMaintenance: async () => {},
});

export function SystemSettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isGadgetsMaintenance, setIsGadgetsMaintenance] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    if (!user) return;

    try {
      // 1. Escuchar la configuración en roles/_settings (compatible con reglas activas de Firestore)
      const rolesConfigRef = doc(db, 'roles', '_settings');
      const unsubscribeRoles = onSnapshot(
        rolesConfigRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setIsGadgetsMaintenance(data?.gadgetsMaintenance === true || data?.maintenanceMode === true);
          } else {
            setIsGadgetsMaintenance(false);
          }
          setLoadingSettings(false);
        },
        (error) => {
          console.warn("No se pudo cargar la configuración de roles/_settings:", error);
          setLoadingSettings(false);
        }
      );

      return () => unsubscribeRoles();
    } catch (err) {
      console.warn("Error inicializando listener de configuración:", err);
    }
  }, [user]);

  const setGadgetsMaintenance = async (enabled: boolean) => {
    // 1. Guardar en roles/_settings (autorizado por reglas de Firestore activas para admins)
    const rolesConfigRef = doc(db, 'roles', '_settings');
    await setDoc(rolesConfigRef, {
      gadgetsMaintenance: enabled,
      maintenanceMode: enabled,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.email || user?.uid || 'admin',
    }, { merge: true });

    // 2. Intento de respaldo en systemSettings/gadgets por si se despliegan reglas nuevas
    try {
      const systemSettingsRef = doc(db, 'systemSettings', 'gadgets');
      await setDoc(systemSettingsRef, {
        maintenanceMode: enabled,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || user?.uid || 'admin',
      }, { merge: true });
    } catch {
      // Ignorar fallo de permisos si systemSettings aún no existe en las reglas remotas
    }
  };

  return (
    <SystemSettingsContext.Provider
      value={{
        isGadgetsMaintenance,
        loadingSettings,
        setGadgetsMaintenance,
      }}
    >
      {children}
    </SystemSettingsContext.Provider>
  );
}

// eslint-disable-next-line react/only-export-components
export const useSystemSettings = () => useContext(SystemSettingsContext);
