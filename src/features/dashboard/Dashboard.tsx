import { useNavigate } from 'react-router-dom';
import { Car, Monitor, Wrench, Sparkles, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import { useSystemSettings } from '../../contexts/SystemSettingsContext';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, canManageGadgets } = useAuth();
  const { isGadgetsMaintenance } = useSystemSettings();

  const canAccessGadgets = !isGadgetsMaintenance || canManageGadgets;

  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'compañero/a';
  
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Welcome Banner - Estilo Corporativo EOSA */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-white via-rose-50/25 to-gray-50/60 border border-gray-200/90 shadow-xs text-gray-900 p-7 sm:p-9 md:p-10">
        {/* Línea superior con acento sutil en rojo EOSA */}
        <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-brand-red/80 via-brand-red to-rose-400/80 pointer-events-none" />

        {/* Marca de agua geométrica sutil inspirada en el isotipo de EOSA */}
        <svg
          className="absolute right-0 top-0 h-full w-96 text-brand-red/[0.04] pointer-events-none translate-x-12 -translate-y-6"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="20" y="20" width="80" height="80" rx="12" stroke="currentColor" strokeWidth="6" />
          <rect x="60" y="60" width="80" height="80" rx="12" stroke="currentColor" strokeWidth="6" />
          <rect x="100" y="100" width="80" height="80" rx="12" stroke="currentColor" strokeWidth="6" />
        </svg>

        {/* Resplandor ambiental cálido muy suave */}
        <div className="absolute -top-24 -right-16 w-80 h-80 bg-rose-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 w-64 h-64 bg-slate-100/60 rounded-full blur-3xl pointer-events-none" />

        {/* Contenido Principal */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            {/* Badge de Fecha y Marca EOSA */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-xs font-bold text-brand-red shadow-2xs mb-4">
              <Sparkles className="w-3.5 h-3.5 text-brand-red" />
              <span className="uppercase tracking-wider text-[10px]">EOSA</span>
              <span className="w-1 h-1 rounded-full bg-brand-red/50" />
              <span className="font-semibold text-gray-700">{capitalizedDate}</span>
            </div>

            {/* Titular con Énfasis en Rojo Corporativo */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-900 mb-3">
              ¡Te damos la bienvenida,{' '}
              <span className="text-brand-red">
                {displayName}
              </span>!
            </h1>

            {/* Descripción Corporativa */}
            <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl">
              Plataforma interna de gestión de <strong className="text-gray-800 font-bold">EOSA (Estrategia y Organización)</strong>. Organiza y programa la asistencia al puesto en la oficina (Viajes, cliente, vacaciones, teletrabajo), coordinación de viajes y gestión de los gadgets de forma ágil y coordinada.
            </p>

            {/* Badges de Servicios */}
            <div className="flex flex-wrap items-center gap-2.5 mt-6 pt-5 border-t border-gray-200/70 text-xs">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-200 shadow-2xs text-gray-700">
                <span className="w-2 h-2 rounded-full bg-slate-700" />
                <span className="font-semibold">Puestos de trabajo</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-200 shadow-2xs text-gray-700">
                <span className="w-2 h-2 rounded-full bg-brand-red" />
                <span className="font-semibold">Movilidad compartida</span>
              </div>
              {canAccessGadgets && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-200 shadow-2xs text-gray-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-semibold">Catálogo de material</span>
                  {isGadgetsMaintenance && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-bold ml-1">
                      Mantenimiento
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Accesos Rápidos Ejecutivos (Desktop) */}
          <div className="hidden lg:flex flex-col gap-2.5 w-76 flex-shrink-0">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1 flex items-center justify-between">
              <span>Accesos directos</span>
              <span className="text-[10px] text-brand-red font-semibold">1 clic</span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/desks')}
              className="group flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-slate-50/80 border border-gray-200 hover:border-slate-400 transition-all text-left cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 group-hover:scale-105 transition-transform">
                  <Monitor className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 group-hover:text-slate-900 transition-colors">Reserva de Puestos</p>
                  <p className="text-[11px] text-gray-500">Mapa visual y ausencias</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/carpooling')}
              className="group flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-rose-50/50 border border-gray-200 hover:border-brand-red/50 transition-all text-left cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-brand-red group-hover:scale-105 transition-transform">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 group-hover:text-brand-red transition-colors">Viajes Compartidos</p>
                  <p className="text-[11px] text-gray-500">Rutas y compañeros</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-red group-hover:translate-x-0.5 transition-all" />
            </button>

            {canAccessGadgets && (
              <button
                type="button"
                onClick={() => navigate('/gadgets')}
                className="group flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-amber-50/50 border border-gray-200 hover:border-amber-400 transition-all text-left cursor-pointer shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-gray-900 group-hover:text-amber-800 transition-colors">Catálogo de Gadgets</p>
                      {isGadgetsMaintenance && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          Mantenimiento
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500">Préstamo de material</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-red block mb-0.5">Áreas operativas</span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
              ¿Qué necesitas gestionar hoy?
            </h2>
          </div>
        </div>

        <div className={clsx(
          "grid grid-cols-1 gap-6",
          canAccessGadgets ? "md:grid-cols-3" : "md:grid-cols-2"
        )}>
          
          {/* Reserva de Puestos */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs hover:shadow-md transition-all flex flex-col overflow-hidden group">
            <div className="p-7 pb-6 flex-1">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 mb-5 border border-slate-200 group-hover:scale-105 transition-transform">
                <Monitor className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 mb-2">Reserva de Puestos</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-5">
                Organiza tu asistencia presencial. Fija tu puesto habitual permanente o reserva un puesto disponible para días puntuales. Informa de tus ausencias cuando teletrabajes.
              </p>
              <ul className="space-y-2 text-xs text-gray-500 mb-5">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div> Mapa visual interactivo de la oficina</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div> Calendario y registro de ausencias</li>
              </ul>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50/70">
              <button 
                onClick={() => navigate('/desks')}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm py-2.5 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                Abrir Mapa de Puestos
              </button>
            </div>
          </div>

          {/* Carpooling */}
          <div className="bg-white rounded-2xl border border-rose-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col overflow-hidden group">
            <div className="p-7 pb-6 flex-1">
              <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-brand-red mb-5 border border-rose-200 group-hover:scale-105 transition-transform">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 mb-2">Viajes Compartidos</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-5">
                Comparte trayectos para venir a la oficina o desplazarte a clientes. Publica tus rutas si tienes asientos libres o reserva plaza con tus compañeros de EOSA.
              </p>
              <ul className="space-y-2 text-xs text-gray-500 mb-5">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-brand-red rounded-full"></div> Calendario sincronizado y búsqueda inteligente</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-brand-red rounded-full"></div> Reserva de plaza inmediata en 1 clic</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-brand-red rounded-full"></div> Fomento de la sostenibilidad corporativa</li>
              </ul>
            </div>
            <div className="p-4 border-t border-rose-100 bg-rose-50/30 flex gap-2">
              <button 
                onClick={() => navigate('/carpooling')}
                className="flex-1 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl transition-all text-xs sm:text-sm cursor-pointer shadow-2xs"
              >
                Ver viajes
              </button>
              <button 
                onClick={() => navigate('/carpooling/new')}
                className="flex-1 bg-brand-red hover:bg-[#a31b31] text-white font-bold py-2.5 rounded-xl transition-all text-xs sm:text-sm cursor-pointer shadow-2xs"
              >
                Publicar viaje
              </button>
            </div>
          </div>

          {/* Gadgets */}
          {canAccessGadgets && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs hover:shadow-md transition-all flex flex-col overflow-hidden group">
              <div className="p-7 pb-6 flex-1">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-5 border border-amber-200 group-hover:scale-105 transition-transform">
                  <Wrench className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-2 flex items-center justify-between">
                  <span>Catálogo de Gadgets</span>
                  {isGadgetsMaintenance && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      Mantenimiento
                    </span>
                  )}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-5">
                  Consulta y solicita el préstamo de material y periféricos de la empresa (monitores, cables, adaptadores y proyectores) para tus reuniones o teletrabajo.
                </p>
                <ul className="space-y-2 text-xs text-gray-500 mb-5">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div> Inventario controlado de dispositivos</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div> Solicitudes y entregas organizadas</li>
                </ul>
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50/70">
                <button 
                  onClick={() => navigate('/gadgets')}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm py-2.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  Abrir Catálogo
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
