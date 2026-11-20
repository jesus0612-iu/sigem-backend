// Crea los usuarios de demostración por rol: npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

const usuarios = [
  ['Administrador', 'admin@sigem.com', 'Admin12345', 'administrador'],
  ['Técnico de Mantenimiento', 'tecnico@sigem.com', 'Tecnico12345', 'tecnico'],
  ['Responsable de Área', 'responsable@sigem.com', 'Responsable12345', 'responsable'],
];

(async () => {
  for (const [nombre, email, clave, rol] of usuarios) {
    const hash = await bcrypt.hash(clave, 10);
    await pool.query(
      'INSERT IGNORE INTO usuarios (nombre,email,password_hash,rol) VALUES (?,?,?,?)',
      [nombre, email, hash, rol]
    );
    console.log(`Listo: ${email} / ${clave} (${rol})`);
  }
  process.exit(0);
})();
