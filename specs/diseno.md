# SIGEM MaintPRO — Diseño técnico

## 1. Arquitectura (desacoplada)

| Capa | Tecnología | Dirección |
|------|------------|-----------|
| Frontend | React + TypeScript (Vite) | `http://localhost:5173` |
| Backend | Node.js + Express (API REST) | `http://localhost:3000` |
| Base de datos | MySQL (XAMPP), base `sigem` | — |
| Seguridad | JWT y bcrypt para autenticación y claves | — |
| Control de versiones | GitHub (GitFlow: `main`, `develop`, `feature/*`, `hotfix/*`) | — |

**Flujo:** Pantalla → petición HTTP → API Express → MySQL

## 2. Estructura del proyecto

```text
GERENCIA/
  sigem-backend/
    src/server.js
    src/db.js                  Conexión a MySQL y registro de auditoría
    src/middleware/auth.js     Verifica el token JWT y el rol (RBAC)
    src/routes/auth.js
    src/routes/equipos.js
    src/routes/mantenimientos.js
    src/routes/dashboard.js
    src/migrar.js              Agrega estado y fecha_real a mantenimientos
    schema.sql                 Crea la BD y las tablas
    src/seed.js                Carga los usuarios de demostración
    src/seed-demo.js           Carga equipos y órdenes DE DEMOSTRACIÓN (opcional)
  sigem-frontend/
    src/api.ts                     Cliente HTTP y manejo de la sesión
    src/components/Layout.tsx      Menú lateral y encabezado (según el rol)
    src/pages/Login.tsx            -> RF-02, RF-03
    src/pages/Dashboard.tsx        -> RF-12
    src/pages/Equipos.tsx          -> RF-04, RF-05
    src/pages/Mantenimientos.tsx   -> RF-06, RF-07, RF-08
    src/pages/Fallas.tsx           -> RF-09
  specs/                       Archivos del SDD
```

## 3. Base de datos (`schema.sql`)

| Tabla | Columnas |
|-------|----------|
| `usuarios` | id, nombre, email, password_hash, rol, creado_en |
| `equipos` | id, nombre, tipo, ubicacion, estado, responsable_id, proximo_mantenimiento, creado_en |
| `mantenimientos` | id, equipo_id, tecnico_id, tipo, estado, fecha, fecha_real, descripcion, costo, proximo_mantenimiento, creado_en |
| `fallas` | id, equipo_id, descripcion, fecha, reportada_por |
| `auditoria` | id, usuario_id, accion, tabla, registro_id, fecha |

- Los valores de `rol` son `administrador`, `tecnico` y `responsable`.
- Estados de un mantenimiento: `programado`, `en_proceso`, `completado`.
- `src/migrar.js` no crea la base ni las tablas: agrega `estado` y `fecha_real` a `mantenimientos` si faltan. El `schema.sql` actual ya incluye ambas columnas; `migrar.js` solo hace falta si la base se creó con una versión anterior de `schema.sql` (si ya está al día, lo informa y no cambia nada).
- `src/seed.js` carga las cuentas de demostración (admin, técnico y responsable). `src/seed-demo.js` es opcional y carga datos de **demostración** (equipos y órdenes de ejemplo), que no representan datos reales.

## 4. Rutas implementadas (API REST)

### Autenticación y usuarios

| Método | Ruta | Acceso | RF |
|--------|------|--------|----|
| POST | `/api/auth/login` | Público (body: `email`, `password`) | RF-02 |
| POST | `/api/auth/register` | Administrador autenticado | RF-01 |
| GET | `/api/auth/tecnicos` | Administrador autenticado | RF-13 |

### Equipos

Rutas protegidas; `POST` y `PUT` requieren administrador o técnico.

| Método | Ruta | Acceso / notas | RF |
|--------|------|----------------|----|
| GET | `/api/equipos` | Filtros: `estado`, `ubicacion`, `tipo`, `vence_antes`. Cada equipo incluye `costo_acumulado` (solo órdenes completadas) | RF-05 |
| POST | `/api/equipos` | Administrador o técnico | RF-04 |
| GET | `/api/equipos/:id` | Autenticado | — |
| PUT | `/api/equipos/:id` | Administrador o técnico | RF-04 |
| DELETE | `/api/equipos/:id` | Administrador | RF-04 |
| GET | `/api/equipos/:id/historial` | Autenticado | RF-06 |
| GET | `/api/equipos/:id/costos` | Solo órdenes completadas | RF-10 |

