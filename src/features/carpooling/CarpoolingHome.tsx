import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Car, Plus, Clock, Users, Edit, X, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
import { isHoliday } from '../../utils/holidays';
import { useCarpooling, type CarpoolTrip } from './hooks/useCarpooling';
import { useAuth } from '../../contexts/AuthContext';

export function CarpoolingHome() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // El da seleccionado por defecto es hoy
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('viajes');
  const [editingTrip, setEditingTrip] = useState<CarpoolTrip | null>(null);

  const { trips, allMonthTrips, bookings, bookSeat, cancelBooking, cancelTrip, updateTrip } = useCarpooling(selectedDate);

  const tabs = [
    { id: 'viajes', label: 'Viajes del ' + selectedDate.split('-').reverse().join('/') },
    { id: 'mis', label: 'Mis viajes publicados' },
    { id: 'reservados', label: 'Mis reservas' },
  ];

  // Calendar logic
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  // Adjust so Monday is 0
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  // Derivar datos
  const myTrips = useMemo(() => {
    return allMonthTrips.filter(t => t.driverId === user?.uid);
  }, [allMonthTrips, user]);

  const myBookings = useMemo(() => {
    const myBookingRecords = bookings.filter(b => b.passengerId === user?.uid);
    return allMonthTrips.filter(t => myBookingRecords.some(b => b.tripId === t.id));
  }, [allMonthTrips, bookings, user]);

  const displayedTrips = activeTab === 'viajes' ? trips : (activeTab === 'mis' ? myTrips : myBookings);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      
      {/* Calendar Sidebar */}
      <div className="w-full md:w-80 flex-shrink-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-gray-900">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-md text-gray-600"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-md text-gray-600"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-y-4 mb-2 text-center text-sm font-medium text-gray-500">
            <div>Lun</div><div>Mar</div><div>Mi</div><div>Jue</div><div>Vie</div><div>Sb</div><div>Dom</div>
          </div>
          
          <div className="grid grid-cols-7 gap-y-2 text-center text-sm text-gray-600">
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="py-2"></div>
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = dateStr === selectedDate;
              const hasTrips = allMonthTrips.some(t => t.date === dateStr);
              
              const dayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const holidayInfo = isHoliday(dateStr);
              const isNonWorking = isWeekend || holidayInfo.isHoliday;

              return (
                <button 
                  key={day} 
                  onClick={() => setSelectedDate(dateStr)}
                  disabled={isNonWorking}
                  title={holidayInfo.isHoliday ? holidayInfo.name : ''}
                  className={clsx(
                    "py-2 rounded-lg relative font-medium transition-colors",
                    isNonWorking && !isSelected ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-50",
                    isSelected && "bg-brand-red text-white shadow-sm",
                    !isSelected && !isNonWorking && hasTrips && "text-brand-red font-bold",
                    holidayInfo.isHoliday && !isWeekend && "bg-red-50 text-red-300"
                  )}
                >
                  {day}
                  {!isSelected && hasTrips && !isNonWorking && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-red rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tabs */}
        <div className="bg-gray-100/50 inline-flex p-1 rounded-lg mb-4 self-start">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 p-6">
          {displayedTrips.length === 0 ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 mb-4">
                <Car className="w-8 h-8" />
              </div>
              <p className="text-gray-500 font-medium mb-4">
                {activeTab === 'viajes' && 'No hay viajes publicados por otros para este día'}
                {activeTab === 'mis' && 'No has publicado ningún viaje este mes'}
                {activeTab === 'reservados' && 'No tienes viajes reservados este mes'}
              </p>
              {activeTab !== 'reservados' && (
                <Link
                  to="/carpooling/new"
                  className="border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Publicar viaje
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {displayedTrips.map(trip => {
                const isMyTrip = trip.driverId === user?.uid;
                const myBooking = bookings.find(b => b.tripId === trip.id && b.passengerId === user?.uid);
                
                return (
                  <div key={trip.id} className="border border-gray-200 rounded-2xl p-5 flex flex-col hover:border-brand-red/30 hover:shadow-lg transition-all bg-white relative overflow-hidden group">
                    
                    {/* Cabecera: Hora y Asientos */}
                    <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-brand-red/70 uppercase tracking-wider mb-0.5 ml-7">Hora de salida</span>
                        <div className="flex items-center gap-2 text-brand-red font-black text-2xl tracking-tight leading-none">
                          <Clock className="w-5 h-5 text-brand-red/70" />
                          {trip.time}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {trip.availableSeats === 0 && (
                          <span className="bg-red-50 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-red-100">LLENO</span>
                        )}
                        <div className="bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full text-xs font-bold text-gray-700 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          {trip.availableSeats} / {trip.totalSeats} libres
                        </div>
                      </div>
                    </div>
                    
                    {/* Cuerpo: Ruta visual */}
                    <div className="relative pl-3 py-1 mb-6">
                      {/* Línea conectora */}
                      <div className="absolute left-4 top-2 bottom-2 w-0 border-l-2 border-dashed border-gray-300 group-hover:border-brand-red/30 transition-colors"></div>
                      
                      {/* Origen */}
                      <div className="relative flex items-center gap-4 mb-6">
                        <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-400 bg-white z-10"></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Salida</span>
                          <span className="text-base font-bold text-gray-900 leading-none">{trip.origin}</span>
                        </div>
                      </div>
                      
                      {/* Destino */}
                      <div className="relative flex items-center gap-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-red z-10 shadow-[0_0_0_2px_white,0_0_0_4px_#fca5a5]"></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Llegada</span>
                          <span className="text-base font-bold text-gray-900 leading-none">{trip.destination}</span>
                        </div>
                      </div>
                      
                      {/* Paradas intermedias / Info (Opcional) */}
                      {trip.stops && (
                        <div className="mt-5 ml-2 pl-4 py-2 border-l-2 border-brand-red/20">
                          <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100/50 flex gap-2.5">
                            <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-orange-800/60 uppercase tracking-wider mb-1">Hace paradas / Info</span>
                              <span className="text-xs text-orange-900/80 leading-relaxed font-medium">{trip.stops}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Footer: Conductor y Acciones */}
                    <div className="flex items-center justify-between mt-auto pt-4 bg-gray-50/50 -mx-5 -mb-5 p-5 border-t border-gray-100">
                      
                      {/* Conductor */}
                      <div className="flex items-center gap-3">
                        {!isMyTrip && trip.driverName ? (
                          <>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-red to-orange-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                              {trip.driverName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Conductor</span>
                              <span className="text-sm font-bold text-gray-700 leading-none">{trip.driverName}</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-sm font-bold text-brand-red bg-brand-red/10 px-3 py-1.5 rounded-lg border border-brand-red/20">
                            Tu viaje
                          </div>
                        )}
                      </div>
                      
                      {/* Acciones */}
                      <div>
                        {isMyTrip ? (
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => setEditingTrip(trip)}
                              className="text-gray-600 text-sm font-bold hover:text-blue-600 transition-colors flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
                            >
                              <Edit className="w-4 h-4" />
                              Editar
                            </button>
                            <button 
                              onClick={() => cancelTrip(trip.id)}
                              className="text-red-600 text-sm font-bold hover:bg-red-50 transition-colors bg-white border border-red-200 px-3 py-1.5 rounded-lg shadow-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : myBooking ? (
                          <button 
                            onClick={() => cancelBooking(myBooking.id, trip.id)}
                            className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 shadow-sm transition-all"
                          >
                            Anular reserva
                          </button>
                        ) : (
                          <button 
                            onClick={() => bookSeat(trip.id)}
                            disabled={trip.availableSeats === 0}
                            className="bg-brand-red text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-[#A31C30] hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                          >
                            Reservar plaza
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

      {/* Edit Trip Modal */}
      {editingTrip && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Editar viaje</h2>
              <button 
                onClick={() => setEditingTrip(null)}
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
                  await updateTrip(editingTrip.id, {
                    origin: formData.get('origin') as string,
                    destination: formData.get('destination') as string,
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
                <input 
                  type="text" 
                  name="origin" 
                  defaultValue={editingTrip.origin} 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
                <input 
                  type="text" 
                  name="destination" 
                  defaultValue={editingTrip.destination} 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                  <input 
                    type="time" 
                    name="time" 
                    defaultValue={editingTrip.time} 
                    required 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asientos Totales</label>
                  <input 
                    type="number" 
                    name="totalSeats" 
                    defaultValue={editingTrip.totalSeats} 
                    min={editingTrip.totalSeats - editingTrip.availableSeats} 
                    required 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingTrip(null)}
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
    </div>
  );
}
