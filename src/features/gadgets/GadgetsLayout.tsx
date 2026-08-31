import { useState, useMemo } from 'react';
import { Info, Monitor, Mouse, Cable, Video, PackageSearch, Hand, CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useGadgets } from './hooks/useGadgets';
import { GadgetsGuideModal } from './GadgetsGuideModal';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export function GadgetsLayout() {
  const { user } = useAuth();
  const { gadgets, borrowGadget, returnGadget, loading } = useGadgets();
  const [activeTab, setActiveTab] = useState<'catalogo' | 'mis'>('catalogo');
  const [filter, setFilter] = useState<string>('todos');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [bookingGadget, setBookingGadget] = useState<{id: string, name: string} | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const categories = [
    { id: 'todos', label: 'Todos', icon: PackageSearch },
    { id: 'pantallas', label: 'Pantallas', icon: Monitor },
    { id: 'audiovisual', label: 'Audiovisual', icon: Video },
    { id: 'perifericos', label: 'Periféricos', icon: Mouse },
    { id: 'cables', label: 'Cables', icon: Cable },
  ];

  const myGadgets = useMemo(() => gadgets.filter(g => g.currentBorrowerId === user?.uid), [gadgets, user]);
  
  const displayedGadgets = useMemo(() => {
    if (activeTab === 'mis') return myGadgets;
    if (filter === 'todos') return gadgets;
    return gadgets.filter(g => g.category === filter);
  }, [gadgets, myGadgets, activeTab, filter]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pantallas': return <Monitor className="w-8 h-8" />;
      case 'audiovisual': return <Video className="w-8 h-8" />;
      case 'perifericos': return <Mouse className="w-8 h-8" />;
      case 'cables': return <Cable className="w-8 h-8" />;
      default: return <PackageSearch className="w-8 h-8" />;
    }
  };

  return (
    <div className="space-y-6 relative max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-3">
            Gadgets
            <button 
              onClick={() => setIsGuideOpen(true)}
              className="text-gray-400 hover:text-brand-red transition-colors"
              title="Ver guía de uso"
            >
              <Info className="w-5 h-5" />
            </button>
          </h1>
          <p className="text-gray-500 text-sm">Inventario y reserva de equipos</p>
        </div>
        <button 
          onClick={() => setIsGuideOpen(true)}
          className="hidden md:flex bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors items-center gap-2 shadow-sm text-sm"
        >
          <Info className="w-4 h-4" />
          Guía de uso
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('catalogo')}
            className={clsx(
              "flex-1 py-4 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'catalogo' 
                ? "border-brand-red text-brand-red" 
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            Catálogo ({gadgets.length})
          </button>
          <button
            onClick={() => setActiveTab('mis')}
            className={clsx(
              "flex-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2",
              activeTab === 'mis' 
                ? "border-brand-red text-brand-red" 
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            Mis Préstamos
            {myGadgets.length > 0 && (
              <span className="bg-brand-red text-white text-xs px-2 py-0.5 rounded-full">
                {myGadgets.length}
              </span>
            )}
          </button>
        </div>

        <div className="p-6 md:p-8 bg-gray-50/50 min-h-[500px]">
          {/* Filters (only in catalog) */}
          {activeTab === 'catalogo' && (
            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilter(cat.id)}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all",
                    filter === cat.id 
                      ? "bg-gray-900 text-white shadow-md"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <cat.icon className="w-4 h-4" />
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64 text-gray-400">Cargando inventario...</div>
          ) : displayedGadgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <PackageSearch className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">
                {activeTab === 'catalogo' 
                  ? "No hay equipos en esta categoría." 
                  : "No tienes ningún equipo en préstamo ahora mismo."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedGadgets.map(gadget => {
                const isMine = gadget.currentBorrowerId === user?.uid;
                
                return (
                  <div key={gadget.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                    <div className="p-6 flex flex-col items-center text-center border-b border-gray-50 relative">
                      {/* Status indicator */}
                      <div className="absolute top-4 right-4">
                        {gadget.status === 'available' ? (
                          <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm" title="Disponible"></div>
                        ) : (
                          <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm" title="Prestado"></div>
                        )}
                      </div>
                      
                      <div className={clsx(
                        "w-20 h-20 rounded-2xl flex items-center justify-center mb-4",
                        gadget.status === 'available' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                      )}>
                        {getCategoryIcon(gadget.category)}
                      </div>
                      <h3 className="font-bold text-gray-900">{gadget.name}</h3>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mt-1 font-semibold">{gadget.category}</p>
                      {gadget.description && (
                        <p className="text-xs text-gray-500 mt-2 italic">{gadget.description}</p>
                      )}
                    </div>

                    <div className="p-4 bg-gray-50 flex-1 flex flex-col justify-end">
                      {activeTab === 'mis' ? (
                        <button
                          onClick={() => returnGadget(gadget.id)}
                          className="w-full bg-gray-900 hover:bg-black text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Devolver equipo
                        </button>
                      ) : (
                        gadget.status === 'available' ? (
                          <button
                            onClick={() => setBookingGadget({ id: gadget.id, name: gadget.name })}
                            className="w-full bg-green-50 text-green-700 hover:bg-green-100 font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm border border-green-200"
                          >
                            <Hand className="w-4 h-4" />
                            Solicitar Préstamo
                          </button>
                        ) : (
                          <div className="w-full bg-red-50 text-red-700 font-medium py-2 rounded-lg flex flex-col items-center justify-center gap-1 text-sm border border-red-100 opacity-90 cursor-not-allowed">
                            <div className="flex items-center gap-2">
                              {isMine ? (
                                <><CheckCircle2 className="w-4 h-4" /> Lo tienes tú</>
                              ) : (
                                <><AlertCircle className="w-4 h-4" /> Prestado</>
                              )}
                            </div>
                            {!isMine && gadget.currentBorrowerName && (
                              <div className="text-xs font-normal text-red-600 text-center flex flex-col gap-0.5">
                                <span>a <strong>{gadget.currentBorrowerName}</strong></span>
                                {gadget.expectedStartDate && gadget.expectedEndDate && (
                                  <span className="text-[10px]">
                                    ({new Date(gadget.expectedStartDate).toLocaleDateString()} {new Date(gadget.expectedStartDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(gadget.expectedEndDate).toLocaleDateString()} {new Date(gadget.expectedEndDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <GadgetsGuideModal 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
      />

      {/* Modal de Reserva */}
      {bookingGadget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-gray-900">Reservar {bookingGadget.name}</h2>
              <button onClick={() => setBookingGadget(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora de inicio</label>
                <input 
                  type="datetime-local" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora de fin</label>
                <input 
                  type="datetime-local" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red" 
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end">
              <button 
                onClick={() => setBookingGadget(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (!startDate || !endDate) {
                    toast.error('Por favor, indica ambas fechas.');
                    return;
                  }
                  if (new Date(startDate) >= new Date(endDate)) {
                    toast.error('La fecha de fin debe ser posterior a la de inicio.');
                    return;
                  }
                  borrowGadget(bookingGadget.id, startDate, endDate);
                  setBookingGadget(null);
                  setStartDate('');
                  setEndDate('');
                  toast.success('Préstamo solicitado con éxito');
                }}
                className="px-4 py-2 bg-brand-red hover:bg-[#A31C30] text-white rounded-lg font-medium transition-colors"
              >
                Confirmar Reserva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add RotateCcw to lucide-react import
import { RotateCcw } from 'lucide-react';