### Mantenimientos

Rutas protegidas.

| Método | Ruta | Acceso / notas | RF |
|--------|------|----------------|----|
| GET | `/api/mantenimientos` | Autenticado | — |
| GET | `/api/mantenimientos/tecnicos` | Autenticado | — |
| GET | `/api/mantenimientos/alertas` | Autenticado | RF-08 |
| POST | `/api/mantenimientos` | Administrador o técnico | RF-07, RF-08 |
| PUT | `/api/mantenimientos/:id` | Administrador o técnico | — |
| PATCH | `/api/mantenimientos/:id/estado` | Administrador o técnico; avanza programado → en_proceso → completado | — |
| GET | `/api/mantenimientos/fallas` | Autenticado; lista todas las fallas con el equipo y quien la reportó | RF-09 |
| POST | `/api/mantenimientos/fallas` | Administrador o técnico; no cambia el estado del equipo | RF-09 |
| GET | `/api/mantenimientos/fallas/:equipoId` | Autenticado | — |

### Dashboard y disponibilidad

| Método | Ruta | Acceso | RF |
|--------|------|--------|----|
| GET | `/api/dashboard` | Autenticado; lo ven todos los roles | RF-12 |
| GET | `/api/health` | Público (comprobación de disponibilidad) | — |

### Notas

- No hay actualmente rutas implementadas para recuperación de contraseña (RF-03) ni reportes (RF-11).
- `Login.tsx` usa `src/api.ts`, con base `http://localhost:3000/api`; Vite sirve el frontend en el origen `http://localhost:5173`.
- CORS permite solo los orígenes `http://localhost:5173` y `http://127.0.0.1:5173` (el frontend en Vite); cualquier otro origen es rechazado por el navegador.

Códigos de respuesta usados:

| Código | Uso |
|--------|-----|
| 200 | Consulta o actualización correcta |
| 201 | Registro creado |
| 400 | Datos inválidos |
| 401 | Sin token, token inválido o vencido, o credenciales incorrectas |
| 403 | Rol sin permiso |
| 404 | No encontrado |
| 500 | Error interno |

## 5. Pantallas

- Login
- Dashboard de indicadores
- Gestión de mantenimientos
- Inventario de equipos y activos
- Registro de fallas

Menú según el rol (`Layout.tsx`):

- **Administrador:** Dashboard, Inventario, Mantenimientos y Registro de Fallas
Técnico: Dashboard, Inventario, Mantenimientos y Registro de Fallas
- **Responsable:** Dashboard e Inventario

El menú de Fallas coincide con la API: solo el administrador y el técnico ven la pantalla y pueden registrar fallas (el responsable recibiría 403).

## 6. Matriz RF → componente

| RF | Requisito | Componente |
|----|-----------|------------|
| RF-01 | Registro de usuarios | API (`POST /api/auth/register`); sin pantalla |
| RF-02 | Inicio de sesión | Login (pantalla + API) |
| RF-03 | Recuperación de contraseña | Login: solo el enlace "¿Olvidó su clave?", que informa "en desarrollo"; sin API |
| RF-04 | Registro de equipos | Equipos (pantalla + API) |
| RF-05 | Consulta de equipos | Equipos (pantalla + API) |
| RF-06 | Historial de mantenimiento | API (`/api/equipos/:id/historial`) y la lista general de Mantenimientos; falta la vista de historial por equipo |
| RF-07 | Registro de mantenimientos | Mantenimientos (programar y avanzar estado) |
| RF-08 | Programación y alertas | Mantenimientos (programar); alertas visuales en Equipos y Dashboard; API `/alertas` |
| RF-09 | Registro de fallas | Fallas (pantalla + API: `POST` y `GET /api/mantenimientos/fallas`); no cambia el estado del equipo |
| RF-10 | Costos de reparación | Equipos (columna Costo reparaciones) y Dashboard (gasto acumulado) |
| RF-11 | Reportes | Exportación básica: CSV desde Inventario y Mantenimientos, PDF con la impresión del navegador; reportes formales pendientes |
| RF-12 | Dashboard | Dashboard (pantalla + API) |
| RF-13 | Gestión de técnicos | API (registro y listado de técnicos); sin pantalla ni edición |
| RF-14 | Auditoría | Backend (tabla `auditoria`); sin pantalla |
