import { X, Wrench, Search, Hand, RotateCcw, MapPin, ShieldCheck } from 'lucide-react';

interface GadgetsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GadgetsGuideModal({ isOpen, onClose }: GadgetsGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-brand-red" />
            Guía de uso: Préstamo de Gadgets
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <section className="space-y-2">
            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-500" />
              1. Catálogo y Búsqueda Rápida
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Encuentra rápidamente pantallas portátiles, ratones, adaptadores HDMI o proyectores usando el buscador o filtrando por categorías. Cada tarjeta indica si el equipo está <strong>Disponible</strong> o <strong>En Préstamo</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-rose-500" />
              2. Ubicación Física del Material
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Cada equipo tiene señalada su ubicación en la oficina (por ejemplo: <em>Taquilla 2</em>, <em>Armario de Reuniones</em>, etc.). Al solicitarlo, acude a ese punto a recogerlo y asegúrate de devolverlo exactamente al mismo sitio.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <Hand className="w-5 h-5 text-green-500" />
              3. Solicitar un Préstamo en 1 Clic
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Pulsa <strong>"Solicitar Préstamo"</strong> y elige cómodamente la duración estimada (<em>Solo hoy</em>, <em>Hasta mañana</em>, <em>Esta semana</em> o una fecha personalizada). Puedes añadir una nota opcional indicando en qué sala o mesa estarás.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-500" />
              4. Devolución del Equipo
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              En la pestaña <strong>"Mis Préstamos"</strong> verás los dispositivos que tienes en tu poder. Cuando termines de usarlos, devuélvelos físicamente a su lugar y pulsa <strong>"Devolver equipo"</strong> para que queden disponibles para el resto de compañeros.
            </p>
          </section>

          <section className="space-y-2 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-red" />
              ¿Quién gestiona el inventario?
            </h3>
            <p className="text-gray-600 leading-relaxed text-xs">
              Los compañeros con rol de <strong>Gestor de Gadgets</strong> tienen habilitado el botón para añadir nuevo material, editar especificaciones o forzar devoluciones en caso de extravío u olvido.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-black transition-colors text-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
