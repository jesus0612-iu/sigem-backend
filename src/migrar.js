// Actualiza la base de datos para la pantalla de Mantenimientos: npm run migrar
// (agrega estado y fecha_real; es seguro ejecutarlo más de una vez)
require('dotenv').config();
const { pool } = require('./db');

(async () => {
  const [cols] = await pool.query(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mantenimientos'");
  const tiene = (n) => cols.some((c) => c.COLUMN_NAME === n);
  let cambios = 0;
  if (!tiene('estado')) {
    await pool.query("ALTER TABLE mantenimientos ADD COLUMN estado ENUM('programado','en_proceso','completado') NOT NULL DEFAULT 'programado' AFTER tipo");
    // Lo que ya estaba registrado se considera realizado
    await pool.query("UPDATE mantenimientos SET estado = 'completado'");
    cambios++;
  }
  if (!tiene('fecha_real')) {
    await pool.query('ALTER TABLE mantenimientos ADD COLUMN fecha_real DATE NULL AFTER fecha');
    await pool.query("UPDATE mantenimientos SET fecha_real = fecha WHERE estado = 'completado'");
    cambios++;
  }
  console.log(cambios ? 'Migración aplicada: mantenimientos ahora tiene estado y fecha_real.' : 'La base de datos ya estaba actualizada.');
  process.exit(0);
})();
