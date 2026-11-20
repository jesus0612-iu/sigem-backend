
require('dotenv').config();
const { pool } = require('./db');

async function migrarRecuperacion() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recuperacion_password (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        token_hash CHAR(64) NOT NULL UNIQUE,
        expira_en DATETIME NOT NULL,
        usado_en DATETIME NULL,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id)
          REFERENCES usuarios(id)
          ON DELETE CASCADE
      )
    `);

    console.log('Tabla de recuperación de contraseñas verificada correctamente.');
  } catch (error) {
    console.error('Error al preparar la recuperación:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrarRecuperacion();
