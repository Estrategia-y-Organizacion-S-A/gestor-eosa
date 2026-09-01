# 🏢 Gestor Empresarial

Plataforma integral para la gestión interna de recursos y logística en EOSA. Desarrollada para facilitar el día a día de los empleados, permitiendo compartir coche, reservar mesas en la oficina y gestionar el préstamo de material (gadgets).

## ✨ Funcionalidades Principales

### 🚗 Viajes (Carpooling)
Sistema para compartir gastos y reducir la huella de carbono al venir a la oficina.
- **Publicar Viajes:** Los conductores pueden ofrecer sus asientos disponibles indicando origen, destino, fecha y hora.
- **Reservar Asientos:** Los compañeros pueden apuntarse a los viajes publicados de forma sencilla.
- **Notificaciones en Tiempo Real:** El sistema avisa al instante al conductor cuando alguien reserva un asiento en su coche mediante una campana de alertas en la cabecera.

### 📅 Mesas (Hot Desking & Salas)
Plano interactivo de la oficina para organizar el trabajo presencial.
- **Reserva de Puestos:** Visualiza el plano en vista 2D y reserva tu mesa para un día en concreto.
- **Sala de Reuniones:** Gestión unificada de la sala principal para evitar conflictos de horarios.
- **Mesa de Entrada:** Puestos rotativos para tareas específicas o visitas temporales.

### 🔧 Gadgets (Inventario)
Catálogo digital para el préstamo de material de la empresa.
- **Categorías:** Pantallas, Periféricos, Audiovisual y Cables.
- **Préstamos y Devoluciones:** Llévate un monitor a casa o un proyector a una reunión. El sistema registra quién tiene cada dispositivo para evitar pérdidas.
- **Mochila Virtual:** Desde la pestaña 'Mis Préstamos', los usuarios pueden ver el material que tienen actualmente y devolverlo con un clic.

### 🛡️ Perfil y Panel de Administración
- **Gestión de Perfil:** Personaliza tu nombre, correo y contraseña. Configura qué notificaciones deseas recibir.
- **Panel Modo Dios (Admins):** Los administradores pueden acceder a una sección exclusiva para auditar a los usuarios registrados, conceder o quitar permisos de administración y suspender cuentas temporalmente.

## 🛠️ Tecnologías Utilizadas

- **Frontend:** React 18, TypeScript, Vite
- **Estilos:** Tailwind CSS v4, Lucide React (Iconos), clsx
- **Base de Datos & Auth:** Firebase Firestore (Reglas de Seguridad blindadas) y Firebase Authentication
- **Enrutamiento:** React Router DOM

## 🚀 Instalación y Uso

1. Clona el repositorio.
2. Instala las dependencias necesarias:
   ```bash
   npm install
   ```
3. Configura tus variables de entorno creando un archivo `.env` en la raíz con las claves de tu proyecto de Firebase.
4. Para levantar el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```
5. Para compilar la versión optimizada de producción:
   ```bash
   npm run build
   ```

---
*Realizado por Lara Loveira Nores :)*
