const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, auditar } = require('../db');
const { autenticar, permitir } = require('../middleware/auth');

// RF-02: inicio de sesión
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(password, u.password_hash)))
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  const token = jwt.sign({ id: u.id, rol: u.rol, nombre: u.nombre }, process.env.JWT_SECRET, { expiresIn: '30m' });
  res.json({ token, usuario: { id: u.id, nombre: u.nombre, rol: u.rol } });
});

// RF-01: registro de usuarios (solo administrador)
router.post('/register', autenticar, permitir('administrador'), async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  if (!nombre || !email || !password || !rol) return res.status(400).json({ error: 'Datos incompletos' });
  if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const [r] = await pool.query(
      'INSERT INTO usuarios (nombre,email,password_hash,rol) VALUES (?,?,?,?)', [nombre, email, hash, rol]);
    await auditar(req.usuario.id, 'CREAR', 'usuarios', r.insertId);
    res.status(201).json({ id: r.insertId, nombre, email, rol });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'El email ya está registrado' });
    throw e;
  }
});

// RF-13: gestión de técnicos (listado para asignar mantenimientos)
router.get('/tecnicos', autenticar, permitir('administrador'), async (_req, res) => {
  const [rows] = await pool.query("SELECT id,nombre,email FROM usuarios WHERE rol='tecnico'");
  res.json(rows);
});

module.exports = router;
