import { useState, useEffect, useMemo } from 'react';
import { 
  Shield, ShieldCheck, Monitor, Wrench, Car, Plus, Trash2, 
  RotateCcw, Edit, X, Users, ArrowRightLeft, Search, RefreshCw, 
  MapPin, CheckCircle2, AlertCircle, AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';
import { collection, getDocs, deleteDoc, doc, updateDoc, setDoc, writeBatch } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { db } from '../../firebase/config';
import { useGadgets } from '../gadgets/hooks/useGadgets';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useSystemSettings } from '../../contexts/SystemSettingsContext';
import { ErrorBoundary } from '../../components/ErrorBoundary';

// Tipos para el admin
interface AdminTrip {
  id: string;
  driverName: string;
  origin: string;
  destination: string;
  date: string;
  driverId?: string;
  driverEmail?: string;
}

interface AdminDesk {
  id: string;
  label: string;
  ownerId?: string | null;
  ownerName?: string | null;
  type?: string;
}

interface AppUser {
  id: string;
  email: string;
  displayName: string | null;
  status: 'active' | 'banned';
  lastLogin?: any;
  last_login?: any;
  lastLoginAt?: any;
  lastActive?: any;
  createdAt?: any;
  updatedAt?: any;
}

interface RoleEntry {
  email: string;
  isAdmin: boolean;
  isGadgetManager: boolean;
}

// Helper para parsear cualquier formato de fecha de Firestore/JS de manera segura
function parseDateValue(value: any): Date | null {
  if (!value) return null;
  // Objeto Timestamp de Firestore con método .toDate()
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    try {
      const d = value.toDate();
      return d instanceof Date && !isNaN(d.getTime()) ? d : null;
    } catch {
      return null;
    }
  }
  // Objeto serializado { seconds, nanoseconds } o { _seconds, _nanoseconds }
  if (typeof value === 'object') {
    const sec = typeof value.seconds === 'number' 
      ? value.seconds 
      : (typeof value._seconds === 'number' ? value._seconds : null);
    if (sec !== null) {
      const d = new Date(sec * 1000);
      return d instanceof Date && !isNaN(d.getTime()) ? d : null;
    }
  }
  // Número (ms desde epoch o seconds)
  if (typeof value === 'number') {
    const ms = value < 10000000000 ? value * 1000 : value;
    const d = new Date(ms);
    return d instanceof Date && !isNaN(d.getTime()) ? d : null;
  }
  // String ISO o YYYY-MM-DD
  if (typeof value === 'string') {
    const d = new Date(value);
    return d instanceof Date && !isNaN(d.getTime()) ? d : null;
  }
  return null;
}

// Obtener la fecha más reciente de actividad del usuario
function getUserActivityDate(u: AppUser): Date | null {
  if (!u) return null;
  return (
    parseDateValue(u.lastLogin) ||
    parseDateValue(u.last_login) ||
    parseDateValue(u.lastLoginAt) ||
    parseDateValue(u.lastActive) ||
    parseDateValue(u.updatedAt) ||
    parseDateValue(u.createdAt)
  );
}

