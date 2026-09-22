import { useState } from 'react';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useDesks, type Desk } from './hooks/useDesks';
import { toast } from 'react-hot-toast';

function DeskGroup({ name, x, y, width, height, isVertical = false, variant = 'amber' }: { name: string; x: number; y: number; width: number; height: number; isVertical?: boolean; variant?: 'amber' | 'red' }) {
  return (
    <div
      className={clsx(
        "absolute border rounded-md flex items-center justify-center font-bold text-xs text-center leading-tight shadow-sm overflow-visible",
        variant === 'amber' ? "border-amber-300 bg-amber-50 text-amber-600" : "border-red-400 bg-red-50 text-red-600",
        !isVertical && "px-1"
      )}
      style={{ left: x, top: y, width, height }}
    >
      <span className={isVertical ? "-rotate-90 whitespace-nowrap" : ""}>{name}</span>
    </div>
  );
}

function Room({ name, x, y, width, height, variant = 'gray' }: { name: string; x: number; y: number; width: number; height: number; variant?: 'gray' | 'green' }) {
  return (
    <div
      className={clsx(
        "absolute border rounded-md flex items-center justify-center font-bold text-xs text-center px-2 leading-tight shadow-sm",
        variant === 'gray' ? "border-gray-300 bg-gray-50 text-gray-500" : "border-green-300 bg-green-50 text-green-600"
      )}
      style={{ left: x, top: y, width, height }}
    >
      {name}
    </div>
  );
}

