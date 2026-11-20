# SIGEM MaintPRO — Tareas

Scrumban, agosto–noviembre 2026.

Leyenda: `[x]` hecho · `[ ]` pendiente.
Estado según las pruebas con evidencia del documento (Figuras 1 a 9). Lo que está programado pero aún no se probó queda pendiente.

## Preparación

- [x] Backend instalado (`sigem-backend`)
- [x] Frontend instalado (`sigem-frontend`)
- [x] Base de datos y tablas creadas con `sigem-backend/schema.sql` (Figura 2)
- [x] Usuarios iniciales cargados con `npm run seed`
- [ ] Migración aplicada con `npm run migrar` (con el `schema.sql` actual dirá que la base ya estaba actualizada)

## Requisitos funcionales

- [ ] RF-01 Registro de usuarios (API lista; falta probarla y la pantalla)
- [x] RF-02 Inicio de sesión (probado: 200 y 401, Figuras 4 y 9)
- [ ] RF-03 Recuperación de contraseña (no implementado)
- [x] RF-04 Registro de equipos (probado: 201, Figura 5)
- [x] RF-05 Consulta de equipos (probado: 200, Figuras 6 y 8)
- [ ] RF-06 Historial de mantenimiento (API lista; falta probar y la vista por equipo)
- [ ] RF-07 Registro de mantenimientos (se comprobó la creación desde el rol Técnico y su aparición en la lista; falta verificar HTTP 201, estado programado e historial del equipo para completar CP-04)
- [ ] RF-08 Programación y alertas (programado; falta probar)
- [ ] RF-09 Registro de fallas (CP-07 aprobado: se comprobó que permite registrar y consultar fallas; pendiente implementar el cambio o alerta del estado del equipo)
- [ ] RF-10 Costos de reparación (se verificó que un mantenimiento completado de $780.000 aumentó el gasto acumulado de $36.611.000 a $37.391.000; falta comprobar que las órdenes programadas no sumen y verificar el costo por equipo mediante la API)
- [ ] RF-11 Generación de reportes (PDF y Excel) (solo exportación básica)
- [x] RF-12 Dashboard de indicadores (carga con datos desde la API)
- [ ] RF-13 Gestión de técnicos (API lista; falta edición y pantalla)
- [ ] RF-14 Auditoría de cambios (el backend registra; falta verificar la tabla)

## Requisitos no funcionales

- [ ] RNF-01 Seguridad (bcrypt y control de acceso por roles implementados; se verificaron los permisos visibles del Administrador, Técnico y Responsable, y el uso del token Bearer. Falta comprobar las respuestas HTTP 401 y 403 de CP-06)
- [ ] RNF-02 Rendimiento
- [ ] RNF-03 Usabilidad
- [ ] RNF-04 Compatibilidad (probado solo en Chrome)
- [ ] RNF-06 Backups

## Validación

- [ ] Pruebas según `pruebas.md` (CP-01, CP-02, CP-03 y CP-07 aprobadas; CP-04, CP-05 y CP-06 parcialmente verificadas, con comprobaciones pendientes)
- [x] Verificar el menú por rol con el Técnico y el Responsable (se comprobó que el Técnico visualiza Dashboard, Inventario, Mantenimientos y Registro de Fallas; el Responsable visualiza Dashboard e Inventario).
- [x] Mostrar Inventario al técnico en el menú (RF-04 y RF-05 lo incluyen como actor)
- [ ] Documentación y entrega (fecha límite: 20 de noviembre de 2026)

## Para arrancar el proyecto

1. XAMPP → MySQL en **Start**.
2. Desde `sigem-backend`, importar las tablas en MySQL:

   ```powershell
   cmd /c "C:\xampp\mysql\bin\mysql.exe -u root < schema.sql"
   ```

3. En `sigem-backend`:

   ```bash
   npm run seed
   npm run migrar
   ```

   Opcional, datos de demostración: `npm run seed:demo`
4. Terminal 1 (API en `localhost:3000`):

   ```bash
   cd sigem-backend
   npm run dev
   ```

5. Terminal 2 (Vite en `localhost:5173`):

   ```bash
   cd sigem-frontend
   npm run dev
   ```

6. Navegador: <http://localhost:5173/>
