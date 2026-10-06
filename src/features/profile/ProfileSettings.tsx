import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile, updateEmail, sendPasswordResetEmail, updatePassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { User, Shield, Bell, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export function ProfileSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');

  const [notifications, setNotifications] = useState({
    carpooling: true,
    system: true,
  });

  useEffect(() => {
    if (!user) return;
    const fetchPrefs = async () => {
      try {
        const d = await getDoc(doc(db, 'users', user.uid));
        if (d.exists() && d.data().notificationPrefs) {
          setNotifications(d.data().notificationPrefs);
        }
      } catch (e) {
        console.error('Error fetching notification preferences', e);
      }
    };
    fetchPrefs();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Corporate domain validation (@eosa.com)
      if (email && !/^[^\s@]+@eosa\.com$/i.test(email.trim())) {
        throw new Error("El correo debe terminar en @eosa.com por política corporativa.");
      }
      
      const promises = [];
      
      if (displayName !== user.displayName) {
        promises.push(updateProfile(user, { displayName: displayName.trim() }));
      }
      
      const userUpdates: Record<string, unknown> = {
        notificationPrefs: notifications,
        displayName: displayName.trim(),
      };
      
      if (email !== user.email) {
        const normalizedEmail = email.trim().toLowerCase();
        userUpdates.email = normalizedEmail;
        promises.push(updateEmail(user, normalizedEmail));
      }
      
      promises.push(setDoc(doc(db, 'users', user.uid), userUpdates, { merge: true }));

      if (newPassword) {
        if (newPassword.length < 6) {
          throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
        }
        promises.push(updatePassword(user, newPassword));
      }

      if (promises.length > 0) {
        await Promise.all(promises);
        setSuccess('Perfil actualizado correctamente.');
        setNewPassword(''); // Clear password field after success
      } else {
        setSuccess('No se han realizado cambios.');
      }
      
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setError('Por razones de seguridad, para cambiar tu correo o contraseña necesitas cerrar sesión y volver a entrar.');
      } else {
        setError(err.message || 'Error al actualizar el perfil.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setSuccess('Se ha enviado un correo oficial de Firebase para restablecer tu contraseña. Revisa tu bandeja de entrada.');
    } catch (err: any) {
      setError(err.message || 'Error al enviar el correo.');
    } finally {
      setLoading(false);
    }
  };

  const initial = (user?.displayName || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-brand-red text-white text-2xl font-bold rounded-2xl flex items-center justify-center shadow-md">
          {initial}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Mi Perfil</h1>
          <p className="text-gray-500 text-sm">Gestiona tu información personal y preferencias</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-3 border border-green-100">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-3 border border-red-100">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda (Datos y Seguridad) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: Información Personal */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <User className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-bold text-gray-900">Información Personal</h2>
            </div>
            <div className="p-6">
              <form id="profile-form" onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition-colors"
                  />
                  <p className="text-xs text-gray-500">Este nombre será visible para tus compañeros en Viajes y Gadgets.</p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    Nueva Contraseña (Opcional)
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition-colors"
                  />
                  <p className="text-xs text-gray-500">Solo rellénalo si deseas cambiar tu contraseña actual.</p>
                </div>
              </form>
            </div>
            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                form="profile-form"
                disabled={loading}
                className="bg-brand-red hover:bg-[#A31C30] text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>
            </div>
          </div>

          {/* Card: Seguridad Inteligente */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-bold text-gray-900">Seguridad</h2>
            </div>
            <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900 text-sm mb-1">Restablecer Contraseña por Email</p>
                <p className="text-xs text-gray-500 max-w-sm">Si prefieres no usar el formulario de arriba, podemos enviarte un enlace oficial seguro para cambiar tu contraseña.</p>
              </div>
              <button
                onClick={handlePasswordReset}
                disabled={loading}
                className="w-full md:w-auto px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
              >
                Enviar enlace de recuperación
              </button>
            </div>
          </div>

        </div>

        {/* Columna Derecha (Preferencias) */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <Bell className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-bold text-gray-900">Notificaciones</h2>
            </div>
            <div className="p-6 space-y-4">

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-start">
                  <input type="checkbox" className="sr-only peer" checked={notifications.carpooling} onChange={(e) => setNotifications({...notifications, carpooling: e.target.checked})} />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-red"></div>
                </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-900 block mb-0.5">Viajes</span>
                    <span className="text-gray-500 text-xs">Avisarme si reservan un asiento en mi coche</span>
                  </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-start">
                  <input type="checkbox" className="sr-only peer" checked={notifications.system} onChange={(e) => setNotifications({...notifications, system: e.target.checked})} />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-red"></div>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-900 block mb-0.5">Sistema y Cuenta</span>
                  <span className="text-gray-500 text-xs">Avisos importantes de administración</span>
                </div>
              </label>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
