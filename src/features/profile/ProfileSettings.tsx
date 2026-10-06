import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile, updateEmail, sendPasswordResetEmail, updatePassword } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { 
  User, 
  Shield, 
  Bell, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Eye, 
  EyeOff, 
  Building2, 
  Car, 
  Laptop, 
  Layers, 
  ArrowRight,
  Mail
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';

interface HabitualDesk {
  id: string;
  label: string;
}

interface MyTrip {
  id: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  role: 'conductor' | 'pasajero';
}

interface MyGadget {
  id: string;
  name: string;
  category: string;
  durationLabel?: string | null;
  expectedEndDate?: string | null;
}

export function ProfileSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'personal' | 'recursos' | 'seguridad' | 'notificaciones'>('personal');

  // Estados de carga y feedback
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pestaña 1: Información Personal
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');

  // Pestaña 2: Mis Recursos (consultados en tiempo real)
  const [habitualDesk, setHabitualDesk] = useState<HabitualDesk | null>(null);
  const [myTrips, setMyTrips] = useState<MyTrip[]>([]);
  const [myGadgets, setMyGadgets] = useState<MyGadget[]>([]);

  // Pestaña 3: Seguridad
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Pestaña 4: Notificaciones
  const [notifications, setNotifications] = useState({
    carpooling: true,
    system: true,
  });

  // Cargar preferencias de notificaciones
  useEffect(() => {
    if (!user) return;
    const fetchPrefs = async () => {
      try {
        const d = await getDoc(doc(db, 'users', user.uid));
        if (d.exists() && d.data().notificationPrefs) {
          setNotifications(d.data().notificationPrefs);
        }
      } catch (e) {
        console.error('Error al cargar preferencias de notificación', e);
      }
    };
    fetchPrefs();
  }, [user]);

  // Cargar Puesto Habitual
  useEffect(() => {
    if (!user) return;
    const qDesks = query(collection(db, 'officeResources'), where('ownerId', '==', user.uid));
    const unsubDesks = onSnapshot(qDesks, (snap) => {
      if (!snap.empty) {
        const docData = snap.docs[0].data();
        setHabitualDesk({
          id: snap.docs[0].id,
          label: docData.label || snap.docs[0].id
        });
      } else {
        setHabitualDesk(null);
      }
    }, (err) => {
      console.error('Error al cargar puesto habitual:', err);
    });

    return unsubDesks;
  }, [user]);

  // Cargar Gadgets en préstamo
  useEffect(() => {
    if (!user) return;
    const qGadgets = query(collection(db, 'gadgets'), where('currentBorrowerId', '==', user.uid));
    const unsubGadgets = onSnapshot(qGadgets, (snap) => {
      const list = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          category: data.category,
          durationLabel: data.durationLabel,
          expectedEndDate: data.expectedEndDate
        } as MyGadget;
      });
      setMyGadgets(list);
    }, (err) => {
      console.error('Error al cargar gadgets:', err);
    });

    return unsubGadgets;
  }, [user]);

  // Cargar Viajes próximos (conductor o pasajero)
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const qTrips = query(collection(db, 'carpoolTrips'), where('date', '>=', today));
    const qBookings = query(collection(db, 'carpoolBookings'), where('passengerId', '==', user.uid));

    let allTripsData: any[] = [];
    let passengerTripIds = new Set<string>();

    const updateCombinedTrips = () => {
      const combined: MyTrip[] = [];
      allTripsData.forEach(t => {
        if (t.driverId === user.uid) {
          combined.push({
            id: t.id,
            origin: t.origin,
            destination: t.destination,
            date: t.date,
            time: t.time,
            role: 'conductor'
          });
        } else if (passengerTripIds.has(t.id)) {
          combined.push({
            id: t.id,
            origin: t.origin,
            destination: t.destination,
            date: t.date,
            time: t.time,
            role: 'pasajero'
          });
        }
      });
      combined.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
      setMyTrips(combined);
    };

    const unsubTrips = onSnapshot(qTrips, (snap) => {
      allTripsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      updateCombinedTrips();
    }, (err) => console.error('Error al escuchar viajes:', err));

    const unsubBookings = onSnapshot(qBookings, (snap) => {
      passengerTripIds = new Set(snap.docs.map(d => d.data().tripId));
      updateCombinedTrips();
    }, (err) => console.error('Error al escuchar reservas:', err));

    return () => {
      unsubTrips();
      unsubBookings();
    };
  }, [user]);

  // Manejo de actualización de datos personales
  const handleUpdatePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (email && !/^[^\s@]+@eosa\.com$/i.test(email.trim())) {
        throw new Error("El correo debe pertenecer al dominio corporativo @eosa.com.");
      }

      const promises = [];
      if (displayName.trim() !== (user.displayName || '')) {
        promises.push(updateProfile(user, { displayName: displayName.trim() }));
      }

      const userUpdates: Record<string, unknown> = {
        displayName: displayName.trim(),
      };

      if (email.trim().toLowerCase() !== (user.email || '').toLowerCase()) {
        const normalizedEmail = email.trim().toLowerCase();
        userUpdates.email = normalizedEmail;
        promises.push(updateEmail(user, normalizedEmail));
      }

      promises.push(setDoc(doc(db, 'users', user.uid), userUpdates, { merge: true }));
      await Promise.all(promises);

      setSuccess('Datos personales guardados correctamente.');
      toast.success('Información personal actualizada.');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setError('Por seguridad, para modificar tu correo necesitas cerrar sesión y volver a entrar.');
      } else {
        setError(err.message || 'Error al actualizar los datos personales.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Manejo de cambio de contraseña directo
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!newPassword) {
        throw new Error("Introduce una nueva contraseña.");
      }
      if (newPassword.length < 6) {
        throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
      }
      if (newPassword !== confirmPassword) {
        throw new Error("Las contraseñas introducidas no coinciden.");
      }

      await updatePassword(user, newPassword);
      setSuccess('Contraseña cambiada con éxito.');
      toast.success('Contraseña actualizada correctamente.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setError('Por motivos de seguridad, para cambiar tu contraseña debes cerrar sesión y volver a identificarte recientemente.');
      } else {
        setError(err.message || 'Error al actualizar la contraseña.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Enviar correo de restablecimiento
  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setSuccess(`Se ha enviado un enlace oficial de recuperación a ${user.email}. Revisa tu bandeja de entrada.`);
      toast.success('Enlace de recuperación enviado por email.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al enviar el correo de recuperación.');
    } finally {
      setLoading(false);
    }
  };

  // Guardar preferencias de notificaciones
  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await setDoc(doc(db, 'users', user.uid), {
        notificationPrefs: notifications
      }, { merge: true });
      setSuccess('Preferencias de notificaciones guardadas.');
      toast.success('Preferencias de notificaciones guardadas.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al guardar las preferencias.');
    } finally {
      setLoading(false);
    }
  };

  const initial = (displayName || user?.displayName || user?.email || 'U').charAt(0).toUpperCase();
  const totalRecursos = (habitualDesk ? 1 : 0) + myTrips.length + myGadgets.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Cabecera del Perfil (Hero Header) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-2xs relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-brand-red" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-brand-red text-white text-2xl font-black rounded-2xl flex items-center justify-center shadow-2xs border border-rose-300/40 shrink-0">
              {initial}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                {displayName || user?.displayName || 'Mi Perfil'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {user?.email || 'Gestiona tu información personal y preferencias'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas de Feedback */}
      {success && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 border border-emerald-200/80 shadow-2xs text-xs sm:text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="font-semibold">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 text-rose-800 p-4 rounded-2xl flex items-center gap-3 border border-rose-200/80 shadow-2xs text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 text-brand-red shrink-0" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Contenedor Principal con Pestañas */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs overflow-hidden">
        
        {/* Barra de Navegación de Pestañas */}
        <div className="flex border-b border-gray-200 bg-gray-50/70 px-4 pt-2 gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => { setActiveTab('personal'); setError(null); setSuccess(null); }}
            className={clsx(
              "px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer",
              activeTab === 'personal'
                ? "border-brand-red text-brand-red bg-white rounded-t-2xl shadow-2xs"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 rounded-t-2xl"
            )}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>Información Personal</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('recursos'); setError(null); setSuccess(null); }}
            className={clsx(
              "px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer",
              activeTab === 'recursos'
                ? "border-brand-red text-brand-red bg-white rounded-t-2xl shadow-2xs"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 rounded-t-2xl"
            )}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Mis Recursos en EOSA</span>
            {totalRecursos > 0 && (
              <span className={clsx(
                "text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1",
                activeTab === 'recursos' ? "bg-rose-100 text-brand-red" : "bg-gray-200 text-gray-600"
              )}>
                {totalRecursos}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('seguridad'); setError(null); setSuccess(null); }}
            className={clsx(
              "px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer",
              activeTab === 'seguridad'
                ? "border-brand-red text-brand-red bg-white rounded-t-2xl shadow-2xs"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 rounded-t-2xl"
            )}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>Seguridad</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('notificaciones'); setError(null); setSuccess(null); }}
            className={clsx(
              "px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer",
              activeTab === 'notificaciones'
                ? "border-brand-red text-brand-red bg-white rounded-t-2xl shadow-2xs"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 rounded-t-2xl"
            )}
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span>Notificaciones</span>
          </button>
        </div>

        {/* Contenido de la Pestaña Activa */}
        <div className="p-6 sm:p-8">

          {/* TAB 1: INFORMACIÓN PERSONAL */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900">Datos Personales</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Actualiza tu nombre visible para los compañeros en las distintas herramientas del Gestor EOSA.
                </p>
              </div>

              <form onSubmit={handleUpdatePersonal} className="space-y-5 max-w-xl">
                <div className="space-y-1.5">
                  <label htmlFor="displayName" className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ej. Lara Loveira"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50/50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red outline-none transition-all"
                  />
                  <p className="text-xs text-gray-500">
                    Este nombre será visible para tus compañeros en Viajes, Puestos y Gadgets.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Correo Electrónico Corporativo
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50/50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red outline-none transition-all font-mono"
                  />
                  <p className="text-xs text-gray-400">
                    Identificador de acceso exclusivo bajo el dominio <span className="font-semibold text-gray-600">@eosa.com</span>.
                  </p>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 bg-brand-red hover:bg-[#a31b31] text-white text-xs sm:text-sm font-bold py-2.5 px-5 rounded-xl transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: MIS RECURSOS EN EOSA */}
          {activeTab === 'recursos' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900">Mis Recursos Activos</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Consulta de un vistazo tu puesto de trabajo habitual, tus próximos viajes y los gadgets que tienes en préstamo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Tarjeta: Mi Puesto Habitual */}
                <div className="bg-gray-50/70 border border-gray-200 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2.5 text-slate-800 font-bold text-sm mb-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span>Puesto Habitual</span>
                    </div>

                    {habitualDesk ? (
                      <div className="space-y-1">
                        <div className="text-lg font-black text-gray-900">
                          {habitualDesk.label}
                        </div>
                        <p className="text-xs text-gray-500 leading-snug">
                          Asignado como tu puesto habitual en las oficinas de EOSA.
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 leading-snug">
                        Actualmente no tienes un puesto habitual asignado en el plano de la oficina.
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-2 border-t border-gray-200/80">
                    <Link
                      to="/desks"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-red hover:underline"
                    >
                      <span>{habitualDesk ? 'Ver en plano de oficina' : 'Elegir puesto en el mapa'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Tarjeta: Mis Viajes Activos */}
                <div className="bg-gray-50/70 border border-gray-200 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2.5 text-brand-red font-bold text-sm mb-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-brand-red">
                        <Car className="w-4 h-4" />
                      </div>
                      <span>Mis Viajes Activos</span>
                    </div>

                    {myTrips.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-lg font-black text-gray-900">
                          {myTrips.length} {myTrips.length === 1 ? 'viaje programado' : 'viajes programados'}
                        </div>
                        <div className="space-y-1.5">
                          {myTrips.slice(0, 2).map((t) => (
                            <div key={t.id} className="text-xs bg-white p-2 rounded-lg border border-gray-200/80">
                              <div className="font-semibold text-gray-800 truncate">
                                {t.origin} → {t.destination}
                              </div>
                              <div className="text-[11px] text-gray-500 flex items-center justify-between mt-0.5">
                                <span>{t.date} · {t.time}</span>
                                <span className={clsx(
                                  "font-bold uppercase text-[9px] px-1.5 py-0.2 rounded",
                                  t.role === 'conductor' ? "bg-rose-50 text-brand-red" : "bg-blue-50 text-blue-700"
                                )}>
                                  {t.role}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 leading-snug">
                        No tienes ningún viaje compartido programado próximamente.
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-2 border-t border-gray-200/80">
                    <Link
                      to="/carpooling"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-red hover:underline"
                    >
                      <span>{myTrips.length > 0 ? 'Ver todos los viajes' : 'Explorar rutas disponibles'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Tarjeta: Mis Gadgets en Préstamo */}
                <div className="bg-gray-50/70 border border-gray-200 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2.5 text-amber-800 font-bold text-sm mb-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <span>Gadgets en Préstamo</span>
                    </div>

                    {myGadgets.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-lg font-black text-gray-900">
                          {myGadgets.length} {myGadgets.length === 1 ? 'equipo en tu poder' : 'equipos en tu poder'}
                        </div>
                        <div className="space-y-1.5">
                          {myGadgets.slice(0, 2).map((g) => (
                            <div key={g.id} className="text-xs bg-white p-2 rounded-lg border border-gray-200/80">
                              <div className="font-semibold text-gray-800 truncate">
                                {g.name}
                              </div>
                              <div className="text-[11px] text-gray-500 mt-0.5 capitalize">
                                {g.durationLabel || g.category}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 leading-snug">
                        No tienes ningún dispositivo o material periférico en préstamo en este momento.
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-2 border-t border-gray-200/80">
                    <Link
                      to="/gadgets"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-red hover:underline"
                    >
                      <span>{myGadgets.length > 0 ? 'Gestionar mis préstamos' : 'Ver catálogo de material'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: SEGURIDAD */}
          {activeTab === 'seguridad' && (
            <div className="space-y-8 max-w-xl">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900">Seguridad y Credenciales</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Cambia tu contraseña de acceso a la plataforma o solicita un enlace de restablecimiento oficial por email.
                </p>
              </div>

              {/* Formulario de Cambio Directo de Contraseña */}
              <form onSubmit={handleUpdatePassword} className="space-y-4 bg-gray-50/70 p-5 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-2 text-gray-900 font-bold text-xs uppercase tracking-wider mb-1">
                  <Lock className="w-4 h-4 text-brand-red" />
                  <span>Cambiar Contraseña</span>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="newPassword" className="block text-xs font-semibold text-gray-700">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red outline-none transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-700">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red outline-none transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !newPassword}
                    className="inline-flex items-center gap-2 bg-brand-red hover:bg-[#a31b31] text-white text-xs sm:text-sm font-bold py-2.5 px-5 rounded-xl transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{loading ? 'Actualizando...' : 'Actualizar Contraseña'}</span>
                  </button>
                </div>
              </form>

              {/* Opción de restablecimiento por Email */}
              <div className="p-5 rounded-2xl bg-white border border-gray-200 space-y-3">
                <div className="flex items-center gap-2 text-gray-900 font-bold text-xs uppercase tracking-wider">
                  <Mail className="w-4 h-4 text-brand-red" />
                  <span>Restablecer Contraseña por Correo</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Si prefieres no usar el formulario anterior, podemos enviarte un enlace oficial seguro a tu correo corporativo <strong className="text-gray-800">{user?.email}</strong> para que definas una nueva contraseña.
                </p>
                <div>
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    <span>Enviar enlace de recuperación por email</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICACIONES */}
          {activeTab === 'notificaciones' && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900">Preferencias de Notificaciones</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Elige qué avisos deseas recibir en tu cuenta del Gestor EOSA.
                </p>
              </div>

              <form onSubmit={handleSaveNotifications} className="space-y-4">
                
                <div className="p-4 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 transition-colors">
                  <label className="flex items-start gap-3.5 cursor-pointer">
                    <div className="relative flex items-center pt-0.5">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifications.carpooling} 
                        onChange={(e) => setNotifications({ ...notifications, carpooling: e.target.checked })} 
                      />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-red"></div>
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 text-sm block">Viajes y Carpooling</span>
                      <span className="text-gray-500 text-xs leading-relaxed block mt-0.5">
                        Avisarme si algún compañero reserva un asiento en mi coche o cancela su plaza.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="p-4 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 transition-colors">
                  <label className="flex items-start gap-3.5 cursor-pointer">
                    <div className="relative flex items-center pt-0.5">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifications.system} 
                        onChange={(e) => setNotifications({ ...notifications, system: e.target.checked })} 
                      />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-red"></div>
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 text-sm block">Sistema y Cuenta</span>
                      <span className="text-gray-500 text-xs leading-relaxed block mt-0.5">
                        Avisos importantes de administración del portal corporativo.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 bg-brand-red hover:bg-[#a31b31] text-white text-xs sm:text-sm font-bold py-2.5 px-5 rounded-xl transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Guardando...' : 'Guardar Preferencias'}</span>
                  </button>
                </div>

              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
