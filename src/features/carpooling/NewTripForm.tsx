import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Check, Repeat } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useCarpooling } from './hooks/useCarpooling';
import { clsx } from 'clsx';

export function NewTripForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [returnTrip, setReturnTrip] = useState(false);
  const { publishTrip } = useCarpooling(new Date().toISOString().split('T')[0]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const origin = formData.get('origin') as string;
    const destination = formData.get('destination') as string;
    const stops = formData.get('stops') as string;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const totalSeats = parseInt(formData.get('seats') as string, 10);

    try {
      // 1. Viaje de ida
      await publishTrip({ origin, destination, date, time, totalSeats, stops: stops || undefined });
      
      // 2. Viaje de vuelta
      if (returnTrip) {
        const returnDate = formData.get('returnDate') as string || date;
        const returnTime = formData.get('returnTime') as string;
        await publishTrip({
          origin: destination, // Invertido
          destination: origin, // Invertido
          date: returnDate,
          time: returnTime,
          totalSeats,
          stops: stops || undefined // Mismos comentarios para la vuelta por si acaso
        });
      }
      
      toast.success(returnTrip ? 'Ambos viajes publicados con éxito' : 'Viaje publicado con éxito');
      navigate('/carpooling');
    } catch (err) {
      console.error(err);
      toast.error('Error al publicar el viaje');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium px-2 py-1 -ml-2 rounded-md hover:bg-gray-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-black text-gray-900 mb-8">Publicar viaje</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fila 1: Origen y Destino */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="origin" className="block text-sm font-bold text-gray-700">
                Origen
              </label>
              <input
                type="text"
                id="origin"
                name="origin"
                required
                placeholder="Ej: Polígono industrial"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="destination" className="block text-sm font-bold text-gray-700">
                Destino
              </label>
              <input
                type="text"
                id="destination"
                name="destination"
                required
                placeholder="Ej: Oficina EOSA"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
          </div>
          
          {/* Fila Opcional: Paradas Intermedias */}
          <div className="space-y-2">
            <label htmlFor="stops" className="block text-sm font-bold text-gray-700">
              Paradas intermedias / Detalles <span className="text-gray-400 font-normal">(Opcional)</span>
            </label>
            <input
              type="text"
              id="stops"
              name="stops"
              placeholder="Ej: Pasaré por Santiago a recoger gente sobre las 09:15..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red bg-gray-50 focus:bg-white transition-colors"
            />
          </div>

          {/* Fila 2: Fecha, Hora, Plazas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="space-y-2">
              <label htmlFor="date" className="block text-sm font-bold text-gray-700">
                Fecha de salida
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red bg-gray-50 focus:bg-white transition-colors appearance-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="time" className="block text-sm font-bold text-gray-700">
                Hora de salida
              </label>
              <div className="relative">
                <input
                  type="time"
                  id="time"
                  name="time"
                  required
                  defaultValue="08:30"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red bg-gray-50 focus:bg-white transition-colors appearance-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="seats" className="block text-sm font-bold text-gray-700">
                Plazas disponibles
              </label>
              <div className="relative">
                <select
                  id="seats"
                  name="seats"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red bg-gray-50 focus:bg-white transition-colors appearance-none cursor-pointer"
                  defaultValue="3"
                >
                  <option value="1">1 plaza</option>
                  <option value="2">2 plazas</option>
                  <option value="3">3 plazas</option>
                  <option value="4">4 plazas</option>
                  <option value="5">5 plazas</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Viaje de Vuelta Automático */}
          <div className="pt-4 pb-2">
            <button
              type="button"
              onClick={() => setReturnTrip(!returnTrip)}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all w-full text-left",
                returnTrip 
                  ? "bg-brand-red/5 border-brand-red text-brand-red" 
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
              )}
            >
              <div className={clsx(
                "w-5 h-5 rounded-md flex items-center justify-center border",
                returnTrip ? "bg-brand-red border-brand-red" : "bg-white border-gray-300"
              )}>
                {returnTrip && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <div className="flex-1 flex justify-between items-center">
                <span className="font-bold">Añadir viaje de vuelta automáticamente</span>
                <Repeat className={clsx("w-5 h-5", returnTrip ? "text-brand-red" : "text-gray-400")} />
              </div>
            </button>
            
            {/* Campos extra de la vuelta */}
            {returnTrip && (
              <div className="mt-4 p-5 bg-brand-red/5 rounded-xl border border-brand-red/20 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label htmlFor="returnDate" className="block text-sm font-bold text-brand-red">
                    Fecha de vuelta
                  </label>
                  <input
                    type="date"
                    id="returnDate"
                    name="returnDate"
                    required={returnTrip}
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 border border-brand-red/30 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red bg-white transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="returnTime" className="block text-sm font-bold text-brand-red">
                    Hora de vuelta
                  </label>
                  <input
                    type="time"
                    id="returnTime"
                    name="returnTime"
                    required={returnTrip}
                    defaultValue="18:00"
                    className="w-full px-4 py-2.5 border border-brand-red/30 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red bg-white transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red hover:bg-[#A31C30] text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:ring-offset-2 disabled:opacity-70 flex justify-center items-center"
            >
              {loading ? 'Publicando...' : returnTrip ? 'Publicar 2 viajes (Ida y Vuelta)' : 'Publicar viaje'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
