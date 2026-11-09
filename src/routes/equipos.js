const router = require('express').Router();
const { pool, auditar } = require('../db');
const { autenticar, permitir } = require('../middleware/auth');

router.use(autenticar);

// RF-05: listar y filtrar equipos por estado, ubicación, tipo o próximo mantenimiento
router.get('/', async (req, res) => {
  const { estado, ubicacion, tipo, vence_antes } = req.query;
  const where = []; const params = [];
  if (estado) { where.push('estado = ?'); params.push(estado); }
  if (ubicacion) { where.push('ubicacion LIKE ?'); params.push(`%${ubicacion}%`); }
  if (tipo) { where.push('tipo LIKE ?'); params.push(`%${tipo}%`); }
  if (vence_antes) { where.push('proximo_mantenimiento <= ?'); params.push(vence_antes); }
  const sql = 'SELECT * FROM equipos' + (where.length ? ' WHERE ' + where.join(' AND ') : '') + ' ORDER BY nombre';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM equipos WHERE id = ?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Equipo no encontrado' });
  res.json(rows[0]);
});

// RF-04: registrar, editar y eliminar equipos
router.post('/', permitir('administrador', 'tecnico'), async (req, res) => {
  const { nombre, tipo, ubicacion, estado, responsable_id, proximo_mantenimiento } = req.body;
  if (!nombre || !tipo || !ubicacion) return res.status(400).json({ error: 'nombre, tipo y ubicacion son obligatorios' });
  const [r] = await pool.query(
    'INSERT INTO equipos (nombre,tipo,ubicacion,estado,responsable_id,proximo_mantenimiento) VALUES (?,?,?,?,?,?)',
    [nombre, tipo, ubicacion, estado || 'operativo', responsable_id || null, proximo_mantenimiento || null]);
  await auditar(req.usuario.id, 'CREAR', 'equipos', r.insertId);
  res.status(201).json({ id: r.insertId });
});

router.put('/:id', permitir('administrador', 'tecnico'), async (req, res) => {
  const { nombre, tipo, ubicacion, estado, responsable_id, proximo_mantenimiento } = req.body;
  const [r] = await pool.query(
    'UPDATE equipos SET nombre=?, tipo=?, ubicacion=?, estado=?, responsable_id=?, proximo_mantenimiento=? WHERE id=?',
    [nombre, tipo, ubicacion, estado, responsable_id || null, proximo_mantenimiento || null, req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ error: 'Equipo no encontrado' });
  await auditar(req.usuario.id, 'EDITAR', 'equipos', Number(req.params.id));
  res.json({ ok: true });
});

router.delete('/:id', permitir('administrador'), async (req, res) => {
  const [r] = await pool.query('DELETE FROM equipos WHERE id = ?', [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ error: 'Equipo no encontrado' });
  await auditar(req.usuario.id, 'ELIMINAR', 'equipos', Number(req.params.id));
  res.json({ ok: true });
});

// RF-06: historial de mantenimientos de un equipo
router.get('/:id/historial', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT m.*, u.nombre AS tecnico FROM mantenimientos m
     JOIN usuarios u ON u.id = m.tecnico_id WHERE m.equipo_id = ? ORDER BY m.fecha DESC`, [req.params.id]);
  res.json(rows);
});

// RF-10: costo acumulado de reparaciones por equipo
router.get('/:id/costos', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT COALESCE(SUM(costo),0) AS costo_acumulado FROM mantenimientos WHERE equipo_id = ?', [req.params.id]);
  res.json(rows[0]);
});

module.exports = router;
