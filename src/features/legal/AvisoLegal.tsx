import { LegalPageContainer } from './LegalPageContainer';
import { Building2, FileText, Lock, AlertTriangle, ShieldCheck, Phone, Mail } from 'lucide-react';

export function AvisoLegal() {
  return (
    <LegalPageContainer
      title="Aviso Legal"
      subtitle="Información legal, titularidad societaria y condiciones generales de uso del portal corporativo Gestor EOSA."
      lastUpdated="Actualizado para Gestor EOSA - 2026"
    >
      {/* 1. Información sobre el titular del sitio web */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-brand-red shrink-0" />
          <span>1. Información sobre el Titular del Sitio Web y la Plataforma</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-600">
          En cumplimiento con el deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE), se informa que este sitio web y el portal corporativo <strong className="text-gray-900 font-semibold">Gestor EOSA</strong> son titularidad de:
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-xs sm:text-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span className="font-bold text-gray-900 block">Razón social:</span>
              <span>Estrategia y Organización S.A. (EOSA)</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 block">NIF:</span>
              <span className="font-mono font-bold text-brand-red">A36196418</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 block">Domicilio social y oficinas:</span>
              <span>Calle Doctor Cadaval, 5 – 1ºB (36201 Vigo, Pontevedra)</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 block">Inscripción registral:</span>
              <span>Registro Mercantil de Pontevedra en el libro 1340 de la Sección de Sociedades, folio 71, hoja PO-10.289, Inscripción 1.ª</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-red shrink-0" />
              <div>
                <span className="font-bold text-gray-900 block">Teléfono de contacto:</span>
                <span>(+34) 986 419 922</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-brand-red shrink-0" />
              <div>
                <span className="font-bold text-gray-900 block">Correo electrónico de contacto:</span>
                <a href="mailto:eosa@eosa.com" className="text-brand-red font-semibold hover:underline">eosa@eosa.com</a>
              </div>
            </div>
          </div>
          <div className="pt-2.5 border-t border-gray-200/80 text-gray-500 text-xs leading-relaxed">
            Estrategia y Organización S.A. es una consultora estratégica e innovadora con más de 30 años de experiencia aportando soluciones eficientes a administraciones públicas y empresas en el ámbito nacional e internacional.
          </div>
        </div>
      </section>

      {/* 2. Objeto de la Plataforma y Destinatarios */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-red shrink-0" />
          <span>2. Objeto del Portal Gestor EOSA</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-600">
          El presente portal web corporativo (<strong className="text-gray-900 font-semibold">Gestor EOSA</strong>) tiene por objeto facilitar al equipo de profesionales, empleados y colaboradores autorizados de EOSA una plataforma unificada para la gestión interna y colaborativa de sus recursos de trabajo diarios:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-gray-600">
          <li><strong>Organización de puestos y asistencia a la oficina:</strong> Planificación de asistencia en las instalaciones de la empresa, teletrabajo, vacaciones, viajes y visitas a clientes.</li>
          <li><strong>Movilidad corporativa compartida (Carpooling):</strong> Coordinación voluntaria de desplazamientos compartidos entre compañeros para optimizar rutas, reducir emisiones y fomentar la sostenibilidad.</li>
          <li><strong>Gestión de equipamiento y gadgets:</strong> Solicitud y préstamo ordenado de dispositivos periféricos y material técnico corporativo.</li>
        </ul>
      </section>

      {/* 3. Condiciones de Acceso y Utilización */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
          <Lock className="w-5 h-5 text-brand-red shrink-0" />
          <span>3. Condiciones de Acceso y Utilización del Sitio Web</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-600">
          El acceso a este portal es de carácter interno y restringido, requiriendo la posesión de una cuenta corporativa oficial autorizada bajo el dominio <code className="bg-rose-50 text-brand-red font-mono px-1.5 py-0.5 rounded font-bold text-xs">@eosa.com</code>.
        </p>
        <p className="text-xs sm:text-sm text-gray-600">
          El usuario se compromete a no utilizar la plataforma ni la información ofrecida para la realización de actividades contrarias a la Ley, la moral o el orden público, y a respetar en todo momento las directrices de seguridad de la información y uso de herramientas tecnológicas de EOSA.
        </p>
        <p className="text-xs sm:text-sm text-gray-600">
          El usuario se compromete expresamente a custodiar con total confidencialidad sus credenciales de acceso, siendo de su exclusiva responsabilidad el uso que de ellas se haga. EOSA no será responsable por ningún perjuicio derivado de la custodia negligente o cesión indebida de contraseñas por parte del usuario.
        </p>
      </section>

      {/* 4. Derechos de Propiedad Intelectual */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-red shrink-0" />
          <span>4. Derechos de Propiedad Intelectual e Industrial</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-600">
          El usuario se obliga a respetar los derechos de propiedad intelectual e industrial de la organización. El uso o la concesión de acceso a este Sitio Web no comporta el otorgamiento de derecho alguno sobre las marcas, nombres comerciales o signos distintivos de EOSA.
        </p>
        <p className="text-xs sm:text-sm text-gray-600">
          Los diseños, interfaces, mapas interactivos, código fuente, logotipos y demás creaciones que componen el Gestor EOSA son titularidad exclusiva de <strong className="text-gray-900 font-semibold">Estrategia y Organización S.A.</strong> Queda expresamente prohibida la reproducción, distribución, cesión o transformación de cualquier contenido sin autorización expresa y previa por escrito.
        </p>
      </section>

      {/* 5. Exención y Limitación de Responsabilidad */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-brand-red shrink-0" />
          <span>5. Exención y Limitación de Responsabilidad</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-600">
          EOSA no se hace responsable de posibles perjuicios derivados de:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-gray-600">
          <li>Interrupciones o incidencias temporales en el suministro eléctrico o en la red de comunicaciones ajenas a su control.</li>
          <li>Labores periódicas o inaplazables de mantenimiento técnico, actualización o seguridad de la plataforma.</li>
          <li>Cualquier contingencia o eventualidad acontecida durante los trayectos privados de carpooling acordados voluntariamente entre los empleados usuarios de los vehículos.</li>
        </ul>
      </section>

      {/* 6. Legislación Aplicable y Jurisdicción */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
          6. Legislación Aplicable y Jurisdicción
        </h2>
        <p className="text-xs sm:text-sm text-gray-600">
          Las presentes condiciones de uso del portal se rigen en todos sus extremos por la legislación española vigente.
        </p>
        <p className="text-xs sm:text-sm text-gray-600">
          Para la resolución de cualquier controversia o litigio que pudiera derivarse de la utilización de esta plataforma interna, las partes se someten expresamente a los <strong className="text-gray-900 font-semibold">Juzgados y Tribunales de Vigo (Pontevedra)</strong>, con renuncia a cualquier otro fuero que pudiera corresponderles.
        </p>
        <p className="text-xs text-gray-500 pt-1">
          Para cualquier consulta o notificación relativa a las condiciones de uso de esta plataforma corporativa, puede contactar a través del correo <a href="mailto:eosa@eosa.com" className="text-brand-red font-semibold hover:underline">eosa@eosa.com</a> o por correo postal a la sede social de EOSA en Vigo.
        </p>
      </section>
    </LegalPageContainer>
  );
}
