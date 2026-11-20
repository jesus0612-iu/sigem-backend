const router = require('express').Router();
const { pool } = require('../db');
const { autenticar } = require('../middleware/auth');

const num = (v) => Number(v || 0);

// RF-12: indicadores clave del panel (pendientes, gasto total y mantenimientos del mes)
router.get('/', autenticar, async (_req, res) => {
  const [[eq]] = await pool.query(
    `SELECT COUNT(*) AS total,
            SUM(estado = 'operativo') AS operativos,
            SUM(estado <> 'operativo') AS atencion,
            SUM(proximo_mantenimiento IS NOT NULL AND proximo_mantenimiento <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)) AS pendientes,
            SUM(proximo_mantenimiento IS NOT NULL AND proximo_mantenimiento < CURDATE()) AS vencidos
     FROM equipos`);

  const [[m]] = await pool.query(
    `SELECT COALESCE(SUM(CASE WHEN estado = 'completado' THEN costo END), 0) AS gasto_total,
            COALESCE(SUM(CASE WHEN estado = 'completado' AND YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE()) THEN costo END), 0) AS gasto_mes,
            SUM(YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE())) AS mes_actual,
            SUM(YEAR(fecha) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND MONTH(fecha) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))) AS mes_anterior
     FROM mantenimientos`);

  const [hist] = await pool.query(
    `SELECT MONTH(fecha) AS mes, tipo, COUNT(*) AS n FROM mantenimientos
     WHERE YEAR(fecha) = YEAR(CURDATE()) GROUP BY MONTH(fecha), tipo`);
  const preventivo = Array(12).fill(0);
  const correctivo = Array(12).fill(0);
  hist.forEach((r) => (r.tipo === 'preventivo' ? preventivo : correctivo)[r.mes - 1] = num(r.n));

  const [salud] = await pool.query('SELECT estado, COUNT(*) AS n FROM equipos GROUP BY estado');

  // Eficiencia operativa = % de intervenciones preventivas sobre el total del año
  const totPrev = preventivo.reduce((a, b) => a + b, 0);
  const totAnio = totPrev + correctivo.reduce((a, b) => a + b, 0);

  res.json({
    anio: new Date().getFullYear(),
    pendientes: num(eq.pendientes),
    vencidos: num(eq.vencidos),
    mes_actual: num(m.mes_actual),
    mes_anterior: num(m.mes_anterior),
    gasto_total: num(m.gasto_total),
    gasto_mes: num(m.gasto_mes),
    equipos_total: num(eq.total),
    equipos_operativos: num(eq.operativos),
    requieren_atencion: num(eq.atencion),
    historial: { preventivo, correctivo },
    salud: salud.map((r) => ({ estado: r.estado, n: num(r.n) })),
    eficiencia: totAnio ? Math.round((totPrev / totAnio) * 1000) / 10 : null,
  });
});

module.exports = router;
