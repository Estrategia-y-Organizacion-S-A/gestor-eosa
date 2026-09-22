import { X, Car, Calendar, Users, MapPin } from 'lucide-react';

interface CarpoolingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CarpoolingGuideModal({ isOpen, onClose }: CarpoolingGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Car className="w-6 h-6 text-brand-red" />
            Guía de uso de Viajes
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          <section className="space-y-3">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              1. Navegar por el Calendario
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              En la parte izquierda encontrarás el calendario interactivo. Los días que tienen un <span className="font-bold text-brand-red">puntito rojo</span> indican que hay viajes programados por tus compañeros para ese día. Al hacer clic en cualquier fecha, verás los viajes disponibles en el panel principal.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-500" />
              2. Publicar un Viaje (Ida y Vuelta)
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Si vienes a la oficina en coche y tienes plazas libres, haz clic en <strong>"Publicar viaje"</strong>. Los viajes ahora están <strong>separados por trayectos (solo ida o solo vuelta)</strong> para dar máxima flexibilidad. 
              <br/><br/>
              Podrás rellenar el origen, destino, hora de salida, plazas y añadir <strong>paradas intermedias o detalles</strong> si vas a recoger a alguien por el camino. Además, hemos añadido una opción para <strong>crear el viaje de vuelta automáticamente</strong> invirtiendo el origen y el destino con un solo clic.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              3. Reservar y Gestionar Plazas
            </h3>
            <div className="bg-gray-50 p-4 rounded-xl space-y-3 text-sm text-gray-600">
              <p>
                <strong>Máxima flexibilidad:</strong> Como los viajes son trayectos únicos, puedes apuntarte a la ida con un compañero y volver con otro distinto. Solo busca el trayecto que te encaje y pulsa en "Reservar plaza".
              </p>
              <p>
                <strong>Mis reservas:</strong> Aquí verás todos los trayectos a los que te has apuntado. Si finalmente no vas a viajar, recuerda usar el botón "Anular reserva" para liberar la plaza y que otro compañero pueda usarla.
              </p>
              <p>
                <strong>Mis viajes publicados:</strong> Tu panel de control como conductor. Podrás ver los trayectos que has creado y cancelarlos si te surge algún imprevisto (tus pasajeros perderán la reserva automáticamente).
              </p>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
