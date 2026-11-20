
# SIGEM MaintPRO — Plan de pruebas (QA)

Basado en la sección 3.2 del documento.

## Tipos de prueba

| Tipo | Ámbito | Criterio de aceptación | Herramienta |
|------|--------|------------------------|-------------|
| Unitarias | Lógica backend, costos (RF-10) | 100% de las funciones críticas pasan | Jest / Mocha |
| Integración API | Auth, equipos, mantenimientos | Códigos HTTP 200, 201, 400, 401 | Postman / Insomnia |
| Seguridad | Auth, bcrypt, RBAC (RNF-01) | Claves cifradas; acceso denegado a no autorizados | OWASP ZAP / manual |
| Rendimiento | Dashboard y listados (RNF-02) | Respuesta < 2 s | Lighthouse / JMeter |
| Usabilidad (UAT) | Uso por usuarios (RNF-03) | Registra equipo/mantenimiento sin ayuda | Pruebas con usuarios |

## Casos de prueba

### CP-01 (RF-02) Login correcto

**Pasos:** Ejecutar `schema.sql` y `npm run seed`; abrir `http://localhost:5173/`, usar `admin@sigem.com` con la contraseña vigente y seleccionar **Iniciar Sesión**.

**Solicitud:** `POST http://localhost:3000/api/auth/login`

```json
{
  "email": "admin@sigem.com",
  "password": "CONTRASEÑA_VIGENTE"
}
```

- **Esperado:** HTTP 200 con token y usuario; la interfaz guarda el token JWT y redirige a `/dashboard`.
- **Obtenido:** HTTP 200 con token y usuario (Figura 4); la interfaz entra al sistema.
- **Estado:** [x] Pasó · [ ] Falló
- **Nota:** La contraseña inicial del Administrador fue cambiada durante la prueba CP-08. Para una instalación nueva con `npm run seed`, se deben consultar las credenciales de demostración correspondientes.

### CP-02 (RF-02) Login incorrecto

**Solicitud:** `POST http://localhost:3000/api/auth/login`

```json
{
  "email": "admin@sigem.com",
  "password": "incorrecta"
}
```

- **Esperado:** HTTP 401 con `{"error":"Credenciales incorrectas"}` y mensaje de error claro en la interfaz.
- **Obtenido:** API verificada: HTTP 401 con "Credenciales incorrectas" (Figura 9). Se comprobó visualmente que la interfaz muestra el mensaje "Credenciales incorrectas" y permanece en la pantalla de inicio de sesión.
- **Estado:** [x] Pasó · [ ] Falló
- **Evidencia:** Captura de pantalla del mensaje de error en el inicio de sesión.

### CP-03 (RF-04) Crear equipo

**Solicitud:** `POST http://localhost:3000/api/equipos` (token Bearer).

- **Esperado:** Aparece en la lista (código 201 en la API).
- **Obtenido:** HTTP 201 con `id` 1 (Figura 5); aparece en `GET /api/equipos` (Figura 6) y en la pantalla de Inventario (Figura 8).
- **Estado:** [x] Pasó · [ ] Falló

### CP-04 (RF-07) Registrar mantenimiento

**Solicitud:** `POST http://localhost:3000/api/mantenimientos` (token de administrador o técnico) con `equipo_id`, `tecnico_id`, `tipo`, `fecha`, `descripcion` y `costo`.

- **Esperado:** HTTP 201; la orden queda en estado `programado` y aparece en el historial del equipo (`GET /api/equipos/:id/historial`, RF-06).
- **Obtenido:** Se registró un mantenimiento desde el rol Técnico Especialista. El sistema permitió guardarlo y se comprobó que aparece en la lista de mantenimientos.
- **Estado:** [ ] Pasó · [ ] Falló — Pendiente de verificación completa.
- **Evidencia:** Registro visible en la lista de mantenimientos. Pendiente guardar la captura.

### CP-05 (RF-10) Costo acumulado

**Pasos:** Se creó un mantenimiento preventivo para la Cortadora Láser Industrial con un costo de $780.000 y se verificó su registro en el sistema.

**Solicitud:** `GET http://localhost:3000/api/equipos/:id/costos`

**Esperado:** `costo_acumulado` = X + Y (suma de los costos de los mantenimientos **completados** del equipo); las órdenes programadas no deben sumar.

**Obtenido:** El mantenimiento de $780.000 aparece en estado `Completado`. El gasto acumulado del Dashboard pasó de $36.611.000 a $37.391.000, aumentando exactamente $780.000.

**Estado:** [ ] Pasó · [ ] Falló — Verificación parcial satisfactoria.

**Pendiente:** Comprobar el costo acumulado específico del equipo mediante la API y verificar que las órdenes programadas no se incluyan en la suma.

**Evidencia:** Captura del mantenimiento completado y del gasto acumulado del Dashboard.

### CP-06 (RNF-01) Control de acceso por rol

**Pasos:** Iniciar sesión con `tecnico@sigem.com` y utilizar su token de autenticación para comprobar los permisos.

