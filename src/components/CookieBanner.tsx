import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, Check } from 'lucide-react';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  useEffect(() => {
    const consent = localStorage.getItem('eosa_cookies_consent');
    if (!consent) {
      // Pequeño retardo para no interferir en la carga inicial
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Escuchar evento personalizado para reabrir el configurador desde el Footer
  useEffect(() => {
    const handleReopen = () => {
      setShowConfig(true);
      setIsVisible(true);
    };
    window.addEventListener('eosa-open-cookie-settings', handleReopen);
    return () => window.removeEventListener('eosa-open-cookie-settings', handleReopen);
  }, []);

  const acceptAll = () => {
    localStorage.setItem('eosa_cookies_consent', JSON.stringify({
      necessary: true,
      analytics: true,
      date: new Date().toISOString()
    }));
    setIsVisible(false);
    setShowConfig(false);
  };

  const acceptNecessary = () => {
    localStorage.setItem('eosa_cookies_consent', JSON.stringify({
      necessary: true,
      analytics: false,
      date: new Date().toISOString()
    }));
    setIsVisible(false);
    setShowConfig(false);
  };

  const saveCustom = () => {
    localStorage.setItem('eosa_cookies_consent', JSON.stringify({
      necessary: true,
      analytics: analyticsEnabled,
      date: new Date().toISOString()
    }));
    setIsVisible(false);
    setShowConfig(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-xl z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-200/90 text-gray-900 relative overflow-hidden">
        
        {/* Acento rojo superior EOSA */}
        <div className="absolute top-0 inset-x-0 h-1 bg-brand-red pointer-events-none" />

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-brand-red flex items-center justify-center shrink-0 border border-rose-200/70 shadow-2xs">
            <Cookie className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight">
                Gestión de Cookies en EOSA
              </h3>
              <button 
                onClick={acceptNecessary}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                title="Cerrar (solo necesarias)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Utilizamos cookies técnicas necesarias para el funcionamiento del portal corporativo y de seguridad (reCAPTCHA, autenticación), así como cookies de rendimiento para optimizar tu experiencia interna. Consulta nuestra{' '}
              <Link to="/cookies" className="text-brand-red font-bold hover:underline">
                Política de Cookies
              </Link>.
            </p>

            {/* Modal de configuración expandible */}
            {showConfig && (
              <div className="mt-4 pt-3.5 border-t border-gray-100 space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200/80">
                  <div className="pr-2">
                    <span className="font-bold text-gray-900 block">Cookies Técnicas (Esenciales)</span>
                    <span className="text-[11px] text-gray-500">Imprescindibles para iniciar sesión, seguridad y navegación.</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                    Obligatorias
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200/80">
                  <div className="pr-2">
                    <span className="font-bold text-gray-900 block">Cookies de Análisis y Rendimiento</span>
                    <span className="text-[11px] text-gray-500">Métricas agregadas sobre el uso de recursos y viajes compartidos.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={analyticsEnabled}
                    onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                    className="w-4 h-4 text-brand-red rounded border-gray-300 focus:ring-brand-red cursor-pointer shrink-0"
                  />
                </div>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="mt-4 flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={acceptAll}
                className="flex-1 min-w-[130px] bg-brand-red hover:bg-[#a31b31] text-white text-xs font-bold py-2.5 px-3.5 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aceptar todas</span>
              </button>

              <button
                type="button"
                onClick={acceptNecessary}
                className="flex-1 min-w-[130px] bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold py-2.5 px-3.5 rounded-xl transition-all shadow-2xs cursor-pointer text-center"
              >
                Solo necesarias
              </button>

              <button
                type="button"
                onClick={() => {
                  if (showConfig) {
                    saveCustom();
                  } else {
                    setShowConfig(true);
                  }
                }}
                className="text-xs text-gray-500 hover:text-gray-900 font-semibold px-2 py-2 hover:underline cursor-pointer"
              >
                {showConfig ? 'Guardar selección' : 'Configurar'}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
