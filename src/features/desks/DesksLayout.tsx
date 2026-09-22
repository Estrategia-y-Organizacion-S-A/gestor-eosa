import { useState } from 'react';
import { Info } from 'lucide-react';
import { OfficeMap } from './OfficeMap';
import { useDesks } from './hooks/useDesks';
import { DesksGuideModal } from './DesksGuideModal';
import { toast } from 'react-hot-toast';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useAuth } from '../../contexts/AuthContext';
import { DeskCalendar } from './components/DeskCalendar';

export function DesksLayout() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const { confirm } = useConfirm();
  const { user } = useAuth();
  const { desks, getDeskStatus, myHabitualDesk, releaseHabitualDesk, cancelReleaseByDate, releases, bookings, abandonHabitualDesk, futureReleases } = useDesks(selectedDate);



  const myReleasedDates = releases.filter(r => r.ownerId === user?.uid).map(r => r.date);
  const myBookedDates = bookings.filter(b => b.userId === user?.uid && desks.find(d => d.id === b.deskId)?.type !== 'meeting_room').map(b => b.date);

  // Calcular stats
  const totalSeats = 40;
  // Unique desks by label to avoid counting duplicates from HMR seeding issues
  const uniqueDesks = Array.from(new Map(desks.filter(d => d.type !== 'meeting_room').map(d => [d.label, d])).values());
  const occupiedSeats = uniqueDesks.filter(d => getDeskStatus(d) !== 'available').length;
  const availableSeats = totalSeats - occupiedSeats;

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-3">
            Reserva de Puestos
            <button 
              onClick={() => setIsGuideOpen(true)}
              className="text-gray-400 hover:text-brand-red transition-colors"
              title="Ver guía de uso"
            >
              <Info className="w-5 h-5" />
            </button>
          </h1>
          <p className="text-gray-500 text-sm">Selecciona tu lugar de trabajo en la oficina</p>
        </div>
        <button 
          onClick={() => setIsGuideOpen(true)}
          className="hidden md:flex bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors items-center gap-2 shadow-sm text-sm"
        >
          <Info className="w-4 h-4" />
          Guía de uso
        </button>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Sidebar */}
        <div className="w-full lg:w-72 shrink-0 space-y-6">
          <DeskCalendar 
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            releasedDates={myReleasedDates}
            bookedDates={myBookedDates}
          />

          {/* Mi Puesto Habitual */}
          {myHabitualDesk && (
            <div className="bg-blue-50/50 rounded-xl shadow-sm border border-blue-100 p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-blue-900">Mi Puesto Habitual</h3>
                <button 
                  onClick={async () => {
                    const isConfirmed = await confirm({
                      message: "¿Estás seguro de que deseas renunciar definitivamente a tu puesto habitual? Este puesto quedará libre para cualquier compañero.",
                      confirmText: "Sí, renunciar",
                      cancelText: "Cancelar"
                    });
                    if (isConfirmed) abandonHabitualDesk(myHabitualDesk.id);
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium underline"
                >
                  Renunciar
                </button>
              </div>
              <p className="text-sm text-blue-800 mb-2 font-medium">{myHabitualDesk.label}</p>
              
              <div className="text-xs text-orange-700 bg-orange-100/50 p-3 rounded-lg mb-4 border border-orange-200">
                <p className="font-semibold mb-1">Próximas ausencias confirmadas:</p>
                {futureReleases.length > 0 ? (
                  <ul className="space-y-1 max-h-32 overflow-y-auto mt-2">
                    {futureReleases.map((d, idx) => (
                      <li key={idx} className="flex justify-between items-center bg-orange-50/50 p-1.5 rounded border border-orange-200/50">
                        <span>{new Date(d).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                        <button 
                          onClick={() => cancelReleaseByDate(d)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                          title="Anular ausencia"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-orange-600/70 mt-2 italic">Actualmente no hay ninguna ausencia programada.</p>
                )}
              </div>
              
              <div className="space-y-2">
                {getDeskStatus(myHabitualDesk) === 'available' ? (
                  <button 
                    onClick={() => cancelReleaseByDate(selectedDate)}
                    className="w-full bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Anular ausencia del {selectedDate}
                  </button>
                ) : (
                  <button 
                    onClick={() => releaseHabitualDesk(myHabitualDesk.id, [selectedDate])}
                    className="w-full bg-orange-100 hover:bg-orange-200 text-orange-700 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    No voy a ir el {selectedDate}
                  </button>
                )}

                <hr className="border-blue-100 my-3" />
                <p className="text-xs text-blue-800 font-medium mb-2">¿Te vas varios días?</p>
                <form                    onSubmit={e => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const start = formData.get('startDate') as string;
                      const end = formData.get('endDate') as string;
                      if (!start || !end) return;
                      
                      const dates = [];
                      let curr = new Date(start);
                      const last = new Date(end);
                      while (curr <= last) {
                        dates.push(curr.toISOString().split('T')[0]);
                        curr.setUTCDate(curr.getUTCDate() + 1);
                      }
                      releaseHabitualDesk(myHabitualDesk.id, dates);
                      (e.target as HTMLFormElement).reset();
                      toast.success(`Puesto liberado desde ${start} hasta ${end}`);
                    }}
                  className="space-y-2"
                >
                  <div className="flex gap-2">
                    <input type="date" name="startDate" required className="w-1/2 px-2 py-1 border border-blue-200 rounded text-xs" />
                    <input type="date" name="endDate" required className="w-1/2 px-2 py-1 border border-blue-200 rounded text-xs" />
                  </div>
                  <button type="submit" className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 py-1.5 rounded-md text-xs font-medium transition-colors">
                    Liberar rango de fechas
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Ocupadas</span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-bold">{occupiedSeats} / {totalSeats}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Disponibles</span>
              <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full font-bold">{availableSeats}</span>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-150 flex flex-col relative w-full overflow-x-auto">
          <OfficeMap selectedDate={selectedDate} futureReleases={futureReleases} />
        </div>
        
      </div>

      <DesksGuideModal 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
      />
    </div>
  );
}