**Esperado:**
- `DELETE /api/equipos/:id` → HTTP 403 (solo administrador).
- `POST /api/auth/register` → HTTP 403 (solo administrador).
- `GET /api/equipos` → HTTP 200 (permitido).
- Cualquiera de las rutas protegidas sin token → HTTP 401.

**Obtenido:**
- **Administrador:** Se comprobó que puede consultar, registrar y eliminar equipos desde la interfaz. Se realizó una eliminación correctamente.
- **Técnico Especialista:** Puede consultar y registrar equipos. No aparecen las opciones de editar ni eliminar.
- **Responsable de Área:** Puede consultar equipos, pero no aparecen opciones para registrarlos, editarlos o eliminarlos.
- **Autenticación con token:** Se verificó que `GET /api/equipos` envía el encabezado `Authorization: Bearer`. La respuesta observada fue HTTP 304 (caché).
- **Acceso sin token:** Se realizó una solicitud `GET /api/equipos` sin autenticación. El backend respondió **HTTP 401** y mostró `{"error":"Token requerido"}`. Se confirmó mediante Chrome DevTools (Network).

**Pendiente:** Verificar las respuestas HTTP 403 para las operaciones no autorizadas y confirmar directamente la respuesta HTTP 200 en la consulta autenticada.

**Estado:** [ ] Pasó · [ ] Falló — Prueba parcialmente verificada.

**Evidencia:** Capturas del Inventario con los tres roles, de la autenticación Bearer y de la respuesta HTTP 401 en Chrome DevTools.

### CP-07 (RF-09) Registrar falla

**Pasos:** Iniciar sesión como administrador, abrir **Registro de Fallas**, pulsar **Registrar Falla**, elegir un equipo, escribir una descripción y pulsar **Registrar**.

**Solicitud:** `POST http://localhost:3000/api/mantenimientos/fallas` (token de administrador o técnico) con `equipo_id`, `fecha` y `descripcion`; el listado sale de `GET /api/mantenimientos/fallas`.

- **Esperado:** HTTP 201; la falla aparece en la tabla con la fecha, el equipo, la descripción y quién la reportó.
- **Obtenido:** La falla "Ruido anormal y sobrecalentamiento del motor" del Generador Diésel de Respaldo aparece en la tabla, reportada por Administrador (evidencia: pantalla de Registro de Fallas).
- **Estado:** [x] Pasó · [ ] Falló
- **Nota:** El equipo no cambia de estado al registrar la falla.

### CP-08 (RF-03) Recuperación de contraseña

**Pasos:**
1. Abrir SIGEM en `http://localhost:5173/`.
2. Seleccionar **¿Olvidó su clave? (RF-03)**.
3. Ingresar el correo electrónico del Administrador.
4. Pulsar **Solicitar recuperación**.
5. Ingresar a Ethereal Email y comprobar que llegó el correo de recuperación.
6. Abrir el enlace temporal recibido.
7. Escribir y confirmar una contraseña nueva.
8. Pulsar **Guardar nueva contraseña**.
9. Regresar al inicio de sesión e ingresar con la nueva contraseña.

**Solicitud de recuperación:** `POST http://localhost:3000/api/auth/forgot-password`

```json
{
  "email": "admin@sigem.com"
}
```

**Solicitud de restablecimiento:** `POST http://localhost:3000/api/auth/reset-password`

```json
{
  "token": "TOKEN_TEMPORAL_RECIBIDO",
  "password": "NUEVA_CONTRASEÑA"
}
```

**Esperado:**
- El sistema permite solicitar la recuperación.
- Se genera un enlace temporal de recuperación.
- Se envía un correo a través del servicio SMTP de pruebas.
- El enlace permite establecer una contraseña nueva.
- El usuario puede iniciar sesión con la contraseña actualizada.

**Obtenido:**
- Se comprobó que el formulario de recuperación funciona.
- El backend respondió con el mensaje "Si el correo está registrado, recibirás instrucciones".
- El correo "SIGEM - Recuperación de contraseña" llegó correctamente a Ethereal Email.
- Se abrió la pantalla de restablecimiento desde el enlace recibido.
- Se estableció una contraseña nueva.
- Se inició sesión correctamente con la nueva contraseña del Administrador.

**Estado:** [x] Pasó · [ ] Falló

**Entorno:** Desarrollo, utilizando Ethereal Email como servicio SMTP de prueba.

**Evidencia:** Capturas del formulario de recuperación, bandeja de Ethereal y pantalla de restablecimiento. No incluir tokens, contraseñas ni credenciales SMTP en las evidencias.

**Nota:** La recuperación fue validada de principio a fin en el entorno de pruebas. Para producción se requiere configurar un servicio de correo real y completar las verificaciones adicionales de seguridad.

## Prueba en Postman

**Solicitud:** `POST http://localhost:3000/api/auth/login`

**Body JSON** (`Content-Type: application/json`):

```json
{
  "email": "admin@sigem.com",
  "password": "CONTRASEÑA_VIGENTE"
}
```

Campos exactos: `email` y `password` (`src/routes/auth.js`).

**Importante:** Utilizar la contraseña vigente del usuario. La contraseña inicial de demostración del Administrador fue modificada durante CP-08. No registrar contraseñas reales, tokens JWT ni credenciales SMTP en la documentación.
