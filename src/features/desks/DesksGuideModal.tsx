import { X, Calendar, Monitor, UserCheck, CalendarOff } from 'lucide-react';

interface DesksGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DesksGuideModal({ isOpen, onClose }: DesksGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Monitor className="w-6 h-6 text-brand-red" />
            Guía de uso de Reserva de Puestos
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
              <UserCheck className="w-5 h-5 text-blue-500" />
              1. Tu Puesto Habitual
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Si vienes a la oficina habitualmente, haz clic en un puesto libre (verde) y selecciona <strong>"Fijar como mi puesto habitual"</strong>. A partir de ese momento, ese será tu puesto fijo. Lo verás marcado siempre con un anillo azul brillante. ¡Solo puedes tener un puesto habitual!
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <CalendarOff className="w-5 h-5 text-orange-500" />
              2. Avisar de ausencias (Teletrabajo/Vacaciones/Cliente)
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Cuando tengas un puesto habitual y no vayas a acudir a la oficina, es importante marcar el puesto como liberado. Selecciona una fecha (o rango de fechas) en el panel izquierdo y haz clic en <strong>"No voy a ir"</strong> o <strong>"Liberar rango de fechas"</strong>. Tu puesto se pondrá verde (libre) esos días para que otros puedan usarlo.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-red" />
              3. Reservas Puntuales
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Si no tienes un puesto fijo, puedes reservar cualquier puesto que esté en verde para el día seleccionado. Simplemente haz clic en él y dale a <strong>"Reservar para el [fecha]"</strong>. Ten en cuenta que solo puedes tener un puesto reservado al día.
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
