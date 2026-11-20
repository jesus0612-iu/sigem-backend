const router = require('express').Router();
const { pool, auditar } = require('../db');
const { autenticar, permitir } = require('../middleware/auth');

router.use(autenticar);
const escritura = permitir('administrador', 'tecnico');
const codigo = (r) => `MNT-${String(r.fecha).slice(0, 4)}-${String(r.id).padStart(3, '0')}`;

// Validación común de una orden de mantenimiento
function validar(b) {
  if (!b.equipo_id || !b.tecnico_id || !b.tipo || !b.fecha || !b.descripcion)
    return 'equipo, técnico, tipo, fecha y descripción son obligatorios';
  if (!['preventivo', 'correctivo'].includes(b.tipo)) return 'tipo inválido';
  if (Number(b.costo) < 0) return 'El costo no puede ser negativo';
  return null;
}

// RF-06: listado de órdenes de mantenimiento con equipo y técnico
router.get('/', async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT m.id, m.tipo, m.estado, m.fecha, m.fecha_real, m.descripcion, m.costo,
            m.equipo_id, e.nombre AS equipo, m.tecnico_id, u.nombre AS tecnico
     FROM mantenimientos m
     JOIN equipos e ON e.id = m.equipo_id
     JOIN usuarios u ON u.id = m.tecnico_id
     ORDER BY m.fecha DESC, m.id DESC`);
  res.json(rows.map((r) => ({ ...r, codigo: codigo(r), costo: Number(r.costo) })));
});

// Técnicos disponibles para asignar (filtro y formulario)
router.get('/tecnicos', async (_req, res) => {
  const [rows] = await pool.query("SELECT id, nombre FROM usuarios WHERE rol = 'tecnico' ORDER BY nombre");
  res.json(rows);
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

// RF-07 + RF-08: programar un mantenimiento (queda en estado "programado")
router.post('/', escritura, async (req, res) => {
  const err = validar(req.body);
  if (err) return res.status(400).json({ error: err });
  const { equipo_id, tecnico_id, tipo, fecha, descripcion, costo } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      `INSERT INTO mantenimientos (equipo_id,tecnico_id,tipo,estado,fecha,descripcion,costo)
       VALUES (?,?,?,'programado',?,?,?)`,
      [equipo_id, tecnico_id, tipo, fecha, descripcion, costo || 0]);
    // El equipo queda con la fecha programada más cercana como próximo mantenimiento
    await conn.query(
      `UPDATE equipos SET proximo_mantenimiento = CASE
         WHEN proximo_mantenimiento IS NULL OR proximo_mantenimiento < CURDATE() OR ? < proximo_mantenimiento THEN ?
         ELSE proximo_mantenimiento END
       WHERE id = ?`, [fecha, fecha, equipo_id]);
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

// Editar una orden
router.put('/:id(\\d+)', escritura, async (req, res) => {
  const err = validar(req.body);
  if (err) return res.status(400).json({ error: err });
  const { equipo_id, tecnico_id, tipo, fecha, descripcion, costo } = req.body;
  try {
    const [r] = await pool.query(
      'UPDATE mantenimientos SET equipo_id=?, tecnico_id=?, tipo=?, fecha=?, descripcion=?, costo=? WHERE id=?',
      [equipo_id, tecnico_id, tipo, fecha, descripcion, costo || 0, req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ error: 'Orden no encontrada' });
    await auditar(req.usuario.id, 'EDITAR', 'mantenimientos', Number(req.params.id));
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Equipo o técnico no existe' });
    throw e;
  }
});

// Avanzar el estado: programado -> en proceso -> completado
router.patch('/:id(\\d+)/estado', escritura, async (req, res) => {
  const [[m]] = await pool.query('SELECT * FROM mantenimientos WHERE id = ?', [req.params.id]);
  if (!m) return res.status(404).json({ error: 'Orden no encontrada' });
  const sig = { programado: 'en_proceso', en_proceso: 'completado' }[m.estado];
  if (!sig) return res.status(400).json({ error: 'La orden ya está completada' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (sig === 'en_proceso') {
      await conn.query("UPDATE mantenimientos SET estado = 'en_proceso' WHERE id = ?", [m.id]);
      await conn.query("UPDATE equipos SET estado = 'en_mantenimiento' WHERE id = ?", [m.equipo_id]);
    } else {
      await conn.query("UPDATE mantenimientos SET estado = 'completado', fecha_real = CURDATE() WHERE id = ?", [m.id]);
      await conn.query(
        `UPDATE equipos SET estado = 'operativo',
           proximo_mantenimiento = CASE WHEN proximo_mantenimiento IS NOT NULL AND proximo_mantenimiento <= ? THEN NULL ELSE proximo_mantenimiento END
         WHERE id = ?`, [m.fecha, m.equipo_id]);
    }
    await conn.commit();
    await auditar(req.usuario.id, 'EDITAR', 'mantenimientos', m.id);
    res.json({ estado: sig });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

// RF-09: registro de fallas
router.get('/fallas', async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT f.id, f.fecha, f.descripcion, f.equipo_id, e.nombre AS equipo,
            f.reportada_por, u.nombre AS reportada
     FROM fallas f
     JOIN equipos e ON e.id = f.equipo_id
     JOIN usuarios u ON u.id = f.reportada_por
     ORDER BY f.fecha DESC, f.id DESC`);
  res.json(rows);
});

router.post('/fallas', escritura, async (req, res) => {
  const { equipo_id, descripcion, fecha } = req.body;
  if (!equipo_id || !descripcion || !fecha) return res.status(400).json({ error: 'equipo, descripción y fecha son obligatorios' });
  try {
    const [r] = await pool.query(
      'INSERT INTO fallas (equipo_id,descripcion,fecha,reportada_por) VALUES (?,?,?,?)',
      [equipo_id, descripcion, fecha, req.usuario.id]);
    await auditar(req.usuario.id, 'CREAR', 'fallas', r.insertId);
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'El equipo no existe' });
    throw e;
  }
});

router.get('/fallas/:equipoId', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM fallas WHERE equipo_id = ? ORDER BY fecha DESC', [req.params.equipoId]);
  res.json(rows);
});
module.exports = router;
