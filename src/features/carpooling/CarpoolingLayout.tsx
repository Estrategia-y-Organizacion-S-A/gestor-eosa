import { Outlet, Link, useLocation } from 'react-router-dom';
import { Plus, Info } from 'lucide-react';
import { useState } from 'react';
import { CarpoolingHome } from './CarpoolingHome';
import { CarpoolingGuideModal } from './CarpoolingGuideModal';

export function CarpoolingLayout() {
  const location = useLocation();
  const isNew = location.pathname.includes('/new');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <div className="space-y-6 relative">
      {/* Header Corporativo EOSA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-gray-200/80 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-red bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/60">
              Movilidad · EOSA
            </span>
            <button 
              onClick={() => setIsGuideOpen(true)}
              className="text-gray-400 hover:text-brand-red transition-colors p-0.5"
              title="Ver guía de uso"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Viajes Compartidos
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 max-w-xl">
            Optimiza desplazamientos a oficinas, clientes y eventos compartiendo trayectos con los profesionales de EOSA.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button 
            onClick={() => setIsGuideOpen(true)}
            className="hidden md:inline-flex bg-white border border-gray-200 text-gray-700 px-3.5 py-2.5 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all items-center gap-2 shadow-2xs text-xs sm:text-sm cursor-pointer"
          >
            <Info className="w-4 h-4 text-brand-red" />
            Guía de uso
          </button>
          {!isNew && (
            <Link
              to="/carpooling/new"
              className="bg-brand-red hover:bg-[#a31b31] text-white px-4 sm:px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-xs text-xs sm:text-sm cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              Publicar viaje
            </Link>
          )}
        </div>
      </div>
      
      {isNew ? <Outlet /> : <CarpoolingHome />}

      <CarpoolingGuideModal 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
      />
    </div>
  );
}
