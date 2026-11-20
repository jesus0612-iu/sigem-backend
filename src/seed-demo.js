// Datos DE DEMOSTRACIÓN para probar Dashboard, Inventario y Mantenimientos: npm run seed:demo
// Orden: npm run seed  ->  npm run migrar  ->  npm run seed:demo
// No se duplica si ya hay mantenimientos.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

const equipos = [
  ['Torno CNC de Alta Precisión', 'Industrial & Mecánico', 'Planta Principal - Bahía 3', 'operativo', '2026-12-15'],
  ['Compresor de Tornillo Rotativo', 'Industrial & Mecánico', 'Cuarto de Máquinas - Edificio Central', 'en_mantenimiento', '2026-11-05'],
  ['Servidor Blade Rack Principal', 'Cómputo & Servidores', 'Data Center - Rack A1', 'operativo', '2026-11-07'],
  ['Unidad Chiller Central de Enfriamiento', 'HVAC & Climatización', 'Azotea - Bloque Norte', 'fuera_de_servicio', '2026-10-25'],
  ['Autoclave de Esterilización Digital', 'Médico & Laboratorio', 'Laboratorio de Calidad - Piso 2', 'operativo', '2027-01-10'],
  ['Montacargas Eléctrico Contrapesado', 'Transporte & Carga', 'Bodega de Despachos', 'operativo', '2026-11-12'],
  ['Generador Diésel de Respaldo', 'Energía', 'Sótano Técnico', 'operativo', '2026-12-01'],
  ['Cortadora Láser Industrial', 'Industrial & Mecánico', 'Planta Principal - Bahía 1', 'operativo', '2026-11-20'],
];
const tecnicosExtra = [['Téc. Sofía Ramírez', 'sofia@sigem.com'], ['Téc. Javier Ortiz', 'javier@sigem.com']];
const prev = [3, 4, 5, 3, 3, 6, 4, 5, 4, 3, 2];   // preventivos por mes (ene-nov)
const corr = [1, 2, 1, 1, 2, 1, 2, 3, 2, 1, 1];   // correctivos por mes (ene-nov)
const pendientes = [ // órdenes que aún no están completadas
  ['Unidad Chiller Central de Enfriamiento', 'correctivo', 'en_proceso', '2026-11-06', 5400000, 'Diagnóstico por presostato de baja disparado. Detección de microfugas'],
  ['Servidor Blade Rack Principal', 'preventivo', 'programado', '2026-11-18', 850000, 'Limpieza preventiva de ventiladores redundantes, actualización de firmware'],
  ['Montacargas Eléctrico Contrapesado', 'preventivo', 'programado', '2026-11-25', 920000, 'Inspección de zapatas de freno, prueba de aislamiento de motor'],
];

(async () => {
  const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM mantenimientos');
  if (n > 0) { console.log('Ya hay mantenimientos, no se agregan datos de demo.'); process.exit(0); }

  const hash = await bcrypt.hash('Tecnico12345', 10);
  for (const [nombre, email] of tecnicosExtra)
    await pool.query("INSERT IGNORE INTO usuarios (nombre,email,password_hash,rol) VALUES (?,?,?, 'tecnico')", [nombre, email, hash]);
  const [tecs] = await pool.query("SELECT id FROM usuarios WHERE rol = 'tecnico' ORDER BY id");
  if (!tecs.length) { console.log('Primero ejecuta: npm run seed'); process.exit(1); }

  for (const e of equipos) {
    const [[ya]] = await pool.query('SELECT id FROM equipos WHERE nombre = ?', [e[0]]);
    if (!ya) await pool.query('INSERT INTO equipos (nombre,tipo,ubicacion,estado,proximo_mantenimiento) VALUES (?,?,?,?,?)', e);
  }
  const [ids] = await pool.query('SELECT id, nombre FROM equipos ORDER BY id');
  let k = 0;
  for (let mes = 0; mes < 11; mes++) {
    for (const [tipo, cant] of [['preventivo', prev[mes]], ['correctivo', corr[mes]]]) {
      for (let i = 0; i < cant; i++, k++) {
        const dia = 2 + ((k * 5) % 24);
        const fecha = `2026-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        const costo = tipo === 'preventivo' ? 120000 + ((k * 37000) % 330000) : 400000 + ((k * 211000) % 2100000);
        await pool.query(
          "INSERT INTO mantenimientos (equipo_id,tecnico_id,tipo,estado,fecha,fecha_real,descripcion,costo) VALUES (?,?,?,'completado',?,?,?,?)",
          [ids[k % ids.length].id, tecs[k % tecs.length].id, tipo, fecha, fecha,
           tipo === 'preventivo' ? 'Mantenimiento preventivo programado' : 'Reparación por falla reportada', costo]);
      }
    }
  }
  for (const [nombre, tipo, estado, fecha, costo, desc] of pendientes) {
    const eq = ids.find((e) => e.nombre === nombre);
    await pool.query(
      'INSERT INTO mantenimientos (equipo_id,tecnico_id,tipo,estado,fecha,descripcion,costo) VALUES (?,?,?,?,?,?,?)',
      [eq.id, tecs[(k++) % tecs.length].id, tipo, estado, fecha, desc, costo]);
  }
  console.log(`Datos de demo listos: ${equipos.length} equipos y ${k} órdenes de mantenimiento.`);
  process.exit(0);
})();
