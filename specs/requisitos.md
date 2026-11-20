# SIGEM MaintPRO — Requisitos

Sistema web para la gestión y control del mantenimiento de equipos.
UNIPAZ · Gerencia de Proyectos Informáticos · 2026

> Fuente: documento `GERENCIA_DE_PROYECTOS.docx` (sección 1.7). Las secciones 1 a 5 copian el documento sin cambios; la sección 6 aclara lo que cubre hoy el sistema.

## 1. Objetivo

Centralizar y optimizar la gestión y el control del mantenimiento de equipos: registro, consulta y seguimiento de mantenimientos, fallas, responsables, costos y fechas de próximos mantenimientos.

## 2. Actores

- Administrador
- Técnico
- Responsable de equipo

## 3. Requisitos funcionales

| ID | Nombre | Prioridad | Actor(es) | Descripción |
|----|--------|-----------|-----------|-------------|
| RF-01 | Registro de usuarios | Alta | Administrador | Crear cuentas con roles (administrador, técnico, responsable), validando datos y enviando confirmación por correo. |
| RF-02 | Inicio de sesión | Alta | Todos | Autenticar con credenciales únicas, control de sesiones activas y cierre automático por inactividad. |
| RF-03 | Recuperación de contraseña | Media | Todos | Restablecer la contraseña mediante verificación por correo. |
| RF-04 | Registro de equipos | Alta | Administrador, Técnico | Registrar, editar, consultar y eliminar equipos (nombre, tipo, ubicación, estado, responsable). |
| RF-05 | Consulta de equipos | Alta | Administrador, Técnico | Listar y filtrar por estado, ubicación, tipo o fecha de próximo mantenimiento. |
| RF-06 | Historial de mantenimiento | Alta | Administrador, Técnico | Mostrar el historial completo de mantenimientos de un equipo. |
| RF-07 | Registro de mantenimientos | Alta | Técnico | Registrar mantenimientos preventivos o correctivos (fecha, técnico, descripción, costo, equipo asociado). |
| RF-08 | Programación y alertas | Alta | Administrador, Técnico | Programar el próximo mantenimiento y notificar cuando esté próximo o vencido. |
| RF-09 | Registro de fallas | Media | Técnico | Registrar los problemas o fallas presentadas por un equipo. |
| RF-10 | Costos de reparación | Media | Administrador | Calcular y mostrar el costo acumulado de reparaciones por equipo. |
| RF-11 | Generación de reportes | Alta | Administrador | Generar y exportar reportes de mantenimientos y costos por equipo, técnico o periodo, en PDF y Excel. |
| RF-12 | Dashboard de indicadores | Media | Administrador | Panel con equipos con mantenimiento pendiente, gasto total y mantenimientos del mes. |
| RF-13 | Gestión de técnicos | Media | Administrador | Registrar, editar y asignar técnicos a los mantenimientos. |
| RF-14 | Auditoría de cambios | Media | Administrador | Log de auditoría con las acciones de creación, edición o eliminación de registros. |

## 4. Requisitos no funcionales

| ID | Nombre | Prioridad | Descripción |
|----|--------|-----------|-------------|
| RNF-01 | Seguridad | Alta | Contraseñas con bcrypt, HTTPS obligatorio, protección contra inyección SQL y XSS, control de acceso por roles (RBAC). |
| RNF-02 | Rendimiento | Alta | Respuesta menor a 2 s para el 95% de las solicitudes; al menos 50 usuarios concurrentes. |
| RNF-03 | Usabilidad | Alta | Un usuario nuevo registra un equipo o mantenimiento sin capacitación previa. |
| RNF-04 | Compatibilidad | Media | Chrome, Firefox y Edge; diseño responsivo (computador, tablet, celular). |
| RNF-05 | Disponibilidad | Media | 99% del tiempo, según el hosting. |
| RNF-06 | Confiabilidad | Media | Backups periódicos automáticos de la BD. |
| RNF-07 | Mantenibilidad | Baja | Código documentado, buenas prácticas, Git/GitHub. |
| RNF-08 | Escalabilidad | Baja | API REST, frontend/backend separados. |

## 5. Criterios de aceptación

