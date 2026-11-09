const router = require('express').Router();
const { pool, auditar } = require('../db');
const { autenticar, permitir } = require('../middleware/auth');

router.use(autenticar);

// RF-07 + RF-08: registrar mantenimiento y programar el próximo
router.post('/', permitir('administrador', 'tecnico'), async (req, res) => {
  const { equipo_id, tipo, fecha, descripcion, costo, proximo_mantenimiento, tecnico_id } = req.body;
  if (!equipo_id || !tipo || !fecha || !descripcion)
    return res.status(400).json({ error: 'equipo_id, tipo, fecha y descripcion son obligatorios' });
  if (!['preventivo', 'correctivo'].includes(tipo)) return res.status(400).json({ error: 'tipo inválido' });
  if (costo < 0) return res.status(400).json({ error: 'El costo no puede ser negativo' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      `INSERT INTO mantenimientos (equipo_id,tecnico_id,tipo,fecha,descripcion,costo,proximo_mantenimiento)
       VALUES (?,?,?,?,?,?,?)`,
      [equipo_id, tecnico_id || req.usuario.id, tipo, fecha, descripcion, costo || 0, proximo_mantenimiento || null]);
    await conn.query('UPDATE equipos SET proximo_mantenimiento = ?, estado = ? WHERE id = ?',
      [proximo_mantenimiento || null, 'operativo', equipo_id]);
    await conn.commit();
    await auditar(req.usuario.id, 'CREAR', 'mantenimientos', r.insertId);
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    await conn.rollback();
    if (e.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Equipo o técnico no existe' });
    throw e;
  } finally {
    conn.release();
  }
});

// RF-08: equipos con mantenimiento próximo (7 días) o vencido
router.get('/alertas', async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT id,nombre,ubicacion,proximo_mantenimiento,
       CASE WHEN proximo_mantenimiento < CURDATE() THEN 'vencido' ELSE 'proximo' END AS alerta
     FROM equipos
     WHERE proximo_mantenimiento IS NOT NULL AND proximo_mantenimiento <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
     ORDER BY proximo_mantenimiento`);
  res.json(rows);
});

// RF-09: registro de fallas
router.post('/fallas', permitir('administrador', 'tecnico'), async (req, res) => {
  const { equipo_id, descripcion, fecha } = req.body;
  if (!equipo_id || !descripcion || !fecha) return res.status(400).json({ error: 'Datos incompletos' });
  const [r] = await pool.query(
    'INSERT INTO fallas (equipo_id,descripcion,fecha,reportada_por) VALUES (?,?,?,?)',
    [equipo_id, descripcion, fecha, req.usuario.id]);
  await auditar(req.usuario.id, 'CREAR', 'fallas', r.insertId);
  res.status(201).json({ id: r.insertId });
});

router.get('/fallas/:equipoId', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM fallas WHERE equipo_id = ? ORDER BY fecha DESC', [req.params.equipoId]);
  res.json(rows);
});

module.exports = router;
