
# SIGEM MaintPRO — Backend

API REST para el Sistema de Gestión y Control del Mantenimiento de Equipos (SIGEM MaintPRO).

Desarrollado con Node.js, Express y MySQL.

## 1. Requisitos

Para ejecutar el backend se necesita:

- Node.js 20 o superior.
- npm.
- MySQL (por ejemplo, mediante XAMPP).
- Visual Studio Code u otro editor.
- El frontend de SIGEM MaintPRO.

## 2. Instalación

### Paso 1. Instalar dependencias

Desde la carpeta `sigem-backend`, ejecutar:

```bash
npm install
```

### Paso 2. Configurar variables de entorno

Copiar `.env.example` y crear un archivo llamado `.env`.

Configurar las credenciales correspondientes a MySQL y las variables necesarias para la autenticación.

Para RF-03, configurar también:

```env
FRONTEND_URL=http://localhost:5173

SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=USUARIO_DE_PRUEBA
SMTP_PASS=CLAVE_DE_PRUEBA
```

Ethereal Email permite probar el envío de correos sin entregarlos a bandejas reales.

**Importante:** No subir el archivo `.env` a GitHub ni compartir contraseñas o tokens.

### Paso 3. Preparar la base de datos

Iniciar MySQL e importar el archivo:

```text
schema.sql
```

Después ejecutar:

```bash
npm run migrar
```

Este comando:

1. Verifica las columnas necesarias para los mantenimientos.
2. Crea la tabla `recuperacion_password` si no existe.

### Paso 4. Crear los usuarios iniciales

Ejecutar:

```bash
npm run seed
```

Este comando crea los usuarios iniciales configurados en el proyecto.

En el entorno de demostración se utiliza:

- Correo: `admin@sigem.com`
- Contraseña inicial: `Admin12345`

Se recomienda cambiar la contraseña inicial antes de utilizar el sistema fuera del entorno de pruebas.

### Paso 5. Iniciar el backend

Ejecutar:

```bash
npm run dev
```

Servidor de desarrollo:

```text
http://localhost:3000
```

Comprobar funcionamiento:

```text
GET http://localhost:3000/api/health
```

Respuesta esperada:

```json
{
  "ok": true
}
```

## 3. Frontend

El frontend es una aplicación React con TypeScript y Vite.

Repositorio:

https://github.com/jesus0612-iu/sigem-frontend

Desde la carpeta `sigem-frontend`, ejecutar:

```bash
npm install
npm run dev
```

Abrir:

```text
http://localhost:5173
```

El backend debe estar en ejecución para utilizar las funcionalidades del sistema.

## 4. Funcionalidades principales

- Inicio de sesión mediante JWT (RF-02).
- Recuperación de contraseña por correo electrónico (RF-03).
- Registro, consulta, edición y eliminación de equipos (RF-04).
- Consulta y filtrado del inventario (RF-05).
- Historial de mantenimientos (RF-06).
- Registro y programación de mantenimientos (RF-07).
- Alertas de mantenimiento (RF-08).
- Registro de fallas (RF-09).
- Costo acumulado de mantenimientos completados (RF-10).
- Dashboard de indicadores.
- Control de acceso basado en roles (RNF-01).

## 5. Recuperación de contraseña (RF-03)

El usuario puede solicitar un enlace de recuperación desde la pantalla de inicio de sesión.

El proceso es el siguiente:

1. Ingresar el correo electrónico.
2. Solicitar la recuperación.
3. Consultar el correo de prueba en Ethereal Email.
4. Abrir el enlace temporal.
5. Establecer una contraseña nueva.
6. Iniciar sesión con la nueva contraseña.

Rutas de la API:

```text
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

La recuperación fue probada correctamente en el entorno de desarrollo utilizando Ethereal Email.

Para utilizarla en producción es necesario configurar un servicio SMTP real y revisar los controles de seguridad.

## 6. Pruebas de API

Los siguientes casos están documentados en `specs/pruebas.md`:

| Caso | Descripción | Resultado |
|------|-------------|-----------|
| CP-01 | Inicio de sesión correcto | Aprobado |
| CP-02 | Inicio de sesión incorrecto | Aprobado |
| CP-03 | Registro de equipos | Aprobado |
| CP-04 | Registro de mantenimientos | Aprobado |
| CP-05 | Costo acumulado | Aprobado |
| CP-06 | Control de acceso por roles | Aprobado |
| CP-07 | Registro de fallas | Aprobado |
| CP-08 | Recuperación de contraseña | Aprobado en desarrollo |

Se utilizaron pruebas manuales desde el navegador, Chrome DevTools y PowerShell.

## 7. Seguridad

El sistema implementa:

- Autenticación mediante JWT.
- Contraseñas almacenadas mediante bcrypt.
- Autorización basada en roles.
- Restricción de rutas protegidas.
- Tokens temporales para recuperar contraseñas.
- Variables de entorno para credenciales.

Antes de desplegar el sistema en producción se deben configurar secretos seguros, un proveedor de correo real y controles adicionales de seguridad.

## 8. Documentación

Los documentos del proyecto se encuentran en la carpeta `specs`:

- `requisitos.md`
- `diseno.md`
- `pruebas.md`
- `tareas.md`

## 9. Repositorios

Backend:

https://github.com/jesus0612-iu/sigem-backend

Frontend:

https://github.com/jesus0612-iu/sigem-frontend

## 10. Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `npm install` | Instala las dependencias |
| `npm run dev` | Inicia el backend en modo desarrollo |
| `npm start` | Inicia el backend |
| `npm run seed` | Crea los usuarios iniciales |
| `npm run seed:demo` | Ejecuta la carga de datos de demostración |
| `npm run migrar` | Ejecuta las migraciones |
| `npm run migrar:recuperacion` | Verifica la tabla de recuperación |

## 11. Flujo Git

El proyecto utiliza Git y GitHub para el control de versiones.

Durante el desarrollo se trabajó con ramas, commits y solicitudes de integración.

La rama principal `main` contiene la versión integrada del proyecto.
