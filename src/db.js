require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
});

// RF-14: registro de auditoría de creación, edición y eliminación
async function auditar(usuarioId, accion, tabla, registroId) {
  await pool.query(
    'INSERT INTO auditoria (usuario_id, accion, tabla, registro_id) VALUES (?,?,?,?)',
    [usuarioId, accion, tabla, registroId]
  );
}

module.exports = { pool, auditar };
