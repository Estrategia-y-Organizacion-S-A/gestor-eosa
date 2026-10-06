import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Calendar } from 'lucide-react';

interface LegalPageContainerProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalPageContainer({ title, subtitle, lastUpdated, children }: LegalPageContainerProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Botón Volver */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-brand-red bg-white border border-gray-200 px-3.5 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Calendar className="w-3.5 h-3.5 text-brand-red" />
          <span>Actualizado: {lastUpdated}</span>
        </div>
      </div>

      {/* Cabecera del Documento Legal */}
      <div className="bg-white rounded-3xl p-7 sm:p-9 border border-gray-200/90 shadow-2xs relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-brand-red" />
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[10px] font-bold uppercase tracking-wider text-brand-red mb-3">
            <Shield className="w-3.5 h-3.5 text-brand-red" />
            <span>Marco Legal Corporativo · EOSA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-gray-500 leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Contenido Editorial Legal */}
      <div className="bg-white rounded-3xl p-7 sm:p-10 border border-gray-200/90 shadow-2xs text-gray-700 leading-relaxed text-sm space-y-8">
        {children}
      </div>

      {/* Enlaces Rápidos a otros textos legales */}
      <div className="flex flex-wrap items-center justify-center gap-4 py-4 text-xs font-bold text-gray-500">
        <Link to="/aviso-legal" className="hover:text-brand-red transition-colors">Aviso Legal</Link>
        <span>·</span>
        <Link to="/privacidad" className="hover:text-brand-red transition-colors">Política de Privacidad</Link>
        <span>·</span>
        <Link to="/cookies" className="hover:text-brand-red transition-colors">Política de Cookies</Link>
      </div>
    </div>
  );
}
