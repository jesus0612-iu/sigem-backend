const router = require('express').Router();
const { pool } = require('../db');
const { autenticar, permitir } = require('../middleware/auth');

// RF-12: indicadores clave
router.get('/', autenticar, permitir('administrador'), async (_req, res) => {
  const [[pend]] = await pool.query(
    'SELECT COUNT(*) AS n FROM equipos WHERE proximo_mantenimiento IS NOT NULL AND proximo_mantenimiento <= CURDATE()');
  const [[gasto]] = await pool.query('SELECT COALESCE(SUM(costo),0) AS total FROM mantenimientos');
  const [[mes]] = await pool.query(
    `SELECT COUNT(*) AS n FROM mantenimientos
     WHERE YEAR(fecha)=YEAR(CURDATE()) AND MONTH(fecha)=MONTH(CURDATE())`);
  const [[eq]] = await pool.query('SELECT COUNT(*) AS n FROM equipos');
  res.json({
    equipos_totales: eq.n,
    equipos_con_mantenimiento_pendiente: pend.n,
    gasto_total: Number(gasto.total),
    mantenimientos_del_mes: mes.n,
  });
});

module.exports = router;
