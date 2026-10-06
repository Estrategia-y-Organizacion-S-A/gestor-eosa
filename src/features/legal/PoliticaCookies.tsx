import { LegalPageContainer } from './LegalPageContainer';
import { openCookieSettings } from '../../utils/cookieEvents';
import { Cookie, Settings, CheckCircle2, ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';

export function PoliticaCookies() {
  return (
    <LegalPageContainer
      title="Política de Cookies"
      subtitle="Información sobre las cookies y tecnologías de almacenamiento local empleadas en el Gestor EOSA, de acuerdo con la directiva ePrivacy y el RGPD."
      lastUpdated="Actualizado para Gestor EOSA - 2026"
    >
      {/* 1. Introducción */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
          <Cookie className="w-5 h-5 text-brand-red shrink-0" />
          <span>1. Introducción y Alcance</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          Esta plataforma corporativa (<strong className="text-gray-900 font-semibold">Gestor EOSA</strong>) utiliza cookies y tecnologías de almacenamiento local en el navegador (como <code className="font-mono text-xs">localStorage</code>) para permitir el funcionamiento técnico seguro de la sesión de los usuarios, proteger los formularios de acceso frente a robots maliciosos y registrar sus preferencias.
        </p>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          En este documento le informamos con total transparencia sobre las tecnologías empleadas, su finalidad y cómo administrarlas o revocarlas.
        </p>
      </section>

      {/* 2. ¿Qué son las cookies, scripts y almacenamiento local? */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-red shrink-0" />
          <span>2. ¿Qué son las Cookies y el Almacenamiento Local?</span>
        </h2>
        <div className="space-y-2.5 text-xs sm:text-sm text-gray-600">
          <p>
            <strong>Cookies:</strong> Pequeños ficheros de información enviados por el servidor web y almacenados en su navegador que permiten recordar parámetros de la sesión o información técnica en visitas sucesivas.
          </p>
          <p>
            <strong>Almacenamiento Local (localStorage / IndexedDB):</strong> Mecanismo estándar de los navegadores web que permite guardar información en su propio dispositivo sin transmitirla de manera continuada en cada petición de red. En el Gestor EOSA se utiliza para mantener persistente el inicio de sesión y recordar su elección sobre las cookies.
          </p>
        </div>
      </section>

      {/* 3. Panel de Configuración Interactiva */}
      <section className="bg-rose-50/70 border border-rose-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-gray-900 text-sm">Panel de Configuración de Consentimiento</h3>
          <p className="text-xs text-gray-600 mt-0.5">
            Puede comprobar, modificar o revocar su consentimiento de cookies en cualquier momento desde esta propia página.
          </p>
        </div>
        <button
          type="button"
          onClick={openCookieSettings}
          className="inline-flex items-center gap-2 bg-brand-red hover:bg-[#a31b31] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-2xs shrink-0 cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          <span>Configurar Cookies</span>
        </button>
      </section>

      {/* 4. Tipos de Cookies */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
          3. Clasificación de Cookies en el Gestor EOSA
        </h2>
        
        <div className="space-y-3">
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <h3 className="font-bold text-gray-900 text-sm">Cookies Técnicas o Necesarias (Obligatorias)</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Son indispensables para que la aplicación funcione y garantice la seguridad de las cuentas de usuario. Permiten mantener abierta la sesión autenticada con Google Firebase y evaluar la seguridad del acceso para prevenir ciberataques y bots automáticos mediante Google reCAPTCHA v3. Están exentas del consentimiento previo conforme al artículo 22.2 de la LSSI-CE.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <h3 className="font-bold text-gray-900 text-sm">Cookies de Estadísticas y Rendimiento (Opcionales)</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Permiten recopilar métricas técnicas anónimas y agregadas sobre el rendimiento de las peticiones en el portal (como velocidad de carga de las reservas o disponibilidad de la infraestructura). Solo se activan si el usuario otorga voluntariamente su consentimiento.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Inventario de Cookies */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
          4. Inventario Detallado de Cookies y Almacenamiento Local
        </h2>
        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Identificador</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">Finalidad</th>
                  <th className="py-3 px-4">Tipo / Caducidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-gray-900">firebase:authUser:*</td>
                  <td className="py-3 px-4">Google / Firebase</td>
                  <td className="py-3 px-4 text-gray-600">Mantener la sesión de usuario autenticada de forma segura</td>
                  <td className="py-3 px-4 text-gray-500">Persistente (hasta cerrar sesión)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-gray-900">_GRECAPTCHA</td>
                  <td className="py-3 px-4">Google reCAPTCHA v3</td>
                  <td className="py-3 px-4 text-gray-600">Prevención de accesos fraudulentos y seguridad del formulario</td>
                  <td className="py-3 px-4 text-gray-500">6 meses</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-gray-900">eosa_cookies_consent</td>
                  <td className="py-3 px-4">EOSA (Propia)</td>
                  <td className="py-3 px-4 text-gray-600">Almacenar la selección de consentimiento del usuario</td>
                  <td className="py-3 px-4 text-gray-500">1 año</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 6. Activación, Desactivación y Eliminación */}
      <section className="space-y-3 text-xs sm:text-sm">
        <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
          5. Gestión y Eliminación de Cookies desde el Navegador
        </h2>
        <p className="text-gray-600 leading-relaxed">
          Además de nuestro panel de configuración, puede en cualquier momento bloquear, permitir o eliminar las cookies instaladas en su equipo mediante la configuración de las opciones de su navegador:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-gray-600 text-xs">
          <li><strong>Google Chrome:</strong> Configuración &gt; Privacidad y seguridad &gt; Cookies de terceros.</li>
          <li><strong>Mozilla Firefox:</strong> Opciones &gt; Privacidad &amp; Seguridad &gt; Cookies y datos del sitio.</li>
          <li><strong>Microsoft Edge:</strong> Configuración &gt; Cookies y permisos del sitio.</li>
          <li><strong>Apple Safari:</strong> Preferencias &gt; Privacidad &gt; Gestionar datos de sitios web.</li>
        </ul>
      </section>

      {/* 7. Datos de Contacto */}
      <section className="space-y-3 text-xs sm:text-sm">
        <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
          6. Datos de Contacto del Responsable
        </h2>
        <p className="text-gray-600">
          Para cualquier consulta relativa a la presente política de cookies o a la privacidad en el Gestor EOSA, puede contactar con nosotros en:
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
          <p><strong className="text-gray-900">Estrategia y Organización S.A. (EOSA)</strong></p>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4 text-brand-red shrink-0" />
            <span>Calle Doctor Cadaval, 5 – 1ºB (36201 Vigo, Pontevedra), España</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4 text-brand-red shrink-0" />
            <span>Teléfono: (+34) 986 419 922</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-4 h-4 text-brand-red shrink-0" />
            <span>Correo electrónico: <a href="mailto:eosa@eosa.com" className="text-brand-red font-semibold hover:underline">eosa@eosa.com</a></span>
          </div>
          <p className="text-[11px] text-gray-400 pt-1">Sitio web institucional: <a href="https://www.eosa.com" target="_blank" rel="noopener noreferrer" className="text-brand-red hover:underline">https://www.eosa.com</a></p>
        </div>
      </section>
    </LegalPageContainer>
  );
}
