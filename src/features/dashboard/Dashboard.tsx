import { useNavigate } from 'react-router-dom';
import { Car, Monitor, Wrench } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 md:p-10 shadow-lg text-white relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            ¡Te damos la bienvenida, {user?.displayName || user?.email?.split('@')[0] || 'compañero/a'}!
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl">
            Este es tu Portal EOSA. Desde aquí podrás organizar tu asistencia a la oficina, compartir viajes y gestionar los recursos compartidos de la empresa de forma sencilla.
          </p>
        </div>
        {/* Decorative background element */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-brand-red opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          ¿Qué necesitas hacer hoy?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Reserva de Mesas */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group">
            <div className="p-8 pb-6 flex-1">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                <Monitor className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Reserva de Mesas</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Organiza tu asistencia a la oficina. Fija tu puesto habitual permanente o reserva una mesa libre para días puntuales. No olvides liberar tu silla cuando teletrabajes o estés de vacaciones.
              </p>
              <ul className="space-y-2 text-sm text-gray-500 mb-6">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div> Mapa visual de la oficina</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div> Gestión de ausencias</li>
              </ul>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button 
                onClick={() => navigate('/desks')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                Abrir Mapa de Mesas
              </button>
            </div>
          </div>

          {/* Carpooling */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group">
            <div className="p-8 pb-6 flex-1">
              <div className="w-14 h-14 bg-brand-red/10 rounded-xl flex items-center justify-center text-brand-red mb-6 group-hover:scale-110 transition-transform">
                <Car className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Viajes</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Comparte coche para venir a la oficina. Publica tus trayectos si tienes asientos libres o reserva plaza en los coches de tus compañeros para ahorrar y reducir emisiones.
              </p>
              <ul className="space-y-2 text-sm text-gray-500 mb-6">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-brand-red rounded-full"></div> Calendario de viajes</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-brand-red rounded-full"></div> Reserva de plazas en 1 clic</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-brand-red rounded-full"></div> Gestión de tus trayectos</li>
              </ul>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
              <button 
                onClick={() => navigate('/carpooling')}
                className="flex-1 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                Buscar viaje
              </button>
              <button 
                onClick={() => navigate('/carpooling/new')}
                className="flex-1 bg-brand-red hover:bg-[#A31C30] text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                Publicar viaje
              </button>
            </div>
          </div>

          {/* Gadgets */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group">
            <div className="p-8 pb-6 flex-1">
              <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 mb-6 group-hover:scale-110 transition-transform">
                <Wrench className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center justify-between">
                Gadgets
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Consulta y reserva el inventario de equipos de la empresa (monitores extra, proyectores, micrófonos, etc.). Asegúrate de tener lo que necesitas para tu jornada.
              </p>
              <ul className="space-y-2 text-sm text-gray-500 mb-6">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div> Catálogo de dispositivos</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div> Sistema de préstamos</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div> Trazabilidad de equipos</li>
              </ul>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button 
                onClick={() => navigate('/gadgets')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                Abrir Catálogo
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
