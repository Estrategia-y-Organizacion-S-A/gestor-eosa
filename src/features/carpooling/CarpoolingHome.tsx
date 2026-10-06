import { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Car, Plus, Clock, Users, Edit, X, MapPin, 
  Search, ArrowUpDown, CheckCircle2, Filter, LayoutGrid, List, ArrowRight,
  Sparkles, Compass
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
import { isHoliday } from '../../utils/holidays';
import { useCarpooling, type CarpoolTrip } from './hooks/useCarpooling';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../contexts/ConfirmContext';

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function CarpoolingHome() {
  const { user } = useAuth();
  const { confirm } = useConfirm();

  // Estados de calendario y fecha
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(() => formatLocalDate(new Date()));
  const [activeTab, setActiveTab] = useState<'viajes' | 'mis' | 'reservados'>('viajes');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [editingTrip, setEditingTrip] = useState<CarpoolTrip | null>(null);

  // Estados de búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyWithSeats, setOnlyWithSeats] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon'>('all');
  const [sortBy, setSortBy] = useState<'time_asc' | 'time_desc' | 'seats_desc'>('time_asc');

  // Hook sincronizado en tiempo real con el mes del calendario
  const { trips, allMonthTrips, bookings, bookSeat, cancelBooking, cancelTrip, updateTrip } = useCarpooling(selectedDate, currentMonth);

  // Calendar logic
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Lunes = 0

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const prevMonth = () => {
    const nextM = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(nextM);
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === nextM.getFullYear() && today.getMonth() === nextM.getMonth();
    const target = isCurrentMonth ? today : nextM;
    setSelectedDate(formatLocalDate(target));
  };

  const nextMonth = () => {
    const nextM = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(nextM);
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === nextM.getFullYear() && today.getMonth() === nextM.getMonth();
    const target = isCurrentMonth ? today : nextM;
    setSelectedDate(formatLocalDate(target));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(formatLocalDate(today));
  };

  // Fecha seleccionada formateada en español
  const formattedSelectedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      if (isNaN(dateObj.getTime())) return selectedDate;
      const formatted = new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(dateObj);
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Colecciones derivadas
  const myTrips = useMemo(() => {
    return allMonthTrips.filter(t => t.driverId === user?.uid);
  }, [allMonthTrips, user]);

  const myBookings = useMemo(() => {
    const myBookingRecords = bookings.filter(b => b.passengerId === user?.uid);
    return allMonthTrips.filter(t => myBookingRecords.some(b => b.tripId === t.id));
  }, [allMonthTrips, bookings, user]);

  // Colección según pestaña activa
  const baseTrips = activeTab === 'viajes' ? trips : (activeTab === 'mis' ? myTrips : myBookings);

  // Estadísticas del día seleccionado (muy útil para una empresa con 44 personas)
  const dayStats = useMemo(() => {
    const totalSeats = trips.reduce((acc, t) => acc + (t.availableSeats || 0), 0);
    const drivers = new Set(trips.map(t => t.driverName || t.driverId)).size;
    const destinations = Array.from(new Set(trips.map(t => t.destination)));
    return {
      tripsCount: trips.length,
      availableSeats: totalSeats,
      driversCount: drivers,
      destinations: destinations.slice(0, 3)
    };
  }, [trips]);

  // Filtrado y ordenación sobre los viajes
  const filteredTrips = useMemo(() => {
    let result = [...baseTrips];

    // Búsqueda por texto (origen, destino, paradas, conductor)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(t => {
        const originMatch = t.origin.toLowerCase().includes(q);
        const destMatch = t.destination.toLowerCase().includes(q);
        const stopsMatch = t.stops?.toLowerCase().includes(q) || false;
        const driverMatch = t.driverName?.toLowerCase().includes(q) || false;
        return originMatch || destMatch || stopsMatch || driverMatch;
      });
    }

    // Filtro: Solo con plazas disponibles
    if (onlyWithSeats) {
      result = result.filter(t => t.availableSeats > 0);
    }

    // Filtro: Franja horaria
    if (timeFilter === 'morning') {
      result = result.filter(t => t.time < '14:00');
    } else if (timeFilter === 'afternoon') {
      result = result.filter(t => t.time >= '14:00');
    }

    // Ordenación
    result.sort((a, b) => {
      if (sortBy === 'time_asc') {
        return a.time.localeCompare(b.time);
      }
      if (sortBy === 'time_desc') {
        return b.time.localeCompare(a.time);
      }
      if (sortBy === 'seats_desc') {
        return b.availableSeats - a.availableSeats;
      }
      return 0;
    });

    return result;
  }, [baseTrips, searchQuery, onlyWithSeats, timeFilter, sortBy]);

  const hasActiveFilters = searchQuery.trim() !== '' || onlyWithSeats || timeFilter !== 'all' || sortBy !== 'time_asc';

  const resetFilters = () => {
    setSearchQuery('');
    setOnlyWithSeats(false);
    setTimeFilter('all');
    setSortBy('time_asc');
  };

  // Acciones con confirmación
  const handleCancelTrip = async (tripId: string) => {
    const isConfirmed = await confirm({
      title: 'Cancelar viaje corporativo',
      message: '¿Estás seguro de que deseas cancelar este viaje? Se cancelarán automáticamente todas las reservas de los compañeros.',
      confirmText: 'Sí, cancelar viaje',
      cancelText: 'Volver'
    });
    if (!isConfirmed) return;

    try {
      await cancelTrip(tripId);
      toast.success('Viaje cancelado correctamente');
    } catch (err: any) {
      toast.error(err?.message || 'Error al cancelar el viaje');
    }
  };

  const handleCancelBooking = async (bookingId: string, tripId: string) => {
    const isConfirmed = await confirm({
      title: 'Liberar plaza reservada',
      message: '¿Deseas liberar tu plaza en este viaje para que pueda ser aprovechada por otro compañero?',
      confirmText: 'Sí, liberar mi plaza',
      cancelText: 'Mantener reserva'
    });
    if (!isConfirmed) return;

    try {
      await cancelBooking(bookingId, tripId);
      toast.success('Reserva cancelada con éxito');
    } catch (err: any) {
      toast.error(err?.message || 'Error al cancelar la reserva');
    }
  };

  const handleBookSeat = async (tripId: string) => {
    try {
      await bookSeat(tripId);
      toast.success('¡Plaza reservada con éxito!');
    } catch (err: any) {
      toast.error(err?.message || 'Error al reservar plaza');
    }
  };

  const todayStr = formatLocalDate(new Date());

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      
      {/* 1. Calendario Lateral Corporativo EOSA */}
      <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200/90 p-5">
          
          {/* Navegación del mes */}
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Calendario</span>
              <h3 className="font-extrabold text-base text-gray-900 tracking-tight">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={goToToday} 
                className="text-xs px-2.5 py-1 text-gray-600 hover:text-brand-red hover:bg-rose-50 rounded-lg font-bold transition-colors cursor-pointer mr-0.5"
                title="Ir al mes actual y seleccionar hoy"
              >
                Hoy
              </button>
              <button 
                onClick={prevMonth} 
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 transition-colors cursor-pointer" 
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={nextMonth} 
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 transition-colors cursor-pointer" 
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-y-2 mb-2 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div>
          </div>
          
          {/* Grilla de días */}
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9"></div>
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === todayStr;
              const dayTrips = allMonthTrips.filter(t => t.date === dateStr);
              const hasTrips = dayTrips.length > 0;
              
              const dayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const holidayInfo = isHoliday(dateStr);
              const isNonWorking = (isWeekend || holidayInfo.isHoliday) && !hasTrips;

              return (
                <button 
                  key={day} 
                  onClick={() => setSelectedDate(dateStr)}
                  disabled={isNonWorking}
                  title={holidayInfo.isHoliday ? holidayInfo.name : (hasTrips ? `${dayTrips.length} viaje(s) programados` : '')}
                  className={clsx(
                    "h-9 rounded-xl relative font-semibold transition-all cursor-pointer flex flex-col items-center justify-center text-xs",
                    isNonWorking && !isSelected ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100/80",
                    isSelected 
                      ? "bg-brand-red text-white shadow-xs font-bold scale-105 z-10" 
                      : isToday 
                        ? "text-brand-red font-bold ring-1.5 ring-brand-red/50 bg-rose-50/30" 
                        : hasTrips 
                          ? "text-gray-900 font-bold bg-rose-50/50 hover:bg-rose-50" 
                          : "text-gray-700",
                    holidayInfo.isHoliday && !isWeekend && !hasTrips && "bg-red-50/30 text-red-300"
                  )}
                >
                  <span>{day}</span>
                  {/* Indicador de viajes estilo EOSA */}
                  {hasTrips && (
                    <span className={clsx(
                      "w-1.5 h-1.5 rounded-full absolute bottom-1 transition-colors",
                      isSelected ? "bg-white" : "bg-brand-red ring-1 ring-white"
                    )} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Leyenda corporativa */}
          <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-red" />
              <span>Con viajes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full border border-brand-red" />
              <span>Hoy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-200" />
              <span>Sin viajes</span>
            </div>
          </div>
        </div>

        {/* Resumen mensual EOSA */}
        <div className="bg-linear-to-br from-gray-50 to-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-rose-50 text-brand-red flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-xs font-bold text-gray-900">Movilidad en {monthNames[currentMonth.getMonth()]}</h4>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200/50">
            <div className="bg-white p-2.5 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Viajes mes</span>
              <span className="text-base font-extrabold text-gray-900">{allMonthTrips.length}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tus aportes</span>
              <span className="text-base font-extrabold text-brand-red">{myTrips.length}</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 mt-2.5 leading-snug">
            Comparte coche con compañeros de EOSA para reducir emisiones y optimizar trayectos.
          </p>
        </div>
      </div>

      {/* 2. Área Principal de Contenido */}
      <div className="flex-1 flex flex-col min-w-0 w-full space-y-4">
        
        {/* Selector de Pestañas Corporativo EOSA */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-1">
          <div className="flex gap-2 sm:gap-4 overflow-x-auto">
            <button
              onClick={() => { setActiveTab('viajes'); resetFilters(); }}
              className={clsx(
                'pb-2.5 text-xs sm:text-sm font-bold transition-all relative flex items-center gap-2 cursor-pointer',
                activeTab === 'viajes'
                  ? 'text-brand-red border-b-2 border-brand-red font-extrabold'
                  : 'text-gray-500 hover:text-gray-900'
              )}
            >
              <span>Viajes del día</span>
              <span className={clsx(
                "text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-bold",
                activeTab === 'viajes' ? "bg-rose-50 text-brand-red border border-rose-200" : "bg-gray-100 text-gray-600"
              )}>
                {trips.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('mis'); resetFilters(); }}
              className={clsx(
                'pb-2.5 text-xs sm:text-sm font-bold transition-all relative flex items-center gap-2 cursor-pointer',
                activeTab === 'mis'
                  ? 'text-brand-red border-b-2 border-brand-red font-extrabold'
                  : 'text-gray-500 hover:text-gray-900'
              )}
            >
              <span>Mis viajes publicados</span>
              <span className={clsx(
                "text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-bold",
                activeTab === 'mis' ? "bg-rose-50 text-brand-red border border-rose-200" : "bg-gray-100 text-gray-600"
              )}>
                {myTrips.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('reservados'); resetFilters(); }}
              className={clsx(
                'pb-2.5 text-xs sm:text-sm font-bold transition-all relative flex items-center gap-2 cursor-pointer',
                activeTab === 'reservados'
                  ? 'text-brand-red border-b-2 border-brand-red font-extrabold'
                  : 'text-gray-500 hover:text-gray-900'
              )}
            >
              <span>Mis reservas</span>
              <span className={clsx(
                "text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-bold",
                activeTab === 'reservados' ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-gray-100 text-gray-600"
              )}>
                {myBookings.length}
              </span>
            </button>
          </div>

          {/* Selector de Vista: Tarjetas vs Compacta */}
          {baseTrips.length > 0 && (
            <div className="hidden sm:flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/80 mb-2">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={clsx(
                  "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer",
                  viewMode === 'grid' ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500 hover:text-gray-900"
                )}
                title="Vista detallada en tarjetas"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Tarjetas</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={clsx(
                  "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer",
                  viewMode === 'compact' ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500 hover:text-gray-900"
                )}
                title="Vista compacta rápida para múltiples viajes"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Lista</span>
              </button>
            </div>
          )}
        </div>

        {/* Banner de Información / Métricas del Día (Especialmente clave para 44 personas en la empresa) */}
        {activeTab === 'viajes' && trips.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-red block mb-0.5">
                Rutas de la jornada
              </span>
              <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                {formattedSelectedDate}
              </h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-2">
                <Car className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-600 font-medium">Viajes:</span>
                <span className="font-extrabold text-gray-900">{dayStats.tripsCount}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Plazas libres:</span>
                <span className="font-extrabold text-emerald-900">{dayStats.availableSeats}</span>
              </div>
              {dayStats.destinations.length > 0 && (
                <div className="hidden md:flex px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 items-center gap-1.5 text-brand-red">
                  <Compass className="w-3.5 h-3.5" />
                  <span className="font-medium text-[11px]">Destinos: {dayStats.destinations.join(' · ')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Panel Contenedor Principal */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200/90 p-4 sm:p-6">
          
          {/* Cabecera si no estamos en 'viajes' */}
          {activeTab !== 'viajes' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-gray-100 gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
                  {activeTab === 'mis' ? 'Mis viajes publicados este mes' : 'Mis reservas activas'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  {activeTab === 'mis'
                    ? 'Gestiona los trayectos en los que eres conductor/a.'
                    : 'Tus plazas confirmadas en vehículos de compañeros de EOSA.'}
                </p>
              </div>

              <Link
                to="/carpooling/new"
                className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-white bg-brand-red hover:bg-[#a31b31] px-4 py-2 rounded-xl transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Publicar viaje
              </Link>
            </div>
          )}

          {/* Barra de Búsqueda y Filtros de Alta Eficiencia */}
          {baseTrips.length > 0 && (
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between mb-5 bg-gray-50/80 p-3 rounded-2xl border border-gray-200/80">
              
              {/* Buscador inteligente */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por destino, origen, paradas o compañero..."
                  className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red outline-none transition-all placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Botones de Filtro Rápido */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Chip: Con plazas */}
                <button
                  type="button"
                  onClick={() => setOnlyWithSeats(!onlyWithSeats)}
                  className={clsx(
                    "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs",
                    onlyWithSeats
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Con plazas</span>
                </button>

                {/* Segmentado: Franja horaria */}
                <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 text-xs shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setTimeFilter('all')}
                    className={clsx(
                      "px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer",
                      timeFilter === 'all' ? "bg-brand-red text-white shadow-2xs" : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    Todo
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFilter('morning')}
                    className={clsx(
                      "px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer",
                      timeFilter === 'morning' ? "bg-brand-red text-white shadow-2xs" : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    Mañana
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFilter('afternoon')}
                    className={clsx(
                      "px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer",
                      timeFilter === 'afternoon' ? "bg-brand-red text-white shadow-2xs" : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    Tarde
                  </button>
                </div>

                {/* Ordenación */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs shadow-2xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent font-bold text-gray-700 outline-none cursor-pointer"
                  >
                    <option value="time_asc">Salida: temprano</option>
                    <option value="time_desc">Salida: tarde</option>
                    <option value="seats_desc">Más plazas libres</option>
                  </select>
                </div>

                {/* Reset filters */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-xs text-brand-red hover:underline font-bold px-1.5 cursor-pointer"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Estado 1: No hay viajes para este día/pestaña */}
          {baseTrips.length === 0 ? (
            <div className="min-h-[280px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
              <div className="w-14 h-14 bg-white rounded-2xl border border-gray-200 flex items-center justify-center text-gray-400 mb-3 shadow-2xs">
                <Car className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                {activeTab === 'viajes' && 'No hay viajes programados para esta fecha'}
                {activeTab === 'mis' && 'Aún no has publicado ningún viaje este mes'}
                {activeTab === 'reservados' && 'No tienes reservas activas de coche este mes'}
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mb-5 leading-relaxed">
                {activeTab === 'viajes' && '¿Tienes previsto desplazarte a clientes o a la oficina de EOSA? Comparte tu trayecto y ahorra costes con tus compañeros.'}
                {activeTab === 'mis' && 'Publica tus trayectos habituales o visitas a clientes para que el equipo pueda acompañarte.'}
                {activeTab === 'reservados' && 'Navega por los días con viajes marcados en el calendario y reserva tu plaza con 1 clic.'}
              </p>
              {activeTab !== 'reservados' && (
                <Link
                  to="/carpooling/new"
                  className="bg-brand-red hover:bg-[#a31b31] text-white px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  Publicar viaje en esta fecha
                </Link>
              )}
            </div>
          ) : filteredTrips.length === 0 ? (
            /* Estado 2: Hay viajes pero no coinciden con los filtros */
            <div className="min-h-[220px] flex flex-col items-center justify-center text-center p-6 border border-gray-200 rounded-2xl bg-gray-50/40">
              <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 mb-2">
                <Filter className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Sin coincidencias con los filtros</h3>
              <p className="text-xs text-gray-500 max-w-xs mb-4">
                No encontramos viajes que coincidan con la búsqueda o la franja horaria seleccionada.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-bold text-brand-red bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Restablecer filtros
              </button>
            </div>
          ) : viewMode === 'compact' ? (
            /* Estado 3A: Vista Compacta / Tabla Ejecutiva para múltiples viajes en el mismo día */
            <div className="border border-gray-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Hora</th>
                      <th className="py-3 px-4">Trayecto (Ruta)</th>
                      <th className="py-3 px-4">Conductor/a</th>
                      <th className="py-3 px-4 text-center">Plazas</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTrips.map(trip => {
                      const isMyTrip = trip.driverId === user?.uid;
                      const myBooking = bookings.find(b => b.tripId === trip.id && b.passengerId === user?.uid);

                      return (
                        <tr key={trip.id} className="hover:bg-gray-50/60 transition-colors">
                          {/* Hora */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-extrabold text-sm text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
                              {trip.time}
                            </span>
                          </td>

                          {/* Trayecto */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">{trip.origin}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-brand-red shrink-0" />
                              <span className="font-bold text-gray-900">{trip.destination}</span>
                            </div>
                            {trip.stops && (
                              <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-brand-red shrink-0" />
                                <span className="truncate max-w-xs">Paradas: {trip.stops}</span>
                              </div>
                            )}
                          </td>

                          {/* Conductor */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-linear-to-br from-brand-red to-orange-500 text-white flex items-center justify-center text-[10px] font-bold">
                                {(trip.driverName || 'U').charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold text-gray-800">
                                {trip.driverName || 'Compañero/a'}
                              </span>
                            </div>
                          </td>

                          {/* Plazas */}
                          <td className="py-3 px-4 whitespace-nowrap text-center">
                            <span className={clsx(
                              "text-[11px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1",
                              trip.availableSeats === 0
                                ? "bg-gray-100 text-gray-600 border-gray-200"
                                : trip.availableSeats === 1
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
                            )}>
                              {trip.availableSeats === 0 ? "Completo" : `${trip.availableSeats} / ${trip.totalSeats}`}
                            </span>
                          </td>

                          {/* Acciones */}
                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            {isMyTrip ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingTrip(trip)}
                                  className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelTrip(trip.id)}
                                  className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : myBooking ? (
                              <button
                                type="button"
                                onClick={() => handleCancelBooking(myBooking.id, trip.id)}
                                className="text-xs font-bold px-3 py-1 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                              >
                                Anular
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleBookSeat(trip.id)}
                                disabled={trip.availableSeats === 0}
                                className={clsx(
                                  "text-xs font-bold px-3 py-1 rounded-lg transition-all cursor-pointer",
                                  trip.availableSeats === 0
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-brand-red hover:bg-[#a31b31] text-white shadow-2xs"
                                )}
                              >
                                {trip.availableSeats === 0 ? "Sin plazas" : "Reservar"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Estado 3B: Vista Tarjetas Corporativas EOSA (Rica y Visual) */
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredTrips.map(trip => {
                const isMyTrip = trip.driverId === user?.uid;
                const myBooking = bookings.find(b => b.tripId === trip.id && b.passengerId === user?.uid);
                
                return (
                  <div 
                    key={trip.id} 
                    className={clsx(
                      "border rounded-2xl p-5 flex flex-col justify-between transition-all bg-white relative overflow-hidden group shadow-2xs hover:shadow-md",
                      isMyTrip 
                        ? "border-rose-200/90 ring-1 ring-brand-red/10" 
                        : myBooking 
                          ? "border-blue-200/90 ring-1 ring-blue-500/10" 
                          : trip.availableSeats === 0
                            ? "border-gray-200 bg-gray-50/50 opacity-90"
                            : "border-gray-200/90 hover:border-brand-red/40"
                    )}
                  >
                    <div>
                      {/* Cabecera de la Tarjeta: Hora de Salida y Badges Corporativos */}
                      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-gray-100 gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-rose-50 text-brand-red flex items-center justify-center shadow-2xs">
                            <Clock className="w-5 h-5 text-brand-red" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Hora de salida</span>
                            <span className="text-xl font-extrabold text-gray-900 tracking-tight leading-none">{trip.time}</span>
                          </div>
                        </div>

                        {/* Badges de Estado */}
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {isMyTrip && (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-brand-red/10 text-brand-red border border-brand-red/20">
                              Tu viaje
                            </span>
                          )}
                          {myBooking && !isMyTrip && (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Reservado
                            </span>
                          )}
                          <span className={clsx(
                            "text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border",
                            trip.availableSeats === 0
                              ? "bg-gray-100 text-gray-600 border-gray-200"
                              : trip.availableSeats === 1
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-emerald-50 text-emerald-800 border-emerald-200"
                          )}>
                            <Users className="w-3.5 h-3.5" />
                            {trip.availableSeats === 0 ? "Completo" : `${trip.availableSeats} / ${trip.totalSeats} libres`}
                          </span>
                        </div>
                      </div>

                      {/* Trayecto / Ruta Visual Corporativa */}
                      <div className="space-y-3 mb-4">
                        {/* Origen */}
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center mt-1">
                            <div className="w-3 h-3 rounded-full border-2 border-gray-400 bg-white" />
                            <div className="w-0.5 h-5 bg-gray-200 my-0.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Salida</span>
                            <p className="text-sm font-bold text-gray-900 truncate">{trip.origin}</p>
                          </div>
                        </div>

                        {/* Destino */}
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center mt-0.5">
                            <div className="w-3 h-3 rounded-full bg-brand-red ring-4 ring-rose-100" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Llegada</span>
                            <p className="text-sm font-bold text-gray-900 truncate">{trip.destination}</p>
                          </div>
                        </div>

                        {/* Paradas intermedias */}
                        {trip.stops && (
                          <div className="ml-6 mt-2 p-2.5 rounded-xl bg-orange-50/70 border border-orange-100 text-xs text-orange-950 flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-orange-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-bold text-orange-800">Paradas / Detalles: </span>
                              <span className="text-orange-900/90">{trip.stops}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer: Conductor y Botón de Acción */}
                    <div className="pt-3.5 mt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                      
                      {/* Conductor */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-brand-red to-orange-500 text-white flex items-center justify-center text-xs font-bold shadow-2xs flex-shrink-0">
                          {(trip.driverName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block leading-none">Conductor/a</span>
                          <span className="text-xs font-bold text-gray-800 truncate block mt-0.5">
                            {trip.driverName || 'Compañero/a de EOSA'}
                          </span>
                        </div>
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isMyTrip ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditingTrip(trip)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelTrip(trip.id)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : myBooking ? (
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(myBooking.id, trip.id)}
                            className="text-xs font-bold px-3.5 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors shadow-2xs cursor-pointer"
                          >
                            Anular reserva
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleBookSeat(trip.id)}
                            disabled={trip.availableSeats === 0}
                            className={clsx(
                              "text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-2xs cursor-pointer",
                              trip.availableSeats === 0
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-brand-red hover:bg-[#a31b31] text-white hover:shadow-xs active:scale-98"
                            )}
                          >
                            {trip.availableSeats === 0 ? "Sin plazas" : "Reservar plaza"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edición de Viaje */}
      {editingTrip && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-red block mb-0.5">EOSA Carpooling</span>
                <h2 className="text-lg font-bold text-gray-900">Editar viaje compartido</h2>
              </div>
              <button 
                onClick={() => setEditingTrip(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                try {
                  await updateTrip(editingTrip.id, {
                    origin: (formData.get('origin') as string).trim(),
                    destination: (formData.get('destination') as string).trim(),
                    stops: (formData.get('stops') as string)?.trim() || null as any,
                    time: formData.get('time') as string,
                    totalSeats: parseInt(formData.get('totalSeats') as string, 10),
                  });
                  toast.success('Viaje actualizado con éxito');
                  setEditingTrip(null);
                } catch (error: any) {
                  toast.error(error.message || 'Error al actualizar el viaje');
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Origen</label>
                <input 
                  type="text" 
                  name="origin" 
                  defaultValue={editingTrip.origin} 
                  required 
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Destino</label>
                <input 
                  type="text" 
                  name="destination" 
                  defaultValue={editingTrip.destination} 
                  required 
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Paradas intermedias (opcional)</label>
                <input 
                  type="text" 
                  name="stops" 
                  defaultValue={editingTrip.stops || ''} 
                  placeholder="Ej. O Porriño, Ribadavia..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Hora de salida</label>
                  <input 
                    type="time" 
                    name="time" 
                    defaultValue={editingTrip.time} 
                    required 
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Asientos totales</label>
                  <input 
                    type="number" 
                    name="totalSeats" 
                    defaultValue={editingTrip.totalSeats} 
                    min={editingTrip.totalSeats - editingTrip.availableSeats} 
                    required 
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red outline-none text-sm"
                  />
                </div>
              </div>
              
              <div className="pt-3 flex gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setEditingTrip(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-semibold text-xs sm:text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2.5 bg-brand-red text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-[#a31b31] transition-colors cursor-pointer shadow-xs"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
