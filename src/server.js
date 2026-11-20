
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

// Configuración de CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ]
}));

// Permitir solicitudes JSON
app.use(express.json());

// Verificar estado del servidor
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// RF-01 y RF-02: usuarios e inicio de sesión
app.use('/api/auth', require('./routes/auth'));

// RF-03: recuperación de contraseña
app.use('/api/auth', require('./routes/recuperacion'));

// RF-04, RF-05 y RF-06: equipos e inventario
app.use('/api/equipos', require('./routes/equipos'));

// RF-07, RF-08 y RF-09: mantenimientos y fallas
app.use('/api/mantenimientos', require('./routes/mantenimientos'));

// RF-12: dashboard de indicadores
app.use('/api/dashboard', require('./routes/dashboard'));

// Manejo general de errores
app.use((err, _req, res, _next) => {
  console.error(err);

  res.status(500).json({
    error: 'Error interno del servidor'
  });
});

// Puerto del servidor
const PORT = process.env.PORT || 3000;

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`SIGEM API en http://localhost:${PORT}`);
});