export function OfficeMap({ selectedDate, futureReleases }: { selectedDate: string, futureReleases: string[] }) {
  const { user, isAdmin } = useAuth();
  const { confirm } = useConfirm();
  const { desks, getDeskStatus, claimHabitualDesk, releaseHabitualDesk, abandonHabitualDesk, bookDesk, myHabitualDesk, loading, cancelReleaseByDate, releases, bookings, cancelBooking } = useDesks(selectedDate);
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null);
  const [isMultiBookingMode, setIsMultiBookingMode] = useState(false);
  const [multiBookingEndDate, setMultiBookingEndDate] = useState('');

  if (loading) {
    return <div className="flex-1 flex items-center justify-center">Cargando mapa...</div>;
  }

  const handleSeatClick = (desk: Desk) => {
    setSelectedDesk(desk);
    setIsMultiBookingMode(false);
    setMultiBookingEndDate('');
  };

  const statusColors = {
    available: "bg-green-400 border-green-500",
    booked: "bg-red-400 border-red-500",
    selected: "bg-amber-400 border-amber-500",
    mine: "bg-blue-500 border-blue-600"
  };

  return (
    <div className="flex-1 min-w-200 relative">
      
      {/* Background blocks */}
      <DeskGroup name="Mesa E - Comunicación" x={60} y={60} width={120} height={40} />
      <DeskGroup name="Mesa C - Proyectos" x={240} y={60} width={120} height={40} />
      <Room name="MESA J - Manuel" x={700} y={25} width={120} height={80} />
      <Room name="MESA I - Antonio" x={40} y={180} width={120} height={80} />
      
      {/* Sala de Reuniones No Interactiva */}
      <Room name="MESA F - Sala" x={40} y={270} width={120} height={90} variant="gray" />

      {/* Mesa Entrada (Recibidor) */}
      <DeskGroup name="Mesa G - Administración" x={420} y={60} width={120} height={40} variant="red" />
      
      {/* Coworking (Cabecera de Mesa D) */}
      <DeskGroup name="MESA M - Coworking" x={210} y={210} width={60} height={60} />

      <DeskGroup name="Mesa D - Proyectos europeos" x={220} y={290} width={40} height={120} isVertical />
      <DeskGroup name="Mesa B - Turismo y P.Urbana" x={480} y={230} width={40} height={150} isVertical />
      <DeskGroup name="Mesa A - Estudios y TIC" x={600} y={258} width={40} height={90} isVertical />

      <Room name="MESA K - Adolfo" x={700} y={180} width={120} height={170} />

      <div className="absolute" style={{ left: 700, top: 370 }}>
        <div className="border border-gray-300 bg-gray-100 text-gray-500 font-bold text-xs px-2 py-2 rounded-md mb-1 text-center">
          MESA H - Rodri
        </div>
        <div className="text-xs text-gray-400 text-center">No reservable</div>
      </div>

      {/* Dynamic Seats */}
      {Array.from(new Map(desks.filter(d => d.type !== 'meeting_room').map(d => [d.label, d])).values()).map(desk => {
        const status = selectedDesk?.id === desk.id ? 'selected' : getDeskStatus(desk);
        const isMyHabitual = myHabitualDesk?.id === desk.id;
        
        return (
          <div
            key={desk.id}
            onClick={() => handleSeatClick(desk)}
            className={clsx(
              "absolute w-6 h-6 rounded-full border transition-transform hover:scale-110 cursor-pointer flex items-center justify-center",
              statusColors[status],
              isMyHabitual && "ring-4 ring-blue-200 ring-offset-1 z-10"
            )}
            style={{ left: desk.x, top: desk.y }}
            title={desk.label}
          >
            {isMyHabitual && <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>}
          </div>
        );
      })}

      {/* Modal Acciones */}
      {selectedDesk && (
        <div className="absolute top-0 right-0 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
          <h4 className="font-bold text-gray-900 mb-2">{selectedDesk.label}</h4>
          
          <div className="space-y-2">
            {selectedDesk.type === 'meeting_room' ? (
              <>
                <p className="text-sm text-gray-500 mb-3">Reservar por horas</p>
                
                <div className="flex gap-2 mb-3">
                  <input type="time" defaultValue="10:00" className="w-1/2 border rounded px-2 py-1 text-sm" id="timeStart" />
                  <input type="time" defaultValue="11:00" className="w-1/2 border rounded px-2 py-1 text-sm" id="timeEnd" />
                </div>
                
                <button 
                  onClick={() => {
                    const start = (document.getElementById('timeStart') as HTMLInputElement).value;
                    const end = (document.getElementById('timeEnd') as HTMLInputElement).value;
                    bookDesk(selectedDesk.id, [selectedDate], start, end);
                    setSelectedDesk(null);
                  }}
                  className="w-full bg-brand-red hover:bg-[#A31C30] text-white py-2 rounded-md text-sm font-medium"
                >
                  Confirmar Reserva
                </button>
                
                {/* Listado de reservas del día */}
                <div className="mt-4 border-t pt-2">
                  <h5 className="text-xs font-bold text-gray-500 mb-2">RESERVAS HOY:</h5>
                  {bookings.filter(b => b.deskId === selectedDesk.id && b.date === selectedDate).map(b => (
                    <div key={b.id} className="text-xs text-gray-600 flex justify-between items-center mb-1">
                      <span>{b.startTime} - {b.endTime}</span>
                      {b.userId === user?.uid && (
                        <button onClick={() => cancelBooking(b.id)} className="text-red-500 hover:underline">X</button>
                      )}
                    </div>
                  ))}
                  {bookings.filter(b => b.deskId === selectedDesk.id && b.date === selectedDate).length === 0 && (
                    <div className="text-xs text-gray-400">Libre todo el día</div>
                  )}
                </div>
              </>
            ) : (
              /* Lógica para Asientos (Opt-out) */
              <>
                {myHabitualDesk?.id === selectedDesk.id ? (
                  <>
                    <p className="text-sm text-gray-500 mb-2">Este es tu puesto habitual.</p>
                    {getDeskStatus(selectedDesk) === 'available' ? (
                       <button 
                        onClick={async () => {
                          const release = releases.find(r => r.ownerId === selectedDesk.ownerId && r.date === selectedDate);
                          if (release) {
                            const hasTempBooking = bookings.find(b => b.date === selectedDate && b.userId === user?.uid && b.deskId !== selectedDesk.id);
                            if (hasTempBooking) {
                              const isConfirmed = await confirm({
                                message: "Tienes otro puesto temporal reservado para hoy. Si vuelves a tu puesto habitual, esa reserva temporal se cancelará automáticamente para liberar el espacio. ¿Deseas continuar?",
                                confirmText: 'Continuar y Cancelar Reserva'
                              });
                              if (!isConfirmed) return;
                            }
                            cancelReleaseByDate(selectedDate);
                          }
                          setSelectedDesk(null);
                        }}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-md text-sm font-medium"
                      >
                        Anular ausencia (Voy a ir)
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          releaseHabitualDesk(selectedDesk.id, [selectedDate]);
                          setSelectedDesk(null);
                        }}
                        className="w-full bg-orange-100 hover:bg-orange-200 text-orange-700 py-2 rounded-md text-sm font-medium"
                      >
                        No voy a ir el {selectedDate}
                      </button>
                    )}
                    <button 
                      onClick={async () => {
                        const isConfirmed = await confirm({
                          message: "¿Estás seguro de que deseas renunciar definitivamente a tu puesto habitual? Este puesto quedará libre para cualquier compañero.",
                          confirmText: "Sí, renunciar a mi puesto",
                          cancelText: "Cancelar"
                        });
                        if (!isConfirmed) return;
                        
                        abandonHabitualDesk(selectedDesk.id);
                        setSelectedDesk(null);
                      }}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-2 rounded-md text-sm font-medium transition-colors mt-4"
                    >
                      Renunciar definitivamente a este puesto
                    </button>
                  </>
                ) : (
                  /* Puesto de otro o sin dueño */
                  <>
                    {getDeskStatus(selectedDesk) === 'mine' && (
                      <button 
                        onClick={() => {
                          const booking = bookings.find(b => b.deskId === selectedDesk.id && b.date === selectedDate && b.userId === user?.uid);
                          if (booking) cancelBooking(booking.id);
                          setSelectedDesk(null);
                        }}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-md text-sm font-medium mb-2"
                      >
                        Cancelar reserva temporal
                      </button>
                    )}
                    {getDeskStatus(selectedDesk) === 'available' && (
                      <>
                        {(() => {
                          // Verificar si el usuario ha liberado su puesto habitual para esta fecha específica
                          const isMyHabitualReleasedToday = myHabitualDesk 
                            ? releases.some(r => r.ownerId === myHabitualDesk.ownerId && r.date === selectedDate)
                            : false;
                          
                          // 1. Incongruencia: Evitar que el usuario reserve temporalmente su propia mesa
                          if (myHabitualDesk?.id === selectedDesk.id) {
                            return (
                              <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded mb-2 border border-blue-100">
                                {isMyHabitualReleasedToday 
                                  ? "Has liberado tu puesto para este día. Si quieres volver a ocuparlo, anula tu ausencia desde el panel izquierdo."
                                  : "Este es tu puesto habitual y ya lo tienes asignado para este día."}
                              </p>
                            );
                          }

                          if (myHabitualDesk && !isMyHabitualReleasedToday) {
                            return (
                              <p className="text-xs text-red-600 bg-red-50 p-2 rounded mb-2 border border-red-100">
                                Ya tienes tu puesto habitual asignado para este día. Si deseas reservar este puesto, primero debes notificar que "No vas a ir" en tu puesto habitual.
                              </p>
                            );
                          }

                          if (isMultiBookingMode) {
                            return (
                              <div className="space-y-2 mt-2 bg-gray-50 p-3 rounded border border-gray-100">
                                <p className="text-xs font-semibold text-gray-700">Reservar desde el {selectedDate} hasta:</p>
                                <input 
                                  type="date" 
                                  min={selectedDate}
                                  value={multiBookingEndDate}
                                  onChange={e => setMultiBookingEndDate(e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand-red"
                                />
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => {
                                      if (!multiBookingEndDate) return;
                                      
                                      // Generar array de fechas
                                      const dates = [];
                                      let curr = new Date(selectedDate);
                                      const end = new Date(multiBookingEndDate);
                                      while (curr <= end) {
                                        dates.push(curr.toISOString().split('T')[0]);
                                        curr.setUTCDate(curr.getUTCDate() + 1);
                                      }
                                      
                                      // 1. Validar que la mesa esté libre en todos esos días
                                      const unavailableDates = dates.filter(d => {
                                        if (selectedDesk.ownerId) {
                                          const isReleased = releases.some(r => r.ownerId === selectedDesk.ownerId && r.date === d);
                                          if (!isReleased) return true;
                                        }
                                        return bookings.some(b => b.deskId === selectedDesk.id && b.date === d);
                                      });

                                      if (unavailableDates.length > 0) {
                                        toast.error(`El puesto no está libre los días: ${unavailableDates.join(', ')}`);
                                        return;
                                      }

                                      // 2. Validar que no excede los días liberados de su puesto habitual
                                      if (myHabitualDesk) {
                                        const unreleasedDates = dates.filter(d => !futureReleases.includes(d));
                                        if (unreleasedDates.length > 0) {
                                          toast.error(`No puedes reservar en días que no has liberado tu puesto habitual: ${unreleasedDates.join(', ')}`);
                                          return;
                                        }
                                      }

                                      // 3. Validar que el usuario no tenga ya otra mesa temporal reservada ese día
                                      const alreadyBookedDates = dates.filter(d => 
                                        bookings.some(b => b.userId === user?.uid && b.date === d && desks.find(desk => desk.id === b.deskId)?.type !== 'meeting_room')
                                      );
                                      if (alreadyBookedDates.length > 0) {
                                        toast.error(`Ya tienes otro puesto reservado los días: ${alreadyBookedDates.join(', ')}`);
                                        return;
                                      }

                                      bookDesk(selectedDesk.id, dates);
                                      setSelectedDesk(null);
                                      setIsMultiBookingMode(false);
                                      setMultiBookingEndDate('');
                                    }}
                                    disabled={!multiBookingEndDate || multiBookingEndDate < selectedDate}
                                    className="flex-1 bg-brand-red hover:bg-[#A31C30] text-white py-1.5 rounded text-xs font-medium disabled:opacity-50"
                                  >
                                    Confirmar
                                  </button>
                                  <button 
                                    onClick={() => setIsMultiBookingMode(false)}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-1.5 rounded text-xs font-medium"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={() => {
                                  const date = selectedDate;
                                  // 1. Validar si está libre
                                  if (selectedDesk.ownerId) {
                                    const isReleased = releases.some(r => r.ownerId === selectedDesk.ownerId && r.date === date);
                                    if (!isReleased) {
                                      toast.error(`El puesto no está libre el día: ${date}`);
                                      return;
                                    }
                                  }
                                  if (bookings.some(b => b.deskId === selectedDesk.id && b.date === date)) {
                                    toast.error(`El puesto ya está reservado el día: ${date}`);
                                    return;
                                  }
                                  // 2. Validar si tiene habitual
                                  if (myHabitualDesk && !futureReleases.includes(date)) {
                                    toast.error(`No puedes reservar este día porque no has liberado tu puesto habitual: ${date}`);
                                    return;
                                  }

                                  // 3. Validar si ya tiene otra reserva
                                  const alreadyBooked = bookings.some(b => b.userId === user?.uid && b.date === date && desks.find(desk => desk.id === b.deskId)?.type !== 'meeting_room');
                                  if (alreadyBooked) {
                                    toast.error(`Ya tienes otro puesto reservado el día: ${date}`);
                                    return;
                                  }

                                  bookDesk(selectedDesk.id, [date]);
                                  setSelectedDesk(null);
                                }}
                                className="w-full bg-brand-red hover:bg-[#A31C30] text-white py-2 rounded-md text-sm font-medium"
                              >
                                Reservar para el {selectedDate}
                              </button>
                              <button 
                                onClick={() => setIsMultiBookingMode(true)}
                                className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 py-1.5 rounded-md text-xs font-medium"
                              >
                                Reservar para varios días
                              </button>
                            </div>
                          );
                        })()}

                        {/* Si no tengo habitual y el puesto no tiene dueño */}
                        {!myHabitualDesk && !selectedDesk.ownerId && (
                          <button 
                            onClick={() => {
                              claimHabitualDesk(selectedDesk.id);
                              setSelectedDesk(null);
                            }}
                            className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-md text-sm font-medium mt-2 border border-blue-200"
                          >
                            Fijar como mi puesto habitual (Permanente)
                          </button>
                        )}
                      </>
                    )}
                      {getDeskStatus(selectedDesk) === 'booked' && (
                        <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-2">
                          <p className="text-sm font-medium text-red-800">No disponible</p>
                          <p className="text-xs text-red-600 mt-1">
                            Reservado por: <span className="font-bold">{
                              bookings.find(b => b.deskId === selectedDesk.id && b.date === selectedDate)?.userName || 
                              selectedDesk.ownerName || 
                              'Usuario Desconocido'
                            }</span>
                          </p>
                          {isAdmin && bookings.find(b => b.deskId === selectedDesk.id && b.date === selectedDate) && (
                            <button
                              onClick={async () => {
                                const booking = bookings.find(b => b.deskId === selectedDesk.id && b.date === selectedDate);
                                if (booking) {
                                  const isConfirmed = await confirm({
                                    message: "¿Estás seguro de que deseas forzar la cancelación de esta reserva temporal como administrador?",
                                    confirmText: "Sí, cancelar reserva"
                                  });
                                  if (isConfirmed) {
                                    cancelBooking(booking.id);
                                    setSelectedDesk(null);
                                    toast.success('Reserva temporal cancelada forzosamente');
                                  }
                                }
                              }}
                              className="w-full mt-3 bg-red-100 hover:bg-red-200 text-red-700 py-1.5 rounded-md text-xs font-medium border border-red-200 transition-colors"
                            >
                              Cancelar reserva (Admin)
                            </button>
                          )}
                        </div>
                      )}
                  </>
                )}
              </>
            )}

            <button 
              onClick={() => setSelectedDesk(null)}
              className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 rounded-md text-sm font-medium mt-2"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 pt-6 flex items-center gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-400 border border-green-500"></div>
          Disponible
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-400 border border-red-500"></div>
          Ocupado
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-amber-400 border border-amber-500"></div>
          Seleccionado
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 border border-blue-600 ring-2 ring-blue-200 ring-offset-1 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full opacity-75"></div>
          </div>
          Tu reserva / habitual
        </div>
      </div>
    </div>
  );
}
