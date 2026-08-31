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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-3">
            Viajes
            <button 
              onClick={() => setIsGuideOpen(true)}
              className="text-gray-400 hover:text-brand-red transition-colors"
              title="Ver guía de uso"
            >
              <Info className="w-5 h-5" />
            </button>
          </h1>
          <p className="text-gray-500 text-sm">Comparte coche con tus compañeros</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsGuideOpen(true)}
            className="hidden md:flex bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors items-center gap-2 shadow-sm text-sm"
          >
            <Info className="w-4 h-4" />
            Guía de uso
          </button>
          {!isNew && (
            <Link
              to="/carpooling/new"
              className="bg-brand-red text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#A31C30] transition-colors flex items-center gap-2 shadow-sm text-sm"
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
