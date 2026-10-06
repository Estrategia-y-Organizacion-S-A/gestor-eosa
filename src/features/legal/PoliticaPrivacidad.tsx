import { LegalPageContainer } from './LegalPageContainer';
import { 
  Shield, 
  Users, 
  UserCheck, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Lock, 
  Car, 
  Laptop, 
  MapPinCheckInside, 
  FileCheck, 
  AlertCircle 
} from 'lucide-react';

export function PoliticaPrivacidad() {
  return (
    <LegalPageContainer
      title="Política de Privacidad"
      subtitle="Información detallada sobre el tratamiento de datos personales de los usuarios en el portal corporativo Gestor EOSA, en cumplimiento del RGPD (UE 2016/679) y la LOPDGDD (LO 3/2018)."
      lastUpdated="Actualizado para Gestor EOSA - 2026"
    >
      {/* 1. Responsable del Tratamiento */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-red shrink-0" />
          <span>1. Responsable del Tratamiento de los Datos Personales</span>
        </h2>
        <p>
          El responsable del tratamiento determina los fines y medios del tratamiento de datos personales en el marco de la plataforma web corporativa <strong className="text-gray-900 font-semibold">Gestor EOSA</strong>.
        </p>
        <p>
          A los efectos de la presente política de protección de datos, el responsable legal es:
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-xs sm:text-sm space-y-2.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span className="font-bold text-gray-900 block">Identidad societaria:</span>
              <span>Estrategia y Organización S.A. (EOSA)</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 block">NIF:</span>
              <span className="font-mono font-bold text-brand-red">A36196418</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-900 block">Domicilio social y oficinas:</span>
                <span>Calle Doctor Cadaval, 5 – 1ºB (36201 Vigo, Pontevedra)</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-red shrink-0" />
              <div>
                <span className="font-bold text-gray-900 block">Teléfono de contacto:</span>
                <span>(+34) 986 419 922</span>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-200/80 flex items-center gap-2">
            <Mail className="w-4 h-4 text-brand-red shrink-0" />
            <div>
              <span className="font-bold text-gray-900">Correo electrónico de contacto y de protección de datos: </span>
              <a href="mailto:eosa@eosa.com" className="text-brand-red font-bold hover:underline ml-1">eosa@eosa.com</a>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 italic pt-1">
          Estrategia y Organización S.A. se compromete al cumplimiento estricto del principio de minimización de datos (Art. 5.1.c RGPD), tratando con confidencialidad y adecuadas medidas técnicas y organizativas únicamente aquellos datos que resultan indispensables para el funcionamiento operativo del portal.
        </p>
      </section>

      {/* 2. Categorías de Datos Tratados en Gestor EOSA */}
      <section className="space-y-4">
        <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-red shrink-0" />
          <span>2. Datos Tratados Específicamente en el Portal Gestor EOSA</span>
        </h2>

        <div className="space-y-3.5">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 space-y-3">
            <h3 className="font-bold text-gray-900 text-xs sm:text-sm text-brand-red uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              <span>A) ¿Qué tipo de datos personales tratamos en esta web?</span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              A diferencia de la gestión contractual general de Recursos Humanos de la empresa, este portal web está estrictamente acotado a la operativa y coordinación interna de recursos, tratando únicamente:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                <div className="flex items-center gap-2 text-gray-900 font-bold text-xs">
                  <Lock className="w-3.5 h-3.5 text-brand-red shrink-0" />
                  <span>Identificación y Acceso al Portal</span>
                </div>
                <ul className="list-disc pl-5 text-[11px] sm:text-xs text-gray-600 space-y-1">
                  <li>Nombre y apellidos del empleado.</li>
                  <li>Dirección de correo electrónico corporativo (<code className="font-mono text-brand-red">@eosa.com</code>).</li>
                  <li>Identificador único de usuario (UID) y credenciales cifradas gestionadas a través del servicio seguro de autenticación de Google Firebase.</li>
                  <li>Rol operativo dentro del portal (usuario o administrador).</li>
                  <li>Registro temporal de último acceso al sistema.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                <div className="flex items-center gap-2 text-gray-900 font-bold text-xs">
                  <MapPinCheckInside className="w-3.5 h-3.5 text-brand-red shrink-0" />
                  <span>Puestos de Trabajo y Asistencia</span>
                </div>
                <ul className="list-disc pl-5 text-[11px] sm:text-xs text-gray-600 space-y-1">
                  <li>Identificador de puesto o mesa asignada o reservada en el plano interactivo de la oficina.</li>
                  <li>Estado de asistencia seleccionado para la jornada: <em>Oficina, Teletrabajo, Vacaciones, Viaje o Cliente</em>.</li>
                  <li>Fechas de asistencia planificada y liberaciones temporales de puesto.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                <div className="flex items-center gap-2 text-gray-900 font-bold text-xs">
                  <Car className="w-3.5 h-3.5 text-brand-red shrink-0" />
                  <span>Movilidad Compartida (Carpooling)</span>
                </div>
                <ul className="list-disc pl-5 text-[11px] sm:text-xs text-gray-600 space-y-1">
                  <li>Datos de viajes publicados voluntariamente: nombre del conductor, origen, destino, fecha, hora prevista, plazas ofrecidas y comentarios o paradas intermedias.</li>
                  <li>Datos de reservas de plaza efectuadas por compañeros de equipo (identificación de pasajeros).</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                <div className="flex items-center gap-2 text-gray-900 font-bold text-xs">
                  <Laptop className="w-3.5 h-3.5 text-brand-red shrink-0" />
                  <span>Inventario de Gadgets y Material</span>
                </div>
                <ul className="list-disc pl-5 text-[11px] sm:text-xs text-gray-600 space-y-1">
                  <li>Dispositivo o periférico técnico solicitado (pantalla, ratón, teclado, adaptador, etc.).</li>
                  <li>Identificación del profesional solicitante, estado del préstamo y fechas de asignación y retorno.</li>
                </ul>
              </div>
            </div>

            {/* Aclaración explícita de datos no tratados */}
            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 text-xs space-y-1 mt-2">
              <div className="flex items-center gap-2 text-brand-red font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Datos personales NO tratados en Gestor EOSA</span>
              </div>
              <p className="text-gray-600 leading-relaxed text-[11px] sm:text-xs">
                Para garantizar la privacidad y el principio de minimización, la plataforma <strong className="text-gray-900">en ningún caso recopila ni procesa</strong>: números de DNI/NIE, cuentas bancarias, nóminas ni salarios, deducciones fiscales, domicilios particulares, teléfonos privados personales, datos de salud o bajas médicas, sexo, estado civil, nacionalidad, familiares a cargo ni firmas manuscritas.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 space-y-2">
            <h3 className="font-bold text-gray-900 text-xs sm:text-sm text-brand-red uppercase tracking-wider">
              B) ¿Con qué finalidades tratamos sus datos personales?
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-gray-600 leading-relaxed">
              <li><strong>Autenticación y seguridad:</strong> Permitir el inicio de sesión exclusivo y seguro a los profesionales autorizados de EOSA y proteger la plataforma ante accesos no autorizados mediante controles anti-bot.</li>
              <li><strong>Gestión del espacio físico y aforo:</strong> Facilitar la reserva y conocimiento transparente de los puestos ocupados y libres en la oficina para un uso eficiente del espacio de trabajo.</li>
              <li><strong>Coordinación operativa del equipo:</strong> Proporcionar visibilidad compartida sobre la disponibilidad y modalidad de jornada (oficina, teletrabajo, clientes o viajes) para mejorar la comunicación interna de los 44 integrantes de la empresa.</li>
              <li><strong>Movilidad sostenible corporativa:</strong> Facilitar la conexión voluntaria entre compañeros que realizan trayectos coincidentes para optimizar costes de transporte y reducir el impacto ambiental.</li>
              <li><strong>Control y trazabilidad de material:</strong> Garantizar el uso ordenado, custodia y disponibilidad de periféricos y recursos informáticos corporativos.</li>
            </ul>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pt-2">
              <strong>Plazo de conservación:</strong> Los datos operativos se conservarán mientras el usuario mantenga su relación laboral o colaboración activa con EOSA. Al producirse la baja en la empresa, el perfil de acceso se desactivará y los datos de ocupación futura se cancelarán, conservándose únicamente los registros históricos indispensables bloqueados durante los plazos legalmente exigibles.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 space-y-2">
            <h3 className="font-bold text-gray-900 text-xs sm:text-sm text-brand-red uppercase tracking-wider">
              C) ¿Cuál es la base legal (legitimación) para el tratamiento?
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-gray-600 leading-relaxed">
              <li>
                <strong>Interés legítimo empresarial (Art. 6.1.f RGPD):</strong> En la organización interna óptima del centro de trabajo, asignación equitativa de puestos, coordinación del equipo de trabajo y custodia de recursos informáticos de la empresa.
              </li>
              <li>
                <strong>Ejecución de la relación laboral y contractual (Art. 6.1.b RGPD):</strong> En la puesta a disposición de herramientas digitales de trabajo necesarias para el desarrollo de la actividad laboral.
              </li>
              <li>
                <strong>Consentimiento del interesado (Art. 6.1.a RGPD):</strong> Para la publicación y solicitud voluntaria de trayectos de carpooling entre compañeros, así como para la gestión de preferencias opcionales de cookies.
              </li>
            </ul>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 space-y-2">
            <h3 className="font-bold text-gray-900 text-xs sm:text-sm text-brand-red uppercase tracking-wider">
              D) ¿A qué destinatarios se comunicarán sus datos?
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Los datos no se cederán ni comercializarán a terceros ajenos a EOSA. Únicamente acceden a la información:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-gray-600 leading-relaxed">
              <li>
                <strong>Compañeros de trabajo y administradores de EOSA:</strong> En el marco de la propia funcionalidad colaborativa del portal (visualización interna de quién ocupa un puesto, quién ofrece o solicita un viaje y quién tiene asignado un gadget).
              </li>
              <li>
                <strong>Proveedores de servicios tecnológicos (Encargados del Tratamiento):</strong> Google Ireland Limited (Google Cloud Platform / Firebase) para el alojamiento de la base de datos y autenticación cifrada, y servicio Google reCAPTCHA v3 para la prevención de fraude informático.
              </li>
              <li>
                <strong>Obligación legal:</strong> A las autoridades judiciales o administrativas competentes únicamente en cumplimiento de mandatos legales de obligado acatamiento.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. Delimitación y Alcance del Gestor EOSA */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-red shrink-0" />
          <span>3. Delimitación y Alcance de esta Política de Privacidad</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          La presente política regula exclusivamente el tratamiento de datos vinculado al portal web interno <strong className="text-gray-900 font-semibold">Gestor EOSA</strong>.
        </p>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          Para conocer el tratamiento general de datos que <strong className="text-gray-900">Estrategia y Organización S.A.</strong> lleva a cabo en relación con clientes, proveedores comerciales, procesos de selección de personal o visitas al sitio web corporativo institucional externo, puede consultar la información correspondiente en <a href="https://www.eosa.com" target="_blank" rel="noopener noreferrer" className="text-brand-red font-semibold hover:underline">www.eosa.com</a> o solicitarla directamente a través de <a href="mailto:eosa@eosa.com" className="text-brand-red font-semibold hover:underline">eosa@eosa.com</a>.
        </p>
      </section>

      {/* 4. Derechos de los Interesados */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-brand-red shrink-0" />
          <span>4. ¿Cuáles son sus Derechos y cómo ejercitarlos?</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-600">
          De conformidad con el Reglamento General de Protección de Datos (RGPD) y la LOPDGDD, cualquier usuario de la plataforma puede ejercer de forma gratuita los siguientes derechos:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-xl border border-gray-200 bg-white">
            <span className="font-bold text-gray-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-red" /> Acceso
            </span>
            <p className="text-gray-500 mt-1">Conocer qué datos personales suyos están siendo tratados en el portal.</p>
          </div>
          <div className="p-3 rounded-xl border border-gray-200 bg-white">
            <span className="font-bold text-gray-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-red" /> Rectificación
            </span>
            <p className="text-gray-500 mt-1">Solicitar la corrección de datos inexactos, incompletos o desactualizados.</p>
          </div>
          <div className="p-3 rounded-xl border border-gray-200 bg-white">
            <span className="font-bold text-gray-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-red" /> Supresión
            </span>
            <p className="text-gray-500 mt-1">Solicitar la eliminación de sus datos cuando ya no sean necesarios para los fines previstos.</p>
          </div>
          <div className="p-3 rounded-xl border border-gray-200 bg-white">
            <span className="font-bold text-gray-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-red" /> Limitación del tratamiento
            </span>
            <p className="text-gray-500 mt-1">Solicitar la suspensión del tratamiento en los supuestos previstos por la normativa.</p>
          </div>
          <div className="p-3 rounded-xl border border-gray-200 bg-white">
            <span className="font-bold text-gray-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-red" /> Portabilidad
            </span>
            <p className="text-gray-500 mt-1">Recibir sus datos en un formato estructurado, interoperable y de lectura mecánica.</p>
          </div>
          <div className="p-3 rounded-xl border border-gray-200 bg-white">
            <span className="font-bold text-gray-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-red" /> Oposición
            </span>
            <p className="text-gray-500 mt-1">Oponerse al tratamiento de sus datos por motivos personales específicos.</p>
          </div>
        </div>

        {/* Vía de Ejercicio */}
        <div className="bg-rose-50/70 border border-rose-200 p-4 sm:p-5 rounded-2xl space-y-2 mt-4 text-xs sm:text-sm">
          <div className="font-bold text-gray-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-brand-red" />
            <span>Canales para ejercitar sus derechos</span>
          </div>
          <p className="text-gray-700 leading-relaxed">
            Puede ejercitar sus derechos enviando una solicitud por escrito, acompañada de un documento acreditativo de su identidad, a:
          </p>
          <ul className="list-disc pl-5 text-gray-700 font-semibold space-y-0.5">
            <li>Dirección postal: Estrategia y Organización S.A., Calle Doctor Cadaval, 5 – 1ºB (36201 Vigo, Pontevedra)</li>
            <li>Correo electrónico de privacidad: <a href="mailto:eosa@eosa.com" className="text-brand-red hover:underline">eosa@eosa.com</a></li>
          </ul>
          <p className="text-gray-600 pt-2 border-t border-rose-200/80 text-xs">
            Si considera que el tratamiento no se ajusta a la normativa vigente, tiene derecho a presentar una reclamación ante la <strong className="text-gray-900">Agencia Española de Protección de Datos (AEPD)</strong> a través de su sede electrónica (<a href="https://sedeagpd.gob.es" target="_blank" rel="noopener noreferrer" className="text-brand-red hover:underline">sedeagpd.gob.es</a>) o en C/ Jorge Juan, 6, 28001 Madrid.
          </p>
        </div>
      </section>
    </LegalPageContainer>
  );
}