// Formateador relativo y amigable para el administrador
function formatRelativeDate(date: Date | null): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return 'Desconocido';
  try {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    // Si por desfase de reloj está ligeramente en el futuro
    if (diffMs < 0 && Math.abs(diffMs) < 300000) {
      return 'Hace unos instantes';
    }

    if (diffMin >= 0 && diffMin < 5) return 'Hace unos instantes';
    if (diffMin >= 5 && diffMin < 60) return `Hace ${diffMin} min`;
    
    const isToday = now.toDateString() === date.toDateString();
    const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) return `Hoy a las ${timeStr}`;

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (yesterday.toDateString() === date.toDateString()) {
      return `Ayer a las ${timeStr}`;
    }

    if (diffDays >= 0 && diffDays < 7) {
      return `Hace ${diffDays} días (${date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })})`;
    }

    return `${date.toLocaleDateString('es-ES')} ${timeStr}`;
  } catch (err) {
    console.error("Error formatting date:", err);
    return 'Desconocido';
  }
}

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'mesas' | 'gadgets' | 'carpooling' | 'roles' | 'usuarios'>('mesas');
  const { confirm } = useConfirm();
  const { isGadgetsMaintenance, setGadgetsMaintenance } = useSystemSettings();
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);
  
  // Data States
  const [trips, setTrips] = useState<AdminTrip[]>([]);
  const [allDesks, setAllDesks] = useState<AdminDesk[]>([]);
  const [habitualDesks, setHabitualDesks] = useState<AdminDesk[]>([]);
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [rolesList, setRolesList] = useState<RoleEntry[]>([]);
  
  // Search & Filter States
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'banned'>('all');
  const [deskSearchQuery, setDeskSearchQuery] = useState('');
  const [tripSearchQuery, setTripSearchQuery] = useState('');

  // Role Assignment State
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [selectedRoleToAssign, setSelectedRoleToAssign] = useState<'admin' | 'gadget_manager'>('gadget_manager');
  
  // Asignar Puesto Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignDeskId, setAssignDeskId] = useState('');

  // Mover Puesto Modal
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [deskToMove, setDeskToMove] = useState<AdminDesk | null>(null);
  const [moveTargetDeskId, setMoveTargetDeskId] = useState('');
  
  // Sincronización de actividad
  const [isSyncingLogins, setIsSyncingLogins] = useState(false);

  // Gadgets hook
  const { gadgets, returnGadget, deleteGadget, updateGadget } = useGadgets();
  const [newGadget, setNewGadget] = useState({ name: '', category: 'perifericos' as any, location: '', description: '' });
  const [editingGadget, setEditingGadget] = useState<any | null>(null);

  // Fetches
  const fetchTrips = async () => {
    try {
      const snap = await getDocs(collection(db, 'carpoolTrips'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminTrip));
      setTrips(data.sort((a, b) => {
        const timeA = parseDateValue(a.date)?.getTime() || 0;
        const timeB = parseDateValue(b.date)?.getTime() || 0;
        return timeB - timeA;
      }));
    } catch (err) {
      console.error("Error al cargar viajes:", err);
    }
  };

  const fetchDesks = async () => {
    try {
      const snap = await getDocs(collection(db, 'officeResources'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminDesk));
      
      const unique = Array.from(new Map(data.map(item => [item.label, item])).values());
      unique.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
      
      setAllDesks(unique);
      setHabitualDesks(unique.filter(d => d.ownerId));
    } catch (err) {
      console.error("Error al cargar mesas:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const data = snap.docs.map(d => {
        const raw = d.data() || {};
        return {
          id: d.id,
          email: raw.email || '',
          displayName: raw.displayName || null,
          status: raw.status === 'banned' ? 'banned' : 'active',
          ...raw
        } as AppUser;
      });
      setUsersList(data.sort((a, b) => {
        const dateA = getUserActivityDate(a);
        const dateB = getUserActivityDate(b);
        const timeA = dateA ? dateA.getTime() : 0;
        const timeB = dateB ? dateB.getTime() : 0;
        return timeB - timeA;
      }));
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Error al cargar usuarios. Revisa las reglas de Firestore.");
    }
  };

  const fetchRoles = async () => {
    try {
      const snap = await getDocs(collection(db, 'roles'));
      const list: RoleEntry[] = [];
      snap.docs.forEach(docSnap => {
        // Excluir documentos de configuración del sistema como _settings
        if (docSnap.id.startsWith('_') || !docSnap.id.includes('@')) return;
        const d = docSnap.data() || {};
        list.push({
          email: docSnap.id || '',
          isAdmin: d.isAdmin === true,
          isGadgetManager: d.isGadgetManager === true || d.role === 'gadget_manager'
        });
      });
      setRolesList(list.sort((a, b) => (a.email || '').localeCompare(b.email || '')));
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  // Fetch Data on mount
  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    void Promise.all([fetchTrips(), fetchDesks(), fetchUsers(), fetchRoles()]);
  }, []);

  // Acciones de Usuario
  const handleBanUser = async (userId: string, isBanned: boolean) => {
    const action = isBanned ? "reactivar" : "desactivar";
    const isConfirmed = await confirm({
      message: `¿Estás seguro de que deseas ${action} esta cuenta?`,
      confirmText: `Sí, ${action}`,
      cancelText: "Cancelar"
    });
    if (!isConfirmed) return;
    
    try {
      await updateDoc(doc(db, 'users', userId), { 
        status: isBanned ? 'active' : 'banned' 
      });
      toast.success(`Cuenta de usuario ${action}da`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(`Error al ${action} el usuario.`);
    }
  };

  // Sincronizar usuarios que tienen última conexión desconocida
  const handleSyncMissingLogins = async () => {
    setIsSyncingLogins(true);
    let updatedCount = 0;
    try {
      const batch = writeBatch(db);
      const nowIso = new Date().toISOString();

      for (const u of usersList) {
        const hasDate = getUserActivityDate(u);
        if (!hasDate) {
          // Buscamos si tiene alguna actividad registrada en viajes o puestos
          const hasDesk = allDesks.find(d => d.ownerId === u.id);
          const userEmail = (u.email || '').toLowerCase();
          const hasTrip = trips.find(t => 
            t.driverId === u.id || 
            (t.driverEmail && userEmail && t.driverEmail.toLowerCase() === userEmail)
          );
          
          let dateToSet = nowIso;
          if (hasTrip && hasTrip.date) {
            const tripDate = parseDateValue(hasTrip.date);
            if (tripDate) dateToSet = tripDate.toISOString();
          } else if (hasDesk) {
            // Usuario con puesto habitual activo
            dateToSet = nowIso;
          }

          batch.set(doc(db, 'users', u.id), {
            lastLogin: dateToSet,
            lastActive: dateToSet,
            email: u.email
          }, { merge: true });
          updatedCount++;
        }
      }

      if (updatedCount > 0) {
        await batch.commit();
        toast.success(`¡Sincronizada la última conexión de ${updatedCount} usuario(s)!`);
        await fetchUsers();
      } else {
        toast.success("Todos los usuarios ya tienen su fecha de conexión registrada.");
      }
    } catch (err) {
      console.error("Error sincronizando conexiones:", err);
      toast.error("Error al sincronizar las fechas.");
    } finally {
      setIsSyncingLogins(false);
    }
  };

  // Acciones de Viajes
  const handleDeleteTrip = async (tripId: string) => {
    const isConfirmed = await confirm({
      message: "¿Estás seguro de que deseas eliminar este viaje? Esta acción es irreversible.",
      confirmText: "Sí, eliminar viaje",
      cancelText: "Cancelar"
    });
    if (!isConfirmed) return;
    
    try {
      await deleteDoc(doc(db, 'carpoolTrips', tripId));
      toast.success('Viaje eliminado (Moderación)');
      fetchTrips();
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar el viaje.");
    }
  };

  // Acciones de Mesas
  const handleForceReleaseDesk = async (deskId: string) => {
    const isConfirmed = await confirm({
      message: "¿Deseas liberar forzosamente esta mesa? Se desvinculará de su dueño actual.",
      confirmText: "Sí, liberar",
      cancelText: "Cancelar"
    });
    if (!isConfirmed) return;
    
    try {
      await updateDoc(doc(db, 'officeResources', deskId), { 
        ownerId: null,
        ownerName: null
      });
      toast.success('Puesto liberado');
      fetchDesks();
    } catch (err) {
      console.error(err);
      toast.error("Error al liberar la mesa.");
    }
  };

  // Asignar Puesto con liberación atómica de mesa previa (Bug Fix silencioso)
  const handleAssignDesk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUserId || !assignDeskId) return;
    
    const userToAssign = usersList.find(u => u.id === assignUserId);
    if (!userToAssign) return;

    const userName = userToAssign.displayName || userToAssign.email?.split('@')[0] || 'Compañero';

    try {
      const batch = writeBatch(db);

      // Si el usuario ya tenía otra mesa fija asignada, la liberamos para no duplicar puestos
      const currentDesk = allDesks.find(d => d.ownerId === assignUserId);
      if (currentDesk && currentDesk.id !== assignDeskId) {
        batch.update(doc(db, 'officeResources', currentDesk.id), {
          ownerId: null,
          ownerName: null
        });
      }

      // Asignamos la nueva mesa
      batch.update(doc(db, 'officeResources', assignDeskId), {
        ownerId: assignUserId,
        ownerName: userName
      });

      await batch.commit();

      toast.success('Puesto asignado con éxito');
      setIsAssignModalOpen(false);
      setAssignUserId('');
      setAssignDeskId('');
      fetchDesks();
    } catch (error) {
      console.error("Error al asignar puesto:", error);
      toast.error('Error al asignar el puesto');
    }
  };

  const handleMoveDesk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deskToMove || !moveTargetDeskId) return;

    try {
      const batch = writeBatch(db);
      
      // Liberar el viejo
      batch.update(doc(db, 'officeResources', deskToMove.id), {
        ownerId: null,
        ownerName: null
      });

      // Asignar el nuevo
      batch.update(doc(db, 'officeResources', moveTargetDeskId), {
        ownerId: deskToMove.ownerId,
        ownerName: deskToMove.ownerName
      });

      await batch.commit();

      toast.success('Puesto movido con éxito');
      setIsMoveModalOpen(false);
      setDeskToMove(null);
      setMoveTargetDeskId('');
      fetchDesks();
    } catch (error) {
      console.error("Error al mover puesto:", error);
      toast.error('Error al mover el puesto');
    }
  };

  // Acciones de Gadgets
  const handleAddGadget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGadget.name.trim()) return;
    const newId = `gadget_${Date.now()}`;
    try {
      await setDoc(doc(db, 'gadgets', newId), {
        id: newId,
        name: newGadget.name.trim(),
        category: newGadget.category,
        location: newGadget.location.trim() || null,
        description: newGadget.description.trim() || null,
        status: 'available',
        currentBorrowerId: null,
        currentBorrowerName: null,
        currentBorrowerEmail: null,
        borrowedAt: null,
        createdAt: new Date().toISOString()
      });
      setNewGadget({ name: '', category: 'perifericos', location: '', description: '' });
      toast.success('Dispositivo añadido al inventario con éxito.');
    } catch (err) {
      console.error(err);
      toast.error("Error al añadir el dispositivo.");
    }
  };

  const handleToggleGadgetsMaintenance = async () => {
    const nextState = !isGadgetsMaintenance;
    const isConfirmed = await confirm({
      title: nextState ? 'Activar modo mantenimiento' : 'Desactivar modo mantenimiento',
      message: nextState
        ? '¿Deseas ocultar la pestaña y accesos de Gadgets para todos los empleados normales? Solo los Administradores Globales y Gestores de Gadgets tendrán acceso hasta que desactives el mantenimiento.'
        : '¿Deseas hacer visible la sección de Gadgets para todos los empleados en la barra de navegación y el Dashboard?',
      confirmText: nextState ? 'Sí, activar mantenimiento' : 'Sí, hacer público',
      cancelText: 'Cancelar'
    });

    if (!isConfirmed) return;

    try {
      setIsTogglingMaintenance(true);
      await setGadgetsMaintenance(nextState);
      if (nextState) {
        toast.success('Modo mantenimiento activado: Gadgets oculto para usuarios normales');
      } else {
        toast.success('Modo mantenimiento desactivado: Gadgets visible para todos');
      }
    } catch (err: any) {
      console.error("Error cambiando modo mantenimiento:", err);
      toast.error(err?.message || 'Error al actualizar el modo de mantenimiento en Firestore');
    } finally {
      setIsTogglingMaintenance(false);
    }
  };

  // Acciones de Roles
  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) return;
    
    const roleName = selectedRoleToAssign === 'admin' ? 'Administrador Global' : 'Gestor de Gadgets';
    const roleDesc = selectedRoleToAssign === 'admin'
      ? 'Tendrá control total sobre la plataforma (mesas, viajes, usuarios, roles y gadgets).'
      : 'Podrá gestionar el inventario de gadgets (añadir, editar, eliminar y forzar devoluciones), sin acceso al resto del panel de administración.';

    const isConfirmed = await confirm({
      message: `¿Estás seguro de que quieres dar el rol de "${roleName}" a ${email}? ${roleDesc}`,
      confirmText: 'Otorgar Rol',
      cancelText: 'Cancelar'
    });
    if (!isConfirmed) return;

    try {
      const roleRef = doc(db, 'roles', email);
      if (selectedRoleToAssign === 'admin') {
        await setDoc(roleRef, { email, isAdmin: true }, { merge: true });
      } else {
        await setDoc(roleRef, { email, isGadgetManager: true }, { merge: true });
      }
      setNewAdminEmail('');
      toast.success(`¡Rol de ${roleName} concedido a ${email}!`);
      fetchRoles();
    } catch (err) {
      console.error(err);
      toast.error('Hubo un error al otorgar el rol.');
    }
  };

  const handleRevokeRole = async (email: string, roleType: 'admin' | 'gadget_manager') => {
    const roleName = roleType === 'admin' ? 'Administrador' : 'Gestor de Gadgets';
    const isConfirmed = await confirm({
      message: `¿Deseas revocar el rol de ${roleName} a ${email}?`,
      confirmText: 'Revocar Rol',
      cancelText: 'Cancelar'
    });
    if (!isConfirmed) return;

    try {
      const roleRef = doc(db, 'roles', email);
      if (roleType === 'admin') {
        await setDoc(roleRef, { isAdmin: false }, { merge: true });
      } else {
        await setDoc(roleRef, { isGadgetManager: false }, { merge: true });
      }
      toast.success(`Rol de ${roleName} revocado a ${email}`);
      fetchRoles();
    } catch (err) {
      console.error(err);
      toast.error('Error al revocar el rol.');
    }
  };

  // Filtrados y colecciones calculadas
  // Excluimos meeting_room de mesas asignables (Bug fix)
  const availableDesks = allDesks.filter(d => !d.ownerId && d.type !== 'meeting_room');
  const usersWithoutDesk = usersList.filter(u => u && !habitualDesks.some(d => d.ownerId === u.id));

  // Filtrado de usuarios
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      if (!u) return false;
      if (userStatusFilter === 'active' && u.status === 'banned') return false;
      if (userStatusFilter === 'banned' && u.status !== 'banned') return false;

      if (userSearchQuery.trim()) {
        const q = userSearchQuery.toLowerCase();
        const matchName = u.displayName?.toLowerCase().includes(q) || false;
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        return matchName || matchEmail;
      }
      return true;
    });
  }, [usersList, userStatusFilter, userSearchQuery]);

  // Filtrado de mesas
  const filteredHabitualDesks = useMemo(() => {
    if (!deskSearchQuery.trim()) return habitualDesks;
    const q = deskSearchQuery.toLowerCase();
    return habitualDesks.filter(d => 
      d.label.toLowerCase().includes(q) ||
      d.ownerName?.toLowerCase().includes(q)
    );
  }, [habitualDesks, deskSearchQuery]);

  // Filtrado de viajes
  const filteredTrips = useMemo(() => {
    if (!tripSearchQuery.trim()) return trips;
    const q = tripSearchQuery.toLowerCase();
    return trips.filter(t => 
      t.driverName?.toLowerCase().includes(q) ||
      t.origin?.toLowerCase().includes(q) ||
      t.destination?.toLowerCase().includes(q) ||
      t.date?.includes(q)
    );
  }, [trips, tripSearchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
          <Shield className="w-7 h-7 text-brand-red" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Gestión integral de puestos, inventario, viajes y usuarios de EOSA.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row min-h-[650px]">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 bg-gray-50/80 border-r border-gray-200 p-4 flex flex-row md:flex-col gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('mesas')}
            className={clsx(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-sm whitespace-nowrap",
              activeTab === 'mesas' ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200/60"
            )}
          >
            <Monitor className="w-4 h-4" />
            Gestión de Mesas
          </button>
          
          <button
            onClick={() => setActiveTab('gadgets')}
            className={clsx(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-sm whitespace-nowrap",
              activeTab === 'gadgets' ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200/60"
            )}
          >
            <Wrench className="w-4 h-4" />
            <span>Inventario Gadgets</span>
            {isGadgetsMaintenance && (
              <span className={clsx(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto uppercase tracking-wider",
                activeTab === 'gadgets' ? "bg-amber-400 text-gray-900" : "bg-amber-100 text-amber-800 border border-amber-200"
              )}>
                Mantenimiento
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('carpooling')}
            className={clsx(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-sm whitespace-nowrap",
              activeTab === 'carpooling' ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200/60"
            )}
          >
            <Car className="w-4 h-4" />
            Viajes Publicados
          </button>
          
          <button
            onClick={() => setActiveTab('usuarios')}
            className={clsx(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-sm whitespace-nowrap",
              activeTab === 'usuarios' ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200/60"
            )}
          >
            <Users className="w-4 h-4" />
            Registro Usuarios
            <span className={clsx(
              "text-xs px-2 py-0.5 rounded-full ml-auto",
              activeTab === 'usuarios' ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
            )}>
              {usersList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={clsx(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-sm whitespace-nowrap md:mt-auto",
              activeTab === 'roles' ? "bg-red-50 text-brand-red shadow-sm border border-red-200 font-bold" : "text-gray-600 hover:bg-gray-200/60"
            )}
          >
            <ShieldCheck className="w-4 h-4 text-brand-red" />
            Accesos y Roles
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8 bg-white overflow-y-auto">
          
          {/* TAB 1: REGISTRO DE USUARIOS (MEJORADO Y CON RESOLUCIÓN DE ÚLTIMA CONEXIÓN) */}
          {activeTab === 'usuarios' && (
            <ErrorBoundary fallbackTitle="Error al cargar el Registro de Usuarios">
              <div className="space-y-6">
                
                <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Registro de Usuarios y Actividad</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Historial de conexiones, roles y estado de las cuentas de EOSA.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleSyncMissingLogins}
                    disabled={isSyncingLogins}
                    className="flex items-center gap-2 px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs sm:text-sm font-medium transition-colors self-start sm:self-auto disabled:opacity-50"
                    title="Sincroniza y repara usuarios sin fecha de conexión detectada"
                  >
                    <RefreshCw className={clsx("w-3.5 h-3.5 text-brand-red", isSyncingLogins && "animate-spin")} />
                    {isSyncingLogins ? 'Sincronizando...' : 'Sincronizar Fechas'}
                  </button>
                </div>

                {/* Users KPI Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</span>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">{usersList.length}</p>
                  </div>
                  <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Activos</span>
                    <p className="text-xl font-bold text-emerald-800 mt-0.5">{usersList.filter(u => u && u.status !== 'banned').length}</p>
                  </div>
                  <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-100">
                    <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Desactivados</span>
                    <p className="text-xl font-bold text-rose-800 mt-0.5">{usersList.filter(u => u && u.status === 'banned').length}</p>
                  </div>
                  <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Con Mesa Fija</span>
                    <p className="text-xl font-bold text-blue-800 mt-0.5">{habitualDesks.length}</p>
                  </div>
                </div>

                {/* Toolbar: Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Buscar por nombre o email..."
                      className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none"
                    />
                    {userSearchQuery && (
                      <button onClick={() => setUserSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200 self-start sm:self-auto">
                    <button
                      onClick={() => setUserStatusFilter('all')}
                      className={clsx(
                        "px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors",
                        userStatusFilter === 'all' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      Todos ({usersList.length})
                    </button>
                    <button
                      onClick={() => setUserStatusFilter('active')}
                      className={clsx(
                        "px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors",
                        userStatusFilter === 'active' ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      Activos
                    </button>
                    <button
                      onClick={() => setUserStatusFilter('banned')}
                      className={clsx(
                        "px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors",
                        userStatusFilter === 'banned' ? "bg-white text-rose-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      Desactivados
                    </button>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/80 border-b border-gray-200">
                      <tr>
                        <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Usuario</th>
                        <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Rol / Recursos</th>
                        <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Última Conexión</th>
                        <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                            No se encontraron usuarios coincidentes.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          if (!u) return null;
                          const userEmail = (u.email || '').toLowerCase();
                          const activityDate = getUserActivityDate(u);
                          const isGlobalAdmin = rolesList.some(r => r?.email && r.email.toLowerCase() === userEmail && r.isAdmin);
                          const isGadgetMgr = rolesList.some(r => r?.email && r.email.toLowerCase() === userEmail && r.isGadgetManager);
                          const assignedDesk = allDesks.find(d => d.ownerId === u.id);
                          const formattedRelative = formatRelativeDate(activityDate);

                          const displayTitle = u.displayName || (u.email ? u.email.split('@')[0] : 'Usuario');
                          const displayEmail = u.email || 'Sin correo registrado';

                          return (
                            <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                              <td className="px-5 py-3.5">
                                <div className="font-semibold text-gray-900">
                                  {displayTitle}
                                </div>
                                <div className="text-xs text-gray-500">{displayEmail}</div>
                              </td>

                              <td className="px-5 py-3.5">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {isGlobalAdmin && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-50 text-brand-red border border-red-200">
                                      <Shield className="w-3 h-3" />
                                      Admin
                                    </span>
                                  )}
                                  {isGadgetMgr && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <ShieldCheck className="w-3 h-3" />
                                      Gestor Gadgets
                                    </span>
                                  )}
                                  {assignedDesk && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                      <MapPin className="w-3 h-3 text-blue-500" />
                                      Mesa {assignedDesk.label}
                                    </span>
                                  )}
                                  {!isGlobalAdmin && !isGadgetMgr && !assignedDesk && (
                                    <span className="text-xs text-gray-400 font-normal">Empleado</span>
                                  )}
                                </div>
                              </td>

                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-1.5">
                                  {activityDate && (
                                    <span className={clsx(
                                      "w-2 h-2 rounded-full flex-shrink-0",
                                      (new Date().getTime() - activityDate.getTime()) < 86400000 ? "bg-emerald-500 animate-pulse" : "bg-gray-300"
                                    )} />
                                  )}
                                  <span 
                                    className={clsx(
                                      "text-xs font-medium",
                                      activityDate ? "text-gray-700" : "text-amber-600 bg-amber-50 px-2 py-0.5 rounded"
                                    )}
                                    title={activityDate ? `Exacto: ${activityDate.toLocaleString('es-ES')}` : 'Fecha no registrada en el login'}
                                  >
                                    {formattedRelative}
                                  </span>
                                </div>
                              </td>

                              <td className="px-5 py-3.5">
                                <span className={clsx(
                                  "px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1",
                                  u.status === 'banned' ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                                )}>
                                  {u.status === 'banned' ? (
                                    <>
                                      <AlertCircle className="w-3 h-3" />
                                      Desactivado
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" />
                                      Activo
                                    </>
                                  )}
                                </span>
                              </td>

                              <td className="px-5 py-3.5 text-right">
                                <button
                                  onClick={() => handleBanUser(u.id, u.status === 'banned')}
                                  className={clsx(
                                    "text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors",
                                    u.status === 'banned' 
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                                      : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                  )}
                                >
                                  {u.status === 'banned' ? 'Reactivar Cuenta' : 'Desactivar Cuenta'}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </ErrorBoundary>
          )}

          {/* TAB 2: ACCESOS Y ROLES */}
          {activeTab === 'roles' && (
            <div className="space-y-8">
              <div className="border-b border-gray-100 pb-4 mb-2">
                <h2 className="text-xl font-bold text-gray-900">Gestión de Permisos y Roles</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Administra quién tiene permisos de <strong>Administrador Global</strong> (control total de la plataforma) y quién tiene rol de <strong>Gestor de Gadgets</strong> (gestión del inventario técnico sin acceso al resto del sistema).
                </p>
              </div>

              {/* Roles explanation cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-red-200 bg-red-50/40">
                  <div className="flex items-center gap-2 mb-1.5 text-brand-red font-bold text-sm">
                    <Shield className="w-4 h-4" />
                    Administrador Global
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Control absoluto: puestos habituales, forzar liberaciones de mesas, moderación de viajes de carpooling, bloqueo de usuarios, asignación de roles y gadgets.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
                  <div className="flex items-center gap-2 mb-1.5 text-emerald-700 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    Gestor de Gadgets
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Gestión directa de material informático y audiovisual: dar de alta equipos, editar fichas, forzar devoluciones y organizar taquillas. <strong>Sin acceso a mesas, viajes ni usuarios</strong>.
                  </p>
                </div>
              </div>

              {/* Form to assign role */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <Plus className="w-4 h-4 text-brand-red" />
                  Asignar Nuevo Rol
                </h3>
                <form onSubmit={handleAssignRole} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Usuario / Correo electrónico
                      </label>
                      <input
                        type="email"
                        required
                        list="users-datalist"
                        value={newAdminEmail}
                        onChange={e => setNewAdminEmail(e.target.value)}
                        placeholder="ejemplo@eosa.com"
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none"
                      />
                      <datalist id="users-datalist">
                        {usersList.map(u => (
                          <option key={u.id} value={u.email}>{u.displayName ? `${u.displayName} (${u.email})` : u.email}</option>
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Rol a Otorgar
                      </label>
                      <select
                        value={selectedRoleToAssign}
                        onChange={e => setSelectedRoleToAssign(e.target.value as any)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none"
                      >
                        <option value="gadget_manager">🛡️ Gestor de Gadgets (Recomendado)</option>
                        <option value="admin">👑 Administrador Global (Control Total)</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-medium transition-colors text-sm self-end flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Conceder Rol
                  </button>
                </form>
              </div>

              {/* Roles List Table */}
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center justify-between">
                  <span>Usuarios con Roles Asignados</span>
                  <span className="text-xs font-normal text-gray-500">
                    {rolesList.filter(r => r.isAdmin || r.isGadgetManager).length} en total
                  </span>
                </h3>

                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">Usuario / Correo</th>
                        <th className="px-5 py-3.5">Rol asignado</th>
                        <th className="px-5 py-3.5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rolesList.filter(r => r.isAdmin || r.isGadgetManager).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-5 py-8 text-center text-gray-500 text-sm">
                            No hay ningún rol asignado aún en la base de datos.
                          </td>
                        </tr>
                      ) : (
                        rolesList.filter(r => r.isAdmin || r.isGadgetManager).map(r => (
                          <tr key={r.email} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3.5 font-medium text-gray-900">
                              {r.email}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex flex-wrap gap-1.5">
                                {r.isAdmin && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-brand-red border border-red-200">
                                    <Shield className="w-3 h-3" />
                                    Admin Global
                                  </span>
                                )}
                                {r.isGadgetManager && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <ShieldCheck className="w-3 h-3" />
                                    Gestor de Gadgets
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {r.isAdmin && (
                                  <button
                                    onClick={() => handleRevokeRole(r.email, 'admin')}
                                    className="text-xs text-red-600 hover:text-red-800 hover:underline font-medium"
                                  >
                                    Quitar Admin
                                  </button>
                                )}
                                {r.isGadgetManager && (
                                  <button
                                    onClick={() => handleRevokeRole(r.email, 'gadget_manager')}
                                    className="text-xs text-amber-600 hover:text-amber-800 hover:underline font-medium"
                                  >
                                    Quitar Gestor
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: GESTIÓN DE MESAS */}
          {activeTab === 'mesas' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Puestos Habituales Asignados</h2>
                  <p className="text-sm text-gray-500 mt-1">Revisa qué empleado tiene asignada cada mesa fija, muévelos de sitio o asigna un nuevo puesto.</p>
                </div>
                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-red text-white rounded-xl font-medium hover:bg-[#A31C30] transition-colors shadow-sm text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Asignar puesto
                </button>
              </div>

              {/* Search Bar for Desks */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={deskSearchQuery}
                    onChange={(e) => setDeskSearchQuery(e.target.value)}
                    placeholder="Buscar mesa o empleado..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none"
                  />
                </div>
                <div className="text-xs text-gray-500">
                  Total asignadas: <strong>{habitualDesks.length}</strong> | Libres: <strong>{availableDesks.length}</strong>
                </div>
              </div>

              {filteredHabitualDesks.length === 0 ? (
                <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  {habitualDesks.length === 0 ? 'No hay ningún puesto habitual asignado en este momento.' : 'No se encontraron mesas que coincidan con la búsqueda.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredHabitualDesks.map(desk => (
                    <div key={desk.id} className="p-4 border border-gray-200 rounded-xl flex items-center justify-between hover:border-brand-red transition-colors bg-white">
                      <div>
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-md mb-1 inline-block">Mesa {desk.label}</span>
                        <p className="font-semibold text-gray-900">{desk.ownerName || 'Usuario Desconocido'}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setDeskToMove(desk);
                            setIsMoveModalOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
                          title="Mover de puesto"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleForceReleaseDesk(desk.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-gray-200"
                          title="Liberar forzosamente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GADGETS */}
          {activeTab === 'gadgets' && (
            <div className="space-y-8">
              
              {/* Modo Mantenimiento de Gadgets */}
              <div className={clsx(
                "p-6 rounded-2xl border transition-all shadow-sm",
                isGadgetsMaintenance
                  ? "bg-amber-50/70 border-amber-200"
                  : "bg-white border-gray-200"
              )}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className={clsx(
                      "p-3 rounded-xl flex items-center justify-center flex-shrink-0",
                      isGadgetsMaintenance
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                    )}>
                      {isGadgetsMaintenance ? (
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                      ) : (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-base">
                          Modo Mantenimiento de Gadgets
                        </h3>
                        <span className={clsx(
                          "px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5",
                          isGadgetsMaintenance
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        )}>
                          <span className={clsx(
                            "w-2 h-2 rounded-full",
                            isGadgetsMaintenance ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                          )} />
                          {isGadgetsMaintenance ? "Activo (Oculto para empleados)" : "Inactivo (Visible para todos)"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 max-w-2xl leading-relaxed">
                        {isGadgetsMaintenance
                          ? "La sección de Gadgets está oculta en la navegación y el Dashboard para todos los empleados comunes. Solo los Administradores Globales y Gestores de Gadgets pueden verla para dar de alta equipos y configurar el inventario sin confusiones."
                          : "El catálogo de Gadgets está visible y accesible para todos los empleados de la empresa en la barra de navegación y el Dashboard."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center sm:self-center">
                    <button
                      type="button"
                      disabled={isTogglingMaintenance}
                      onClick={handleToggleGadgetsMaintenance}
                      className={clsx(
                        "w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50",
                        isGadgetsMaintenance
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-amber-500 hover:bg-amber-600 text-white"
                      )}
                    >
                      {isTogglingMaintenance ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : isGadgetsMaintenance ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Desactivar Mantenimiento (Hacer público)
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4" />
                          Activar Modo Mantenimiento
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-brand-red" />
                  Añadir nuevo equipo al inventario
                </h3>
                <form onSubmit={handleAddGadget} className="flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <input
                      type="text"
                      required
                      value={newGadget.name}
                      onChange={e => setNewGadget({...newGadget, name: e.target.value})}
                      placeholder="Ej. Ratón Inalámbrico HP..."
                      className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none text-sm"
                    />
                    <select
                      value={newGadget.category}
                      onChange={e => setNewGadget({...newGadget, category: e.target.value as any})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none bg-white text-sm"
                    >
                      <option value="perifericos">Periféricos (Ratón/Teclado)</option>
                      <option value="pantallas">Pantallas</option>
                      <option value="audiovisual">Audiovisual (Proyectores/Micros)</option>
                      <option value="cables">Cables / Adaptadores</option>
                    </select>
                    <input
                      type="text"
                      value={newGadget.location}
                      onChange={e => setNewGadget({...newGadget, location: e.target.value})}
                      placeholder="Ubicación (Ej. Taquilla 2, Armario A)..."
                      className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none text-sm"
                    />
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    <textarea
                      value={newGadget.description}
                      onChange={e => setNewGadget({...newGadget, description: e.target.value})}
                      placeholder="Descripción opcional (Ej. Guardado en la sala de reuniones, color negro, modelo exacto...)"
                      className="flex-1 w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none resize-none text-sm"
                      rows={2}
                    />
                    <button type="submit" className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-lg font-medium transition-colors h-11 md:w-auto w-full text-sm">
                      Añadir Equipo
                    </button>
                  </div>
                </form>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Equipos actualmente prestados</h2>
                <div className="space-y-3">
                  {gadgets.filter(g => g.status === 'borrowed').length === 0 ? (
                    <p className="text-gray-500 italic text-sm">No hay ningún equipo prestado ahora mismo.</p>
                  ) : (
                    gadgets.filter(g => g.status === 'borrowed').map(g => (
                      <div key={g.id} className="p-4 border border-gray-200 rounded-xl flex items-center justify-between bg-red-50/30">
                        <div>
                          <p className="font-semibold text-gray-900">{g.name}</p>
                          <p className="text-xs text-rose-600 font-medium mt-0.5">En posesión de: {g.currentBorrowerName || 'Desconocido'}</p>
                          {g.location && <p className="text-[11px] text-gray-500">Punto de entrega: {g.location}</p>}
                        </div>
                        <button
                          onClick={async () => {
                            const isConfirmed = await confirm({
                              message: `¿Estás seguro de forzar la devolución de ${g.name}?`,
                              confirmText: 'Forzar Devolución'
                            });
                            if (isConfirmed) {
                              await returnGadget(g.id);
                              toast.success('Equipo devuelto al inventario');
                            }
                          }}
                          className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-medium transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Forzar Devolución
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Inventario completo</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {gadgets.map(g => (
                    <div key={g.id} className="p-4 border border-gray-200 rounded-xl flex items-start justify-between bg-white hover:border-brand-red transition-colors">
                      <div>
                        <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-md mb-1.5 inline-block uppercase">
                          {g.category}
                        </span>
                        <p className="font-bold text-gray-900 text-sm">{g.name}</p>
                        {g.location && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-500" />
                            {g.location}
                          </p>
                        )}
                        {g.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{g.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0 ml-2">
                        <button
                          onClick={() => setEditingGadget(g)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
                          title="Editar equipo"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            const isConfirmed = await confirm({
                              message: `¿Estás seguro de que deseas eliminar permanentemente el equipo "${g.name}" del inventario?`,
                              confirmText: "Sí, eliminar",
                              cancelText: "Cancelar"
                            });
                            if (isConfirmed) {
                              await deleteGadget(g.id);
                              toast.success('Equipo eliminado del inventario');
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-gray-200"
                          title="Eliminar del inventario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CARPOOLING */}
          {activeTab === 'carpooling' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Moderación de Viajes</h2>
                  <p className="text-sm text-gray-500 mt-1">Historial y control de viajes publicados en la plataforma.</p>
                </div>

                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={tripSearchQuery}
                    onChange={(e) => setTripSearchQuery(e.target.value)}
                    placeholder="Buscar por conductor o ruta..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none"
                  />
                </div>
              </div>

              <div className="overflow-hidden border border-gray-200 rounded-xl bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-5 py-3">Fecha</th>
                      <th className="px-5 py-3">Conductor</th>
                      <th className="px-5 py-3">Ruta</th>
                      <th className="px-5 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTrips.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-gray-500 text-sm">
                          {trips.length === 0 ? 'No hay viajes en la base de datos.' : 'No se encontraron viajes con ese criterio.'}
                        </td>
                      </tr>
                    ) : (
                      filteredTrips.map(trip => (
                        <tr key={trip.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-gray-900">{trip.date}</td>
                          <td className="px-5 py-3.5 text-gray-700">{trip.driverName || 'Desconocido'}</td>
                          <td className="px-5 py-3.5 text-gray-600 font-medium">{trip.origin} → {trip.destination}</td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => handleDeleteTrip(trip.id)}
                              className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg transition-colors border border-gray-200"
                              title="Eliminar viaje"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Edit Gadget Modal */}
      {editingGadget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/60">
              <h2 className="text-lg font-bold text-gray-900">Editar Equipo</h2>
              <button 
                onClick={() => setEditingGadget(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                try {
                  await updateGadget(editingGadget.id, {
                    name: (formData.get('name') as string).trim(),
                    category: formData.get('category') as any,
                    location: (formData.get('location') as string).trim() || null,
                    description: (formData.get('description') as string).trim() || null
                  });
                  toast.success('Equipo actualizado con éxito');
                  setEditingGadget(null);
                } catch (error: any) {
                  toast.error(error.message || 'Error al actualizar el equipo');
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Nombre</label>
                <input 
                  type="text" 
                  name="name" 
                  defaultValue={editingGadget.name} 
                  required 
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Categoría</label>
                <select 
                  name="category" 
                  defaultValue={editingGadget.category} 
                  required 
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red outline-none bg-white text-sm"
                >
                  <option value="perifericos">Periféricos (Ratón/Teclado)</option>
                  <option value="pantallas">Pantallas</option>
                  <option value="audiovisual">Audiovisual (Proyectores/Micros)</option>
                  <option value="cables">Cables / Adaptadores</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Ubicación física / Taquilla</label>
                <input 
                  type="text" 
                  name="location" 
                  defaultValue={editingGadget.location || ''} 
                  placeholder="Ej: Taquilla 2, Armario A..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Descripción</label>
                <textarea 
                  name="description" 
                  defaultValue={editingGadget.description || ''} 
                  rows={3}
                  placeholder="Descripción opcional"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red outline-none resize-none text-sm"
                />
              </div>
              
              <div className="pt-4 flex gap-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setEditingGadget(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-brand-red text-white rounded-xl font-medium hover:bg-[#A31C30] transition-colors text-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Desk Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/60">
              <h2 className="text-lg font-bold text-gray-900">Asignar Puesto Habitual</h2>
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAssignDesk} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Empleado</label>
                <select 
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  required 
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red outline-none bg-white text-sm"
                >
                  <option value="">Selecciona un usuario...</option>
                  {usersWithoutDesk.map(u => (
                    <option key={u.id} value={u.id}>{u.displayName ? `${u.displayName} (${u.email})` : u.email}</option>
                  ))}
                </select>
                {usersWithoutDesk.length === 0 && <p className="text-xs text-rose-500 mt-1">Todos los usuarios ya tienen puesto asignado.</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Mesa Libre</label>
                <select 
                  value={assignDeskId}
                  onChange={(e) => setAssignDeskId(e.target.value)}
                  required 
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red outline-none bg-white text-sm"
                >
                  <option value="">Selecciona una mesa libre...</option>
                  {availableDesks.map(d => (
                    <option key={d.id} value={d.id}>Mesa {d.label}</option>
                  ))}
                </select>
                {availableDesks.length === 0 && <p className="text-xs text-rose-500 mt-1">No hay mesas libres disponibles actualmente.</p>}
              </div>
              
              <div className="pt-4 flex gap-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={!assignUserId || !assignDeskId}
                  className="flex-1 px-4 py-2 bg-brand-red text-white rounded-xl font-medium hover:bg-[#A31C30] transition-colors disabled:opacity-50 text-sm"
                >
                  Asignar Puesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move Desk Modal */}
      {isMoveModalOpen && deskToMove && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/60">
              <h2 className="text-lg font-bold text-gray-900">Mover de Puesto</h2>
              <button 
                onClick={() => {
                  setIsMoveModalOpen(false);
                  setDeskToMove(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleMoveDesk} className="p-6 space-y-4">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-xs sm:text-sm border border-blue-200/60">
                Estás moviendo a <strong>{deskToMove.ownerName}</strong> desde la <strong>Mesa {deskToMove.label}</strong> a un nuevo asiento libre. Sus ausencias programadas se mantendrán automáticamente.
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Nueva Mesa Destino</label>
                <select 
                  value={moveTargetDeskId}
                  onChange={(e) => setMoveTargetDeskId(e.target.value)}
                  required 
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red outline-none bg-white text-sm"
                >
                  <option value="">Selecciona una nueva mesa...</option>
                  {availableDesks.map(d => (
                    <option key={d.id} value={d.id}>Mesa {d.label}</option>
                  ))}
                </select>
                {availableDesks.length === 0 && <p className="text-xs text-rose-500 mt-1">No hay mesas libres a las que moverle.</p>}
              </div>
              
              <div className="pt-4 flex gap-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsMoveModalOpen(false);
                    setDeskToMove(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={!moveTargetDeskId}
                  className="flex-1 px-4 py-2 bg-brand-red text-white rounded-xl font-medium hover:bg-[#A31C30] transition-colors disabled:opacity-50 text-sm"
                >
                  Confirmar Traslado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
