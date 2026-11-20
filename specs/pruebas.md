
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

**Pasos:** Iniciar sesión como Técnico Especialista, obtener el token JWT y registrar un mantenimiento preventivo mediante la API.

**Solicitud:** `POST http://localhost:3000/api/mantenimientos` (token Bearer).

**Datos utilizados:**
- Equipo: Servidor Blade Rack Principal (`equipo_id`: 3).
- Técnico asignado: Técnico de Mantenimiento (`tecnico_id`: 2).
- Tipo: `preventivo`.
- Fecha: `2026-12-15`.
- Descripción: `CP-04 - Prueba de registro de mantenimiento`.
- Costo: `0`.

**Esperado:**
- La API responde HTTP 201.
- Se crea una orden de mantenimiento.
- La orden queda inicialmente en estado `programado`.
- El mantenimiento aparece en el historial del equipo correspondiente.

**Obtenido:**
- La API respondió HTTP 201.
- Se creó el mantenimiento con ID 66.
- La orden quedó en estado `programado`.
- Se consultó `GET /api/equipos/3/historial`.
- El mantenimiento 66 apareció correctamente con su equipo, tipo, fecha, descripción y costo.

**Estado:** [x] Pasó · [ ] Falló

**Evidencia:** Respuesta HTTP 201 con `{"id":66}` y consulta del historial del equipo 3 desde PowerShell.



### CP-05 (RF-10) Costo acumulado

**Objetivo:** Verificar que SIGEM calcule correctamente el costo acumulado de los mantenimientos completados de un equipo, sin sumar órdenes programadas ni en proceso.

**Equipo utilizado:** Servidor Blade Rack Principal (`equipo_id`: 3).

**Solicitud:** `GET http://localhost:3000/api/equipos/3/costos`

**Pasos:**
1. Iniciar sesión como Técnico Especialista y obtener un token JWT.
2. Consultar el costo acumulado del equipo 3 mediante la API.
3. Consultar el listado de mantenimientos.
4. Filtrar los registros correspondientes al equipo 3.
5. Sumar únicamente los costos de los mantenimientos con estado `completado`.
6. Comparar la suma obtenida con el resultado de la API.

**Esperado:**
- La API devuelve el campo `costo_acumulado`.
- El costo acumulado corresponde a la suma de los mantenimientos completados.
- Los mantenimientos en estado `programado` o `en_proceso` no se incluyen en la suma.

**Obtenido:**
- La API devolvió un costo acumulado de $4.232.000.
- Se consultaron los mantenimientos del equipo 3.
- La suma de los mantenimientos completados fue de $4.232.000.
- Ambos valores coincidieron exactamente.
- La diferencia entre el resultado de la API y la suma calculada fue de $0.
- Anteriormente, se comprobó que el gasto acumulado del Dashboard aumentó $780.000 al completar un mantenimiento de ese valor.

**Estado:** [x] Pasó · [ ] Falló

**Evidencia:** Consultas realizadas desde PowerShell a `GET /api/equipos/3/costos` y `GET /api/mantenimientos`. Se verificó que ambos cálculos dieron $4.232.000.

**Conclusión:** El cálculo de costo acumulado del equipo funciona correctamente para los datos verificados.



### CP-06 (RNF-01) Control de acceso por rol

**Pasos:** Iniciar sesión con `tecnico@sigem.com` y utilizar su token JWT para comprobar los permisos de acceso a la API.

**Esperado:**
- `DELETE /api/equipos/:id` → HTTP 403 (solo administrador).
- `POST /api/auth/register` → HTTP 403 (solo administrador).
- `GET /api/equipos` → HTTP 200 (permitido).
- Cualquiera de las rutas protegidas sin token → HTTP 401.

**Obtenido:**
- **Administrador:** Se comprobó que puede consultar, registrar y eliminar equipos desde la interfaz.
- **Técnico Especialista:** Puede consultar y registrar equipos. Se inició sesión correctamente y se obtuvo un token JWT válido.
- **Responsable de Área:** Puede consultar equipos, pero no aparecen las opciones para registrarlos, editarlos o eliminarlos.
- **Acceso sin token:** `GET /api/equipos` respondió HTTP 401 con `{"error":"Token requerido"}`.
- **Eliminar equipo como Técnico:** `DELETE /api/equipos/999999999` respondió HTTP 403.
- **Registrar usuarios como Técnico:** `POST /api/auth/register` respondió HTTP 403.
- **Consultar equipos como Técnico:** `GET /api/equipos` respondió HTTP 200.

**Estado:** [x] Pasó · [ ] Falló

**Evidencia:** Verificaciones realizadas desde PowerShell y Chrome DevTools. Se confirmaron los códigos HTTP 200, 401 y 403, además de las restricciones visibles en la interfaz según el rol.

**Nota:** Las pruebas HTTP 403 se realizaron utilizando un usuario Técnico autenticado. Las operaciones fueron rechazadas antes de modificar los registros.


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
