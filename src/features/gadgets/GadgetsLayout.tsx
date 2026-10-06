import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Monitor, Video, Mouse, Cable, PackageSearch, Hand, CheckCircle2, 
  RotateCcw, Search, Plus, Trash2, Edit, MapPin, 
  Info, X, Clock, ShieldCheck, AlertCircle, AlertTriangle, ArrowLeft, Wrench
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
import { useGadgets, type Gadget } from './hooks/useGadgets';
import { GadgetsGuideModal } from './GadgetsGuideModal';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useSystemSettings } from '../../contexts/SystemSettingsContext';

export function GadgetsLayout() {
  const navigate = useNavigate();
  const { user, isAdmin, canManageGadgets } = useAuth();
  const { isGadgetsMaintenance } = useSystemSettings();
  const { confirm } = useConfirm();
  const { gadgets, loading, borrowGadget, returnGadget, addGadget, updateGadget, deleteGadget } = useGadgets();

  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState<'catalogo' | 'mis' | 'gestion'>('catalogo');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Borrow Modal State
  const [borrowModalGadget, setBorrowModalGadget] = useState<Gadget | null>(null);
  const [durationPreset, setDurationPreset] = useState<'today' | 'tomorrow' | 'week' | 'custom'>('today');
  const [customEndDate, setCustomEndDate] = useState('');
  const [borrowNotes, setBorrowNotes] = useState('');
  const [isSubmittingBorrow, setIsSubmittingBorrow] = useState(false);

  // Manage Modal State (Create / Edit)
  const [manageModal, setManageModal] = useState<{ mode: 'create' | 'edit'; gadget?: Gadget } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'perifericos' as Gadget['category'],
    location: '',
    description: ''
  });

  // Categories definitions
  const categories: { id: string; label: string; icon: any }[] = [
    { id: 'todos', label: 'Todos los equipos', icon: PackageSearch },
    { id: 'pantallas', label: 'Pantallas', icon: Monitor },
    { id: 'audiovisual', label: 'Audiovisual', icon: Video },
    { id: 'perifericos', label: 'Periféricos', icon: Mouse },
    { id: 'cables', label: 'Cables y adaptadores', icon: Cable },
  ];

  // Calculated collections
  const myGadgets = useMemo(() => {
    if (!user) return [];
    return gadgets.filter(g => g.currentBorrowerId === user.uid);
  }, [gadgets, user]);

  const filteredGadgets = useMemo(() => {
    return gadgets.filter(g => {
      // Filter by tab
      if (activeTab === 'mis' && g.currentBorrowerId !== user?.uid) return false;

      // Filter by category
      if (selectedCategory !== 'todos' && g.category !== selectedCategory) return false;

      // Filter by availability
      if (onlyAvailable && g.status !== 'available') return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = g.name.toLowerCase().includes(query);
        const matchesDesc = g.description?.toLowerCase().includes(query) || false;
        const matchesLoc = g.location?.toLowerCase().includes(query) || false;
        const matchesBorrower = g.currentBorrowerName?.toLowerCase().includes(query) || false;
        return matchesName || matchesDesc || matchesLoc || matchesBorrower;
      }

      return true;
    });
  }, [gadgets, activeTab, selectedCategory, onlyAvailable, searchQuery, user]);

  // Stats
  const stats = useMemo(() => {
    const total = gadgets.length;
    const available = gadgets.filter(g => g.status === 'available').length;
    const borrowed = gadgets.filter(g => g.status === 'borrowed').length;
    const myCount = myGadgets.length;
    return { total, available, borrowed, myCount };
  }, [gadgets, myGadgets]);

  const getCategoryDetails = (category: string) => {
    switch (category) {
      case 'pantallas':
        return { label: 'Pantalla', icon: Monitor, color: 'bg-blue-50 text-blue-600 border-blue-200' };
      case 'audiovisual':
        return { label: 'Audiovisual', icon: Video, color: 'bg-purple-50 text-purple-600 border-purple-200' };
      case 'perifericos':
        return { label: 'Periférico', icon: Mouse, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
      case 'cables':
        return { label: 'Cables / Adaptador', icon: Cable, color: 'bg-amber-50 text-amber-600 border-amber-200' };
      default:
        return { label: 'Equipo', icon: PackageSearch, color: 'bg-gray-50 text-gray-600 border-gray-200' };
    }
  };

  // Handlers
  const handleOpenBorrowModal = (gadget: Gadget) => {
    setBorrowModalGadget(gadget);
    setDurationPreset('today');
    setCustomEndDate('');
    setBorrowNotes('');
  };

  const handleConfirmBorrow = async () => {
    if (!borrowModalGadget) return;
    setIsSubmittingBorrow(true);

    try {
      let durationLabel = 'Solo hoy';
      let expectedEndDate: string | undefined = undefined;

      if (durationPreset === 'today') {
        durationLabel = 'Solo hoy (hasta fin de jornada)';
        const endOfDay = new Date();
        endOfDay.setHours(19, 0, 0, 0);
        expectedEndDate = endOfDay.toISOString();
      } else if (durationPreset === 'tomorrow') {
        durationLabel = 'Hasta mañana';
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(19, 0, 0, 0);
        expectedEndDate = tomorrow.toISOString();
      } else if (durationPreset === 'week') {
        durationLabel = 'Esta semana (hasta el viernes)';
        const friday = new Date();
        const day = friday.getDay();
        const diff = friday.getDate() + (5 - day);
        friday.setDate(diff);
        friday.setHours(19, 0, 0, 0);
        expectedEndDate = friday.toISOString();
      } else if (durationPreset === 'custom') {
        if (!customEndDate) {
          toast.error('Por favor, selecciona una fecha estimada de devolución.');
          setIsSubmittingBorrow(false);
          return;
        }
        durationLabel = `Hasta el ${new Date(customEndDate).toLocaleDateString()}`;
        expectedEndDate = new Date(customEndDate).toISOString();
      }

      await borrowGadget(borrowModalGadget.id, {
        durationLabel,
        expectedEndDate,
        notes: borrowNotes
      });

      toast.success(`¡"${borrowModalGadget.name}" tomado en préstamo! Recuerda devolverlo al finalizar.`);
      setBorrowModalGadget(null);
    } catch (error: any) {
      console.error(error);
      toast.error('Error al registrar el préstamo.');
    } finally {
      setIsSubmittingBorrow(false);
    }
  };

  const handleReturn = async (gadget: Gadget) => {
    const isConfirmed = await confirm({
      title: 'Devolver equipo',
      message: `¿Confirmas que has devuelto físicamente "${gadget.name}" a su ubicación (${gadget.location || 'armario/taquilla correspondiente'})?`,
      confirmText: 'Sí, devuelto',
      cancelText: 'Cancelar'
    });

    if (isConfirmed) {
      try {
        await returnGadget(gadget.id);
        toast.success(`"${gadget.name}" devuelto al inventario. ¡Gracias!`);
      } catch (error) {
        console.error('Error al procesar la devolución:', error);
        toast.error('Error al procesar la devolución.');
      }
    }
  };

  const handleForceReturn = async (gadget: Gadget) => {
    const isConfirmed = await confirm({
      title: 'Forzar devolución (Gestor)',
      message: `¿Estás seguro de forzar la devolución de "${gadget.name}"? Actualmente figura en posesión de ${gadget.currentBorrowerName || 'un compañero'}.`,
      confirmText: 'Forzar devolución',
      cancelText: 'Cancelar'
    });

    if (isConfirmed) {
      try {
        await returnGadget(gadget.id);
        toast.success(`Equipo liberado con éxito.`);
      } catch (error) {
        console.error('Error al forzar la devolución:', error);
        toast.error('Error al forzar la devolución.');
      }
    }
  };

  const handleDeleteGadget = async (gadget: Gadget) => {
    const isConfirmed = await confirm({
      title: 'Eliminar equipo del catálogo',
      message: `¿Estás seguro de que deseas eliminar permanentemente "${gadget.name}" del inventario? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar permanentemente',
      cancelText: 'Cancelar'
    });

    if (isConfirmed) {
      try {
        await deleteGadget(gadget.id);
        toast.success(`Equipo eliminado del catálogo.`);
      } catch (error) {
        console.error('Error al eliminar el equipo:', error);
        toast.error('Error al eliminar el equipo.');
      }
    }
  };

  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      category: 'perifericos',
      location: '',
      description: ''
    });
    setManageModal({ mode: 'create' });
  };

  const handleOpenEditModal = (gadget: Gadget) => {
    setFormData({
      name: gadget.name,
      category: gadget.category,
      location: gadget.location || '',
      description: gadget.description || ''
    });
    setManageModal({ mode: 'edit', gadget });
  };

  const handleSaveGadget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Indica un nombre para el equipo.');
      return;
    }

    try {
      if (manageModal?.mode === 'create') {
        await addGadget({
          name: formData.name,
          category: formData.category,
          location: formData.location,
          description: formData.description
        });
        toast.success('Nuevo equipo añadido al catálogo con éxito');
      } else if (manageModal?.mode === 'edit' && manageModal.gadget) {
        await updateGadget(manageModal.gadget.id, {
          name: formData.name.trim(),
          category: formData.category,
          location: formData.location.trim() || null,
          description: formData.description.trim() || null
        });
        toast.success('Equipo actualizado con éxito');
      }
      setManageModal(null);
    } catch (error: any) {
      console.error(error);
      toast.error('Error al guardar el equipo.');
    }
  };

  // Bloqueo de acceso si la sección está en mantenimiento para usuarios estándar
  if (isGadgetsMaintenance && !canManageGadgets) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 sm:p-10 bg-white rounded-3xl border border-gray-200 shadow-sm text-center animate-in fade-in duration-200">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
          <Wrench className="w-8 h-8" />
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 mb-4">
          <AlertCircle className="w-3.5 h-3.5" />
          Sección en Mantenimiento
        </span>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Catálogo de Gadgets Temporalmente Inactivo
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-8">
          Estamos preparando el inventario y configurando los equipos para ofrecer el mejor servicio. Esta sección estará disponible para todos los empleados muy pronto.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-sm font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-12 animate-in fade-in duration-200">
      
      {/* Banner de aviso para administradores/gestores cuando el modo mantenimiento está activado */}
      {isGadgetsMaintenance && canManageGadgets && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold flex items-center gap-2">
                Modo Mantenimiento Activo
                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900">
                  Visible solo para gestores
                </span>
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Los usuarios estándar no pueden ver la sección de gadgets ni sus enlaces mientras esté en mantenimiento. Puedes dar de alta equipos y organizar el inventario tranquilamente.
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="text-xs font-semibold px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-amber-900 hover:bg-amber-100 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
            >
              Gestionar en Admin
            </button>
          )}
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">Préstamo de Gadgets</h1>
                {canManageGadgets && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60" title="Tienes permisos para gestionar equipos">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Gestor
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-0.5">
                Reserva pantallas, ratones, adaptadores o proyectores de la oficina
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3.5 py-2 rounded-xl transition-colors font-medium shadow-sm"
          >
            <Info className="w-4 h-4 text-gray-500" />
            Guía de uso
          </button>

          {canManageGadgets && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 text-xs sm:text-sm bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-xl font-medium transition-all shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4 text-brand-red" />
              Añadir Equipo
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <PackageSearch className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Equipos</p>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Disponibles</p>
            <p className="text-xl font-bold text-emerald-600">{stats.available}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">En Préstamo</p>
            <p className="text-xl font-bold text-gray-900">{stats.borrowed}</p>
          </div>
        </div>

        <button 
          onClick={() => setActiveTab('mis')}
          className={clsx(
            "p-4 rounded-xl border shadow-sm flex items-center gap-3.5 text-left transition-all",
            activeTab === 'mis' 
              ? "bg-brand-red text-white border-brand-red shadow-md"
              : "bg-white border-gray-200/80 hover:border-brand-red/50"
          )}
        >
          <div className={clsx(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
            activeTab === 'mis' ? "bg-white/20 text-white" : "bg-brand-red/10 text-brand-red"
          )}>
            <Hand className="w-5 h-5" />
          </div>
          <div>
            <p className={clsx("text-xs font-medium uppercase tracking-wider", activeTab === 'mis' ? "text-white/80" : "text-gray-500")}>
              Mis Préstamos
            </p>
            <p className={clsx("text-xl font-bold", activeTab === 'mis' ? "text-white" : "text-gray-900")}>
              {stats.myCount}
            </p>
          </div>
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50/50 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('catalogo')}
            className={clsx(
              "px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2",
              activeTab === 'catalogo'
                ? "border-brand-red text-brand-red bg-white rounded-t-xl shadow-sm"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 rounded-t-xl"
            )}
          >
            <PackageSearch className="w-4 h-4" />
            Catálogo de Equipos
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-normal">
              {gadgets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('mis')}
            className={clsx(
              "px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2",
              activeTab === 'mis'
                ? "border-brand-red text-brand-red bg-white rounded-t-xl shadow-sm"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 rounded-t-xl"
            )}
          >
            <Hand className="w-4 h-4" />
            Mis Préstamos Activos
            {stats.myCount > 0 && (
              <span className="text-xs bg-brand-red text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                {stats.myCount}
              </span>
            )}
          </button>

          {canManageGadgets && (
            <button
              onClick={() => setActiveTab('gestion')}
              className={clsx(
                "px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ml-auto",
                activeTab === 'gestion'
                  ? "border-brand-red text-brand-red bg-white rounded-t-xl shadow-sm"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 rounded-t-xl"
              )}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Panel de Gestión (Inventario)
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 lg:p-8">
          
          {/* TAB 1: CATÁLOGO & TAB 2: MIS PRÉSTAMOS */}
          {(activeTab === 'catalogo' || activeTab === 'mis') && (
            <div className="space-y-6">
              
              {/* Search & Filters Toolbar */}
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nombre, taquilla, descripción..."
                    className="w-full pl-10 pr-9 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Availability Toggle */}
                {activeTab === 'catalogo' && (
                  <label className="flex items-center gap-2 text-sm text-gray-700 select-none cursor-pointer bg-gray-50 border border-gray-200 px-3.5 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={onlyAvailable}
                      onChange={(e) => setOnlyAvailable(e.target.checked)}
                      className="rounded border-gray-300 text-brand-red focus:ring-brand-red h-4 w-4"
                    />
                    <span className="font-medium text-xs sm:text-sm">Solo disponibles ahora</span>
                  </label>
                )}
              </div>

              {/* Categories Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  const count = cat.id === 'todos' 
                    ? gadgets.length 
                    : gadgets.filter(g => g.category === cat.id).length;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={clsx(
                        "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap border",
                        isSelected
                          ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {cat.label}
                      <span className={clsx(
                        "text-xs px-1.5 py-0.2 rounded-full",
                        isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                      )}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Gadgets Grid */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                  <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-medium">Cargando catálogo de gadgets...</p>
                </div>
              ) : filteredGadgets.length === 0 ? (
                <div className="text-center py-16 px-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400 mb-3">
                    <PackageSearch className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    {activeTab === 'mis' ? 'No tienes ningún equipo en préstamo' : 'No se encontraron equipos'}
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    {activeTab === 'mis' 
                      ? 'Cuando necesites una pantalla portátil, ratón o cable, solicítalo en la pestaña "Catálogo de Equipos".'
                      : 'Prueba a cambiar los filtros de categoría o buscar con otros términos.'}
                  </p>
                  {activeTab === 'mis' && (
                    <button
                      onClick={() => setActiveTab('catalogo')}
                      className="mt-4 px-4 py-2 bg-brand-red text-white text-xs font-semibold rounded-xl hover:bg-[#A31C30] transition-colors"
                    >
                      Explorar Catálogo
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredGadgets.map((gadget) => {
                    const isMine = gadget.currentBorrowerId === user?.uid;
                    const catInfo = getCategoryDetails(gadget.category);
                    const CatIcon = catInfo.icon;

                    return (
                      <div
                        key={gadget.id}
                        className={clsx(
                          "bg-white rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden hover:shadow-md",
                          isMine 
                            ? "border-brand-red/40 ring-1 ring-brand-red/20" 
                            : gadget.status === 'available'
                            ? "border-gray-200 hover:border-gray-300"
                            : "border-gray-200/60 bg-gray-50/30"
                        )}
                      >
                        {/* Card Header & Status */}
                        <div className="p-5 flex-1 flex flex-col">
                          
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <span className={clsx(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border",
                              catInfo.color
                            )}>
                              <CatIcon className="w-3.5 h-3.5" />
                              {catInfo.label}
                            </span>

                            {/* Status badge */}
                            {gadget.status === 'available' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Disponible
                              </span>
                            ) : isMine ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                En tu poder
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                En préstamo
                              </span>
                            )}
                          </div>

                          {/* Gadget Name & Info */}
                          <h3 className="font-bold text-gray-900 text-base leading-snug mb-1 group-hover:text-brand-red transition-colors">
                            {gadget.name}
                          </h3>

                          {/* Location Pin */}
                          {gadget.location && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 font-medium mb-2">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span>Ubicación: <strong className="text-gray-700">{gadget.location}</strong></span>
                            </div>
                          )}

                          {/* Description */}
                          {gadget.description && (
                            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mt-0.5 mb-3">
                              {gadget.description}
                            </p>
                          )}

                          {/* Current borrower info if borrowed */}
                          {gadget.status === 'borrowed' && !isMine && (
                            <div className="mt-auto pt-3 border-t border-gray-100 text-xs text-gray-600 bg-rose-50/40 -mx-5 -mb-5 p-3.5">
                              <p className="font-semibold text-rose-900 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                                Prestado a: {gadget.currentBorrowerName || 'Compañero'}
                              </p>
                              {gadget.durationLabel && (
                                <p className="text-rose-700 text-[11px] mt-0.5 pl-4.5">
                                  Duración: {gadget.durationLabel}
                                </p>
                              )}
                              {gadget.notes && (
                                <p className="text-gray-500 text-[11px] italic mt-0.5 pl-4.5 line-clamp-1">
                                  Nota: "{gadget.notes}"
                                </p>
                              )}
                            </div>
                          )}

                          {/* My loan details */}
                          {isMine && (
                            <div className="mt-auto pt-3 border-t border-blue-100 text-xs text-blue-900 bg-blue-50/40 -mx-5 -mb-5 p-3.5">
                              <p className="font-semibold flex items-center gap-1 text-blue-800">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                Lo tienes prestado tú
                              </p>
                              {gadget.durationLabel && (
                                <p className="text-blue-700 text-[11px] mt-0.5 pl-4.5">
                                  Compromiso: {gadget.durationLabel}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Card Actions Footer */}
                        <div className="p-3 bg-gray-50/80 border-t border-gray-100 flex items-center gap-2">
                          {gadget.status === 'available' ? (
                            <button
                              onClick={() => handleOpenBorrowModal(gadget)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors text-xs sm:text-sm shadow-sm"
                            >
                              <Hand className="w-4 h-4" />
                              Solicitar Préstamo
                            </button>
                          ) : isMine ? (
                            <button
                              onClick={() => handleReturn(gadget)}
                              className="flex-1 bg-gray-900 hover:bg-black text-white font-medium py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors text-xs sm:text-sm shadow-sm"
                            >
                              <RotateCcw className="w-4 h-4 text-emerald-400" />
                              Devolver equipo
                            </button>
                          ) : (
                            <div className="flex-1 text-center py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg">
                              No disponible actualmente
                            </div>
                          )}

                          {/* Manager quick actions on card */}
                          {canManageGadgets && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditModal(gadget)}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                                title="Editar equipo"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {gadget.status === 'borrowed' && (
                                <button
                                  onClick={() => handleForceReturn(gadget)}
                                  className="p-2 text-gray-500 hover:text-amber-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                                  title="Forzar devolución (Gestor)"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: PANEL DE GESTIÓN (SOLO GESTORES Y ADMINS) */}
          {activeTab === 'gestion' && canManageGadgets && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl text-white">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Inventario y Control de Préstamos
                  </h2>
                  <p className="text-xs text-gray-300 mt-1 max-w-xl leading-relaxed">
                    Como Gestor de Gadgets, tienes potestad para dar de alta nuevo material, modificar ubicaciones de almacenamiento y liberar equipos si un compañero olvida devolverlos.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreateModal}
                  className="bg-brand-red hover:bg-[#A31C30] text-white px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors self-start sm:self-auto shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Equipo
                </button>
              </div>

              {/* Management Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5 font-bold">Equipo</th>
                        <th className="px-5 py-3.5 font-bold">Categoría</th>
                        <th className="px-5 py-3.5 font-bold">Ubicación física</th>
                        <th className="px-5 py-3.5 font-bold">Estado actual</th>
                        <th className="px-5 py-3.5 font-bold">En posesión de</th>
                        <th className="px-5 py-3.5 font-bold text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {gadgets.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                            No hay ningún equipo en el inventario. Añade el primero con el botón superior.
                          </td>
                        </tr>
                      ) : (
                        gadgets.map((g) => {
                          const catInfo = getCategoryDetails(g.category);

                          return (
                            <tr key={g.id} className="hover:bg-gray-50/80 transition-colors">
                              <td className="px-5 py-3.5">
                                <div className="font-bold text-gray-900">{g.name}</div>
                                {g.description && (
                                  <div className="text-xs text-gray-500 line-clamp-1 max-w-xs">{g.description}</div>
                                )}
                              </td>

                              <td className="px-5 py-3.5">
                                <span className={clsx("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border", catInfo.color)}>
                                  {catInfo.label}
                                </span>
                              </td>

                              <td className="px-5 py-3.5 text-xs text-gray-600">
                                {g.location ? (
                                  <span className="flex items-center gap-1 font-medium text-gray-800">
                                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                    {g.location}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic">Sin ubicación</span>
                                )}
                              </td>

                              <td className="px-5 py-3.5">
                                {g.status === 'available' ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Disponible
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                    Prestado
                                  </span>
                                )}
                              </td>

                              <td className="px-5 py-3.5 text-xs">
                                {g.status === 'borrowed' ? (
                                  <div>
                                    <strong className="text-gray-900">{g.currentBorrowerName || 'Desconocido'}</strong>
                                    {g.durationLabel && (
                                      <p className="text-gray-500 text-[11px]">{g.durationLabel}</p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>

                              <td className="px-5 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {g.status === 'borrowed' && (
                                    <button
                                      onClick={() => handleForceReturn(g)}
                                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                      title="Forzar devolución"
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleOpenEditModal(g)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Editar equipo"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteGadget(g)}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Eliminar del catálogo"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* MODAL 1: SOLICITAR PRÉSTAMO (EXPERIENCIA INTUITIVA) */}
      {borrowModalGadget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Hand className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-base">Solicitar Préstamo</h2>
                  <p className="text-xs text-gray-500">Confirmación rápida de reserva</p>
                </div>
              </div>
              <button 
                onClick={() => setBorrowModalGadget(null)} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              
              {/* Product Info Card */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80">
                <h3 className="font-bold text-gray-900 text-base">{borrowModalGadget.name}</h3>
                {borrowModalGadget.location && (
                  <p className="text-xs text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 mt-2 font-medium border border-emerald-200/50">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    Punto de recogida: <strong>{borrowModalGadget.location}</strong>
                  </p>
                )}
                {borrowModalGadget.description && (
                  <p className="text-xs text-gray-500 mt-2 italic">{borrowModalGadget.description}</p>
                )}
              </div>

              {/* Quick Duration Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                  ¿Cuánto tiempo lo necesitas?
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDurationPreset('today')}
                    className={clsx(
                      "p-3 rounded-xl border text-left transition-all text-xs flex flex-col justify-between",
                      durationPreset === 'today'
                        ? "border-brand-red bg-red-50/40 text-brand-red font-bold ring-1 ring-brand-red"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
                    )}
                  >
                    <span>⚡ Solo hoy</span>
                    <span className="text-[11px] text-gray-500 font-normal mt-0.5">Hasta fin de jornada</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDurationPreset('tomorrow')}
                    className={clsx(
                      "p-3 rounded-xl border text-left transition-all text-xs flex flex-col justify-between",
                      durationPreset === 'tomorrow'
                        ? "border-brand-red bg-red-50/40 text-brand-red font-bold ring-1 ring-brand-red"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
                    )}
                  >
                    <span>🌙 Hasta mañana</span>
                    <span className="text-[11px] text-gray-500 font-normal mt-0.5">Devuelvo mañana</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDurationPreset('week')}
                    className={clsx(
                      "p-3 rounded-xl border text-left transition-all text-xs flex flex-col justify-between",
                      durationPreset === 'week'
                        ? "border-brand-red bg-red-50/40 text-brand-red font-bold ring-1 ring-brand-red"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
                    )}
                  >
                    <span>📅 Esta semana</span>
                    <span className="text-[11px] text-gray-500 font-normal mt-0.5">Hasta el viernes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDurationPreset('custom')}
                    className={clsx(
                      "p-3 rounded-xl border text-left transition-all text-xs flex flex-col justify-between",
                      durationPreset === 'custom'
                        ? "border-brand-red bg-red-50/40 text-brand-red font-bold ring-1 ring-brand-red"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
                    )}
                  >
                    <span>🗓️ Personalizado</span>
                    <span className="text-[11px] text-gray-500 font-normal mt-0.5">Elegir fecha</span>
                  </button>
                </div>

                {durationPreset === 'custom' && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fecha estimada de devolución:</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-red outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Notes / Purpose */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Lugar de uso o motivo (opcional)
                </label>
                <input
                  type="text"
                  value={borrowNotes}
                  onChange={(e) => setBorrowNotes(e.target.value)}
                  placeholder="Ej: Sala de reuniones 2, mesa C4, teletrabajo..."
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Ayuda a los compañeros a saber dónde encontrarte si necesitan el equipo de urgencia.
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-2 justify-end">
              <button 
                type="button"
                onClick={() => setBorrowModalGadget(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button 
                type="button"
                disabled={isSubmittingBorrow}
                onClick={handleConfirmBorrow}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors text-sm flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmittingBorrow ? 'Confirmando...' : 'Confirmar Préstamo'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: GESTIÓN (AÑADIR / EDITAR GADGET) */}
      {manageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center">
                  {manageModal.mode === 'create' ? <Plus className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                </div>
                <h2 className="font-bold text-gray-900 text-base">
                  {manageModal.mode === 'create' ? 'Añadir Nuevo Equipo' : 'Editar Equipo'}
                </h2>
              </div>
              <button 
                onClick={() => setManageModal(null)} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGadget} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Nombre del equipo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Ratón Inalámbrico Logitech M185, Monitor Asus 15.6''..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Categoría *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none bg-white"
                >
                  <option value="perifericos">Periféricos (Ratón, teclado, touchpad...)</option>
                  <option value="pantallas">Pantallas (Monitores, portátiles...)</option>
                  <option value="audiovisual">Audiovisual (Proyectores, micros, webcam...)</option>
                  <option value="cables">Cables y adaptadores (HDMI, USB-C, cargadores...)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Ubicación física / Taquilla
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ej: Taquilla 2, Armario Sala B, Mesa Soporte IT..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Indica dónde deben recogerlo y devolverlo físicamente los compañeros.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Descripción o especificaciones (opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Ej: Color negro, incluye funda y cable USB-C..."
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setManageModal(null)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-red hover:bg-[#A31C30] text-white rounded-xl font-medium transition-colors text-sm shadow-sm"
                >
                  {manageModal.mode === 'create' ? 'Crear Equipo' : 'Guardar Cambios'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Guide Modal */}
      <GadgetsGuideModal 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
      />

    </div>
  );
}
