import { Link } from 'react-router-dom';
import { openCookieSettings } from '../utils/cookieEvents';
import { MapPin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto text-gray-600 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          
          {/* Columna 1: Identidad Corporativa EOSA */}
          <div className="space-y-4">
            <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
              <img src="/logo.png" alt="EOSA Estrategia y Organización" className="h-9 w-auto" />
            </Link>
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
              <strong className="text-gray-800 font-semibold">EOSA (Estrategia y Organización, S.A.)</strong>. Tres décadas de consultoría estratégica, innovación y sostenibilidad aportando soluciones eficientes.
            </p>
            <div className="pt-1 text-xs text-gray-500 space-y-1.5">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
                <span>Calle Doctor Cadaval, 5 – 1ºB (36201 Vigo)</span>
              </div>
              <div className="flex items-center gap-2 pl-6 text-[11px] text-gray-400">
                <span>Tel: (+34) 986 419 922 · eosa@eosa.com</span>
              </div>
              <div className="flex items-center gap-2 pl-6 text-[11px] text-gray-400">
                <span>NIF: A36196418</span>
              </div>
            </div>
          </div>

          {/* Columna 2: Módulos del Gestor */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-4 pb-1 border-b border-gray-100">
              Módulos del Gestor
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/" className="hover:text-brand-red transition-colors flex items-center gap-1.5">
                  Dashboard general
                </Link>
              </li>
              <li>
                <Link to="/carpooling" className="hover:text-brand-red transition-colors flex items-center gap-1.5">
                  Viajes Compartidos (Carpooling)
                </Link>
              </li>
              <li>
                <Link to="/desks" className="hover:text-brand-red transition-colors flex items-center gap-1.5">
                  Reserva de Puestos y Ausencias
                </Link>
              </li>
              <li>
                <Link to="/gadgets" className="hover:text-brand-red transition-colors flex items-center gap-1.5">
                  Catálogo de Gadgets y Material
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Cumplimiento y Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-4 pb-1 border-b border-gray-100">
              Marco Legal y Privacidad
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/aviso-legal" className="hover:text-brand-red transition-colors">
                  Aviso Legal
                </Link>
              </li>
              <li>
                <Link to="/privacidad" className="hover:text-brand-red transition-colors">
                  Política de Privacidad (RGPD)
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-brand-red transition-colors">
                  Política de Cookies
                </Link>
              </li>
              <li className="pt-1">
                <button
                  type="button"
                  onClick={openCookieSettings}
                  className="text-xs font-semibold text-brand-red hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Preferencias de cookies</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Barra inferior */}
        <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>
            © {currentYear} <strong className="text-gray-600 font-semibold">EOSA (Estrategia y Organización, S.A.)</strong>. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-gray-400">
            <span>Portal interno para el equipo de EOSA</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
