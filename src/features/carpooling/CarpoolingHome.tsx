import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Car, Plus, MapPin, Clock, Users, Edit, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
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

              return (
                <button 
                  key={day} 
                  onClick={() => setSelectedDate(dateStr)}
                  className={clsx(
                    "py-2 rounded-lg relative font-medium transition-colors",
                    isSelected ? "bg-brand-red text-white shadow-sm" : "hover:bg-gray-50",
                    !isSelected && hasTrips && "text-brand-red font-bold"
                  )}
                >
                  {day}
                  {!isSelected && hasTrips && (
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
                  <div key={trip.id} className="border border-gray-200 rounded-xl p-4 flex flex-col hover:border-gray-300 transition-colors bg-white">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{trip.origin}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-sm ml-6 border-l-2 border-gray-200 pl-4 py-1">
                          hacia
                        </div>
                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                          <MapPin className="w-4 h-4 text-brand-red" />
                          <span>{trip.destination}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="bg-gray-50 px-3 py-1.5 rounded-lg text-sm font-bold text-gray-700 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-gray-500" />
                          {trip.time}
                        </div>
                        {trip.availableSeats === 0 && (
                          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-md">LLENO</span>
                        )}
                      </div>
                    </div>
                    
                    {!isMyTrip && trip.driverName && (
                      <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                        <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[10px] font-bold">
                          {trip.driverName.charAt(0).toUpperCase()}
                        </div>
                        Conductor: <span className="font-medium">{trip.driverName}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className={trip.availableSeats === 0 ? 'text-red-500 font-medium' : 'text-gray-600'}>
                          {trip.availableSeats} / {trip.totalSeats} libres
                        </span>
                      </div>
                      
                      {isMyTrip ? (
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setEditingTrip(trip)}
                            className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1"
                          >
                            <Edit className="w-4 h-4" />
                            Editar
                          </button>
                          <button 
                            onClick={() => cancelTrip(trip.id)}
                            className="text-red-500 text-sm font-medium hover:underline"
                          >
                            Cancelar Viaje
                          </button>
                        </div>
                      ) : myBooking ? (
                        <button 
                          onClick={() => cancelBooking(myBooking.id, trip.id)}
                          className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-gray-200"
                        >
                          Anular reserva
                        </button>
                      ) : (
                        <button 
                          onClick={() => bookSeat(trip.id)}
                          disabled={trip.availableSeats === 0}
                          className="bg-brand-red text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-[#A31C30] disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          Reservar plaza
                        </button>
                      )}
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