- **RF-01:** El administrador crea un usuario con rol válido (administrador, técnico o responsable); si el correo ya existe o faltan campos, muestra error claro.
- **RF-02:** Con credenciales válidas inicia sesión, guarda el token JWT y redirige al Dashboard; con datos incorrectos muestra error claro; cierra sesión tras inactividad.
- **RF-03:** Al ingresar un correo registrado permite restablecer la contraseña mediante token/verificación sin exponer datos sensibles.
- **RF-04:** Un equipo creado con todos sus campos (nombre, tipo, ubicación, estado, responsable) aparece en la tabla y permite editarse o eliminarse.
- **RF-05:** La lista de equipos filtra correctamente en tiempo real o por consulta según estado, ubicación, tipo o fecha de próximo mantenimiento.
- **RF-06:** Al seleccionar un equipo se despliega su historial cronológico completo de mantenimientos preventivos y correctivos.
- **RF-07:** Un mantenimiento registrado por un técnico queda guardado, asociado al equipo y visible de inmediato en su historial.
- **RF-08:** El sistema calcula la fecha de próximo mantenimiento y muestra alertas visuales para mantenimientos próximos a vencer o vencidos.
- **RF-09:** Una falla registrada queda vinculada al equipo afectado y cambia o alerta sobre su estado operativo.
- **RF-10:** El costo acumulado por equipo suma exactamente el valor de todos los mantenimientos registrados para ese activo.
- **RF-11:** El administrador puede exportar reportes filtrados por equipo, técnico o rango de fechas en formato PDF y Excel sin errores de formato.
- **RF-12:** El Dashboard muestra cifras reales actualizadas de equipos con mantenimiento pendiente, gasto total acumulado y mantenimientos del mes en curso.
- **RF-13:** El administrador puede registrar técnicos, editar sus datos y asignarlos como responsables de órdenes de mantenimiento.
- **RF-14:** Cada operación de creación, edición o eliminación registra automáticamente en la tabla de auditoría el usuario, acción, entidad afectada y fecha/hora.

## 6. Alcance actual (lo implementado frente a lo pedido)

- **RF-01:** solo API (sin pantalla); no envía correo de confirmación; pide contraseña de mínimo 8 caracteres y rechaza correos repetidos; no valida el rol de forma explícita (un rol inexistente da error 500 en lugar de 400): pendiente de corregir.
- **RF-02:** la sesión vence a los 30 minutos por la duración del token JWT; no hay cierre por inactividad. "Recordar sesión activa" guarda la sesión en el navegador; sin marcarla, se borra al cerrarlo.
- **RF-03:** no implementado; el enlace "¿Olvidó su clave?" informa que está en desarrollo.
- **RF-04 y RF-05:** la pantalla de Inventario aparece en el menú del administrador y del responsable; el técnico no la ve, aunque el requisito y la API lo incluyen como actor.
- **RF-06:** existe la API del historial por equipo y la lista general de órdenes en Mantenimientos; falta la vista de historial por equipo.
- **RF-08:** alertas visuales de "Vencido" y "En N días" en Inventario y Dashboard; no hay notificaciones por correo. Al programar un mantenimiento, el equipo toma esa fecha como próximo mantenimiento si es la más cercana; no calcula periodicidades automáticas.
- **RF-09:** pantalla de Registro de Fallas (listado, búsqueda por texto y por equipo, y registro) conectada a la API; solo el administrador y el técnico ven la pantalla en el menú y pueden registrar (el responsable recibiría 403); registrar una falla no cambia el estado del equipo ni genera una alerta.
- **RF-10:** el costo acumulado suma solo los mantenimientos **completados**; las órdenes programadas o en proceso aún no cuentan.
- **RF-11:** solo exportación básica (CSV desde Inventario y Mantenimientos; PDF con la impresión del navegador); sin filtros por rango de fechas. Reportes formales pendientes.
- **RF-12:** el Dashboard lo ven todos los roles, como en el diseño del documento.
- **RF-13:** existe el registro de técnicos y su listado (API); faltan la edición y la pantalla.
- **RF-14:** el backend registra usuario, acción, tabla, registro y fecha en cada creación, edición y eliminación; no hay pantalla de consulta.
- **RNF-01:** bcrypt y control de acceso por roles activos, y las consultas a MySQL usan parámetros; HTTPS no se aplica en desarrollo (`http://localhost`).
- **RNF-04:** probado solo en Chrome; el menú lateral se oculta en pantallas angostas.
