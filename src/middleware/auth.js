const jwt = require('jsonwebtoken');

// RF-02: autenticación con JWT
function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// RNF-01: control de acceso basado en roles (RBAC)
const permitir = (...roles) => (req, res, next) =>
  roles.includes(req.usuario.rol)
    ? next()
    : res.status(403).json({ error: 'No tiene permisos para esta acción' });

module.exports = { autenticar, permitir };
