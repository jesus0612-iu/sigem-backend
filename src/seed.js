// Crea el primer usuario administrador: npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

(async () => {
  const hash = await bcrypt.hash('Admin12345', 10);
  await pool.query(
    "INSERT IGNORE INTO usuarios (nombre,email,password_hash,rol) VALUES ('Administrador','admin@sigem.com',?, 'administrador')",
    [hash]);
  console.log('Admin listo: admin@sigem.com / Admin12345 (cámbiala después)');
  process.exit(0);
})();
