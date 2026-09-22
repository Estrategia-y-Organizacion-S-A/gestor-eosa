import { useState, useEffect } from 'react';
import { Shield, Monitor, Wrench, Car, Plus, Trash2, RotateCcw, Edit, X, Users, ArrowRightLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { collection, getDocs, deleteDoc, doc, updateDoc, setDoc, writeBatch } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { db } from '../../firebase/config';
import { useGadgets } from '../gadgets/hooks/useGadgets';
import { useConfirm } from '../../contexts/ConfirmContext';

// Tipos básicos para el admin
interface AdminTrip {
  id: string;
  driverName: string;
  origin: string;
  destination: string;
  date: string;
}

interface AdminDesk {
  id: string;
  label: string;
  ownerId?: string;
  ownerName?: string;
  type?: string;
}

interface AppUser {
  id: string;
  email: string;
  displayName: string | null;
  status: 'active' | 'banned';
  lastLogin: string;
}

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'mesas' | 'gadgets' | 'carpooling' | 'roles' | 'usuarios'>('mesas');
  const { confirm } = useConfirm();
  
  // Data States
  const [trips, setTrips] = useState<AdminTrip[]>([]);
  const [allDesks, setAllDesks] = useState<AdminDesk[]>([]);
  const [habitualDesks, setHabitualDesks] = useState<AdminDesk[]>([]);
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  
  // Asignar Puesto Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignDeskId, setAssignDeskId] = useState('');

  // Mover Puesto Modal
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [deskToMove, setDeskToMove] = useState<AdminDesk | null>(null);
  const [moveTargetDeskId, setMoveTargetDeskId] = useState('');
  
  // Gadgets hook (reused)
  const { gadgets, returnGadget, deleteGadget, updateGadget } = useGadgets();
  const [newGadget, setNewGadget] = useState({ name: '', category: 'perifericos' as any, description: '' });
  const [editingGadget, setEditingGadget] = useState<any | null>(null);

  const fetchTrips = async () => {
    const snap = await getDocs(collection(db, 'carpoolTrips'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminTrip));
    setTrips(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const fetchDesks = async () => {
    const snap = await getDocs(collection(db, 'officeResources'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminDesk));
    
    const unique = Array.from(new Map(data.map(item => [item.label, item])).values());
    unique.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
    
    setAllDesks(unique);
    setHabitualDesks(unique.filter(d => d.ownerId));
  };

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppUser));
      setUsersList(data.sort((a, b) => {
        const timeA = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
        const timeB = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
        return timeB - timeA;
      }));
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Error al cargar usuarios. Revisa las reglas de Firestore.");
    }
  };

  // Fetch Data on mount
  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    fetchTrips();
    fetchDesks();
    fetchUsers();
  }, []);

  // Acciones de Admin
  const handleBanUser = async (userId: string, isBanned: boolean) => {
    const action = isBanned ? "reactivar" : "desactivar";
    const isConfirmed = await confirm({
      message: `¿Estás seguro de que deseas ${action} esta cuenta?`,
      confirmText: `Sí, ${action}`,
      cancelText: "Cancelar"
    });
    if (!isConfirmed) return;
    
    await updateDoc(doc(db, 'users', userId), { 
      status: isBanned ? 'active' : 'banned' 
    });
    toast.success(`Cuenta de usuario ${action}da`);
    fetchUsers();
  };
  const handleDeleteTrip = async (tripId: string) => {
    const isConfirmed = await confirm({
      message: "¿Estás seguro de que deseas eliminar este viaje? Esta acción es irreversible.",
      confirmText: "Sí, eliminar viaje",
      cancelText: "Cancelar"
    });
    if (!isConfirmed) return;
    
    await deleteDoc(doc(db, 'carpoolTrips', tripId));
    toast.success('Viaje eliminado (Moderación)');
    fetchTrips();
  };

  const handleForceReleaseDesk = async (deskId: string) => {
    const isConfirmed = await confirm({
      message: "¿Deseas liberar forzosamente esta mesa? Se desvinculará de su dueño actual.",
      confirmText: "Sí, liberar",
      cancelText: "Cancelar"
    });
    if (!isConfirmed) return;
    
    await updateDoc(doc(db, 'officeResources', deskId), { 
      ownerId: null,
      ownerName: null
    });
    toast.success('Puesto liberado');
    fetchDesks();
  };

  const handleAssignDesk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUserId || !assignDeskId) return;
    
    const userToAssign = usersList.find(u => u.id === assignUserId);
    if (!userToAssign) return;

    const userName = userToAssign.displayName || userToAssign.email?.split('@')[0] || 'Compañero';

    try {
      await updateDoc(doc(db, 'officeResources', assignDeskId), {
        ownerId: assignUserId,
        ownerName: userName
      });
      toast.success('Puesto asignado con éxito');
      setIsAssignModalOpen(false);
      setAssignUserId('');
      setAssignDeskId('');
      fetchDesks();
    } catch (error) {
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
      toast.error('Error al mover el puesto');
    }
  };

  const handleAddGadget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGadget.name.trim()) return;
    const newId = `gadget_${Date.now()}`;
    await setDoc(doc(db, 'gadgets', newId), {
      id: newId,
      name: newGadget.name,
      category: newGadget.category,
      description: newGadget.description.trim() || null,
      status: 'available',
      currentBorrowerId: null,
      borrowedAt: null
    });
    setNewGadget({ name: '', category: 'perifericos', description: '' });
    toast.success('Dispositivo añadido al inventario con éxito.');
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) return;
    
    const isConfirmed = await confirm({
      message: `¿Estás seguro de que quieres dar privilegios de Administrador a ${email}? Tendrá control total sobre la plataforma.`,
      confirmText: 'Otorgar Privilegios'
    });
    if (!isConfirmed) return;

    try {
      await setDoc(doc(db, 'roles', email), { isAdmin: true });
      setNewAdminEmail('');
      toast.success(`¡Privilegios de Administrador concedidos a ${email}!`);
    } catch (err) {
      console.error(err);
      toast.error('Hubo un error al otorgar los privilegios.');
    }
  };

  const availableDesks = allDesks.filter(d => !d.ownerId && d.type === 'seat');
  const usersWithoutDesk = usersList.filter(u => !habitualDesks.some(d => d.ownerId === u.id));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-md">
          <Shield className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Panel de Administración</h1>
          <p className="text-gray-500 text-sm">Modo Dios: Gestiona todos los recursos de la empresa con total potestad.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('mesas')}
            className={clsx(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-sm whitespace-nowrap",
              activeTab === 'mesas' ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"
            )}
          >
            <Monitor className="w-5 h-5" />
            Gestión de Mesas
          </button>
          
          <button
            onClick={() => setActiveTab('gadgets')}
            className={clsx(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-sm whitespace-nowrap",
              activeTab === 'gadgets' ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"
            )}
          >
            <Wrench className="w-5 h-5" />
            Inventario Gadgets
          </button>
          
          <button
            onClick={() => setActiveTab('carpooling')}
            className={clsx(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-sm whitespace-nowrap",
              activeTab === 'carpooling' ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"
            )}
          >
            <Car className="w-5 h-5" />
            Viajes Publicados
          </button>
          
          <button
            onClick={() => setActiveTab('usuarios')}
            className={clsx(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-sm whitespace-nowrap",
              activeTab === 'usuarios' ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"
            )}
          >
            <Users className="w-5 h-5" />
            Registro Usuarios
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={clsx(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-sm whitespace-nowrap mt-auto",
              activeTab === 'roles' ? "bg-red-50 text-brand-red shadow-sm border border-red-100" : "text-gray-600 hover:bg-gray-200"
            )}
          >
            <Shield className="w-5 h-5" />
            Accesos Admin
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8 bg-white overflow-y-auto">
          
          {/* TAB: USUARIOS */}
          {activeTab === 'usuarios' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Registro de Usuarios</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Lista de todos los usuarios que han iniciado sesión en la plataforma. Puedes desactivar cuentas para bloquear su acceso.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Usuario</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Último Acceso</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          Aún no hay usuarios registrados.
                        </td>
                      </tr>
                    ) : (
                      usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{u.displayName || 'Sin nombre'}</div>
                            <div className="text-sm text-gray-500">{u.email}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {u.lastLogin ? (
                              <>
                                {new Date(u.lastLogin).toLocaleDateString()} {new Date(u.lastLogin).toLocaleTimeString()}
                              </>
                            ) : (
                              "Desconocido"
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={clsx(
                              "px-2.5 py-1 rounded-full text-xs font-bold",
                              u.status === 'banned' ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                            )}>
                              {u.status === 'banned' ? 'Desactivado' : 'Activo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleBanUser(u.id, u.status === 'banned')}
                              className={clsx(
                                "text-sm font-medium hover:underline",
                                u.status === 'banned' ? "text-green-600" : "text-red-600"
                              )}
                            >
                              {u.status === 'banned' ? 'Reactivar' : 'Desactivar'}
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

          {/* TAB: ROLES */}
          {activeTab === 'roles' && (
            <div className="space-y-6 max-w-xl">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Gestión de Administradores</h2>
                <p className="text-sm text-gray-500 mt-1">Concede permisos de administrador a otros empleados. Ten cuidado, tendrán el mismo control que tú sobre la plataforma.</p>
              </div>

              <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100">
                <h3 className="font-bold text-brand-red mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Otorgar Rol de Admin
                </h3>
                <form onSubmit={handleAddAdmin} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico del usuario</label>
                    <input
                      type="email"
                      required
                      value={newAdminEmail}
                      onChange={e => setNewAdminEmail(e.target.value)}
                      placeholder="ejemplo@eosa.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none"
                    />
                  </div>
                  <button type="submit" className="bg-brand-red hover:bg-[#A31C30] text-white px-6 py-2.5 rounded-lg font-medium transition-colors w-full flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4" />
                    Hacer Administrador
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB: MESAS */}
          {activeTab === 'mesas' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Puestos Habituales Asignados</h2>
                  <p className="text-sm text-gray-500 mt-1">Revisa qué empleado tiene asignada cada mesa fija, muévelos de sitio o asigna un nuevo puesto.</p>
                </div>
                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-red text-white rounded-xl font-medium hover:bg-[#A31C30] transition-colors shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  Asignar puesto
                </button>
              </div>

              {habitualDesks.length === 0 ? (
                <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  No hay ningún puesto habitual asignado en este momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {habitualDesks.map(desk => (
                    <div key={desk.id} className="p-4 border border-gray-200 rounded-xl flex items-center justify-between hover:border-brand-red transition-colors">
                      <div>
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-md mb-2 inline-block">Mesa {desk.label}</span>
                        <p className="font-medium text-gray-900">{desk.ownerName || 'Usuario Desconocido'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setDeskToMove(desk);
                            setIsMoveModalOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Mover de puesto"
                        >
                          <ArrowRightLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleForceReleaseDesk(desk.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Liberar forzosamente"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: GADGETS */}
          {activeTab === 'gadgets' && (
            <div className="space-y-8">
              
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
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none"
                    />
                    <select
                      value={newGadget.category}
                      onChange={e => setNewGadget({...newGadget, category: e.target.value as any})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none bg-white"
                    >
                      <option value="perifericos">Periféricos (Ratón/Teclado)</option>
                      <option value="pantallas">Pantallas</option>
                      <option value="audiovisual">Audiovisual (Proyectores/Micros)</option>
                      <option value="cables">Cables / Adaptadores</option>
                    </select>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    <textarea
                      value={newGadget.description}
                      onChange={e => setNewGadget({...newGadget, description: e.target.value})}
                      placeholder="Descripción opcional (Ej. Guardado en la sala de reuniones, color negro, modelo exacto...)"
                      className="flex-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none resize-none"
                      rows={2}
                    ></textarea>
                    <button type="submit" className="bg-gray-900 hover:bg-black text-white px-6 py-2 rounded-lg font-medium transition-colors h-11 md:w-auto w-full">
                      Añadir Equipo
                    </button>
                  </div>
                </form>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Equipos actualmente prestados</h2>
                <div className="space-y-3">
                  {gadgets.filter(g => g.status === 'borrowed').length === 0 ? (
                    <p className="text-gray-500 italic">No hay ningún equipo prestado ahora mismo.</p>
                  ) : (
                    gadgets.filter(g => g.status === 'borrowed').map(g => (
                      <div key={g.id} className="p-4 border border-gray-200 rounded-xl flex items-center justify-between bg-red-50/30">
                        <div>
                          <p className="font-medium text-gray-900">{g.name}</p>
                          <p className="text-sm text-red-600 font-medium">En posesión de: {g.currentBorrowerName || 'Desconocido'}</p>
                        </div>
                        <button
                          onClick={async () => {
                            const isConfirmed = await confirm({
                              message: `¿Estás seguro de forzar la devolución de ${g.name}?`,
                              confirmText: 'Forzar Devolución'
                            });
                            if (isConfirmed) {
                              returnGadget(g.id);
                              toast.success('Equipo devuelto al inventario');
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
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
                        <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-md mb-2 inline-block uppercase">
                          {g.category}
                        </span>
                        <p className="font-medium text-gray-900">{g.name}</p>
                        {g.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{g.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0 ml-2">
                        <button
                          onClick={() => setEditingGadget(g)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar equipo"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={async () => {
                            const isConfirmed = await confirm({
                              message: `¿Estás seguro de que deseas eliminar permanentemente el equipo "${g.name}" del inventario?`,
                              confirmText: "Sí, eliminar",
                              cancelText: "Cancelar"
                            });
                            if (isConfirmed) {
                              deleteGadget(g.id);
                              toast.success('Equipo eliminado del inventario');
                            }
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar del inventario"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: CARPOOLING */}
          {activeTab === 'carpooling' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Moderación de Viajes</h2>
                <p className="text-sm text-gray-500 mt-1">Historial completo de viajes publicados en la plataforma.</p>
              </div>

              <div className="overflow-hidden border border-gray-200 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Conductor</th>
                      <th className="px-4 py-3 font-medium">Ruta</th>
                      <th className="px-4 py-3 font-medium text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {trips.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No hay viajes en la base de datos.</td>
                      </tr>
                    ) : (
                      trips.map(trip => (
                        <tr key={trip.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{trip.date}</td>
                          <td className="px-4 py-3 text-gray-600">{trip.driverName || 'Desconocido'}</td>
                          <td className="px-4 py-3 text-gray-600">{trip.origin} → {trip.destination}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDeleteTrip(trip.id)}
                              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Editar Equipo</h2>
              <button 
                onClick={() => setEditingGadget(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                try {
                  await updateGadget(editingGadget.id, {
                    name: formData.get('name') as string,
                    category: formData.get('category') as any,
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input 
                  type="text" 
                  name="name" 
                  defaultValue={editingGadget.name} 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select 
                  name="category" 
                  defaultValue={editingGadget.category} 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none bg-white"
                >
                  <option value="perifericos">Periféricos (Ratón/Teclado)</option>
                  <option value="pantallas">Pantallas</option>
                  <option value="audiovisual">Audiovisual (Proyectores/Micros)</option>
                  <option value="cables">Cables / Adaptadores</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea 
                  name="description" 
                  defaultValue={editingGadget.description || ''} 
                  rows={3}
                  placeholder="Descripción opcional"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none resize-none"
                ></textarea>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingGadget(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-brand-red text-white rounded-lg font-medium hover:bg-[#A31C30] transition-colors"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Asignar Puesto</h2>
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAssignDesk} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
                <select 
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none bg-white"
                >
                  <option value="">Selecciona un usuario...</option>
                  {usersWithoutDesk.map(u => (
                    <option key={u.id} value={u.id}>{u.displayName || u.email}</option>
                  ))}
                </select>
                {usersWithoutDesk.length === 0 && <p className="text-xs text-red-500 mt-1">No hay usuarios disponibles sin puesto fijo.</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mesa Libre</label>
                <select 
                  value={assignDeskId}
                  onChange={(e) => setAssignDeskId(e.target.value)}
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none bg-white"
                >
                  <option value="">Selecciona una mesa...</option>
                  {availableDesks.map(d => (
                    <option key={d.id} value={d.id}>Mesa {d.label}</option>
                  ))}
                </select>
                {availableDesks.length === 0 && <p className="text-xs text-red-500 mt-1">No hay mesas libres actualmente.</p>}
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={!assignUserId || !assignDeskId}
                  className="flex-1 px-4 py-2 bg-brand-red text-white rounded-lg font-medium hover:bg-[#A31C30] transition-colors disabled:opacity-50"
                >
                  Asignar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move Desk Modal */}
      {isMoveModalOpen && deskToMove && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Mover de Puesto</h2>
              <button 
                onClick={() => {
                  setIsMoveModalOpen(false);
                  setDeskToMove(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleMoveDesk} className="p-6 space-y-4">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm mb-4">
                Estás moviendo a <strong>{deskToMove.ownerName}</strong> desde la <strong>Mesa {deskToMove.label}</strong> a un nuevo asiento libre.
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Mesa</label>
                <select 
                  value={moveTargetDeskId}
                  onChange={(e) => setMoveTargetDeskId(e.target.value)}
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none bg-white"
                >
                  <option value="">Selecciona una nueva mesa...</option>
                  {availableDesks.map(d => (
                    <option key={d.id} value={d.id}>Mesa {d.label}</option>
                  ))}
                </select>
                {availableDesks.length === 0 && <p className="text-xs text-red-500 mt-1">No hay mesas libres a las que moverle.</p>}
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsMoveModalOpen(false);
                    setDeskToMove(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={!moveTargetDeskId}
                  className="flex-1 px-4 py-2 bg-brand-red text-white rounded-lg font-medium hover:bg-[#A31C30] transition-colors disabled:opacity-50"
                >
                  Mover Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
