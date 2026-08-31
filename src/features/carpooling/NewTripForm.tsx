import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useCarpooling } from './hooks/useCarpooling';

export function NewTripForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { publishTrip } = useCarpooling(new Date().toISOString().split('T')[0]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      origin: formData.get('origin') as string,
      destination: formData.get('destination') as string,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      totalSeats: parseInt(formData.get('seats') as string, 10),
    };

    try {
      await publishTrip(data);
      toast.success('Viaje publicado con éxito');
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Publicar viaje</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fila 1: Origen y Destino */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="origin" className="block text-sm font-medium text-gray-700">
                Origen
              </label>
              <input
                type="text"
                id="origin"
                name="origin"
                required
                placeholder="Ej: Polígono industrial"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                Destino
              </label>
              <input
                type="text"
                id="destination"
                name="destination"
                required
                placeholder="Ej: Oficina EOSA"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red transition-colors"
              />
            </div>
          </div>

          {/* Fila 2: Fecha, Hora, Plazas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Fecha
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red transition-colors appearance-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                Hora de salida
              </label>
              <div className="relative">
                <input
                  type="time"
                  id="time"
                  name="time"
                  required
                  defaultValue="08:30"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red transition-colors appearance-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="seats" className="block text-sm font-medium text-gray-700">
                Plazas disponibles
              </label>
              <div className="relative">
                <select
                  id="seats"
                  name="seats"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red transition-colors appearance-none bg-white"
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

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E0868F] hover:bg-brand-red text-white font-medium py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:ring-offset-2 disabled:bg-gray-300"
            >
              {loading ? 'Publicando...' : 'Publicar viaje'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
