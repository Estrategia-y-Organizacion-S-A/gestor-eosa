import { X, Wrench, Search, Hand, RotateCcw } from 'lucide-react';

interface GadgetsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GadgetsGuideModal({ isOpen, onClose }: GadgetsGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-brand-red" />
            Guía de uso de Gadgets
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
              <Search className="w-5 h-5 text-blue-500" />
              1. Catálogo de Equipos
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              En la pestaña <strong>"Catálogo"</strong> puedes ver todo el material audiovisual e informático de la empresa. Puedes usar los filtros superiores (Pantallas, Cables, Periféricos) para encontrar rápidamente lo que necesitas.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <Hand className="w-5 h-5 text-green-500" />
              2. Solicitar un Préstamo
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Si un equipo tiene el botón verde <strong>"Solicitar Préstamo"</strong>, significa que está físicamente disponible. Al pulsarlo, el equipo se asocia a tu cuenta. Si está en rojo, te indicará qué compañero lo tiene actualmente por si necesitas pedírselo urgente.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-orange-500" />
              3. Devolver el material
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              ¡No te olvides de devolver las cosas! En la pestaña <strong>"Mis Préstamos"</strong> verás tu "mochila" virtual con todos los equipos que tienes en tu poder. Cuando termines de usar uno, pulsa <strong>"Devolver equipo"</strong> para que vuelva a estar disponible para todos.
            </p>
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
