import { Wrench, Monitor, Info } from 'lucide-react';
import { GadgetsGuideModal } from './GadgetsGuideModal';
import { useState } from 'react';

export function GadgetsLayout() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Monitor className="w-8 h-8 text-brand-red" />
            Préstamo de Gadgets
          </h1>
          <p className="text-gray-500 mt-1">
            Reserva temporal de equipos y accesorios
          </p>
        </div>
        <button 
          onClick={() => setIsGuideOpen(true)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-full transition-all shadow-sm self-start md:self-auto font-medium"
        >
          <Info className="w-4 h-4" />
          Guía de uso
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-orange-200 p-12 text-center flex flex-col items-center max-w-2xl mx-auto mt-12">
        <Wrench className="w-16 h-16 text-orange-500 mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Sección Temporalmente no Disponible</h2>
        <p className="text-gray-600 text-lg leading-relaxed mb-6">
          Estamos realizando tareas de mantenimiento y actualización en el sistema de inventario de equipos. Pronto volverá a estar operativo.
        </p>
        <p className="text-sm text-gray-400 font-medium bg-gray-50 px-4 py-2 rounded-full">
          Disculpad las molestias
        </p>
      </div>

      <GadgetsGuideModal 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
      />
    </div>
  );
}
