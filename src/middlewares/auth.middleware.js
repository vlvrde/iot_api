const jwt = require('jsonwebtoken');

// ── Verificar token JWT ──────────────────────────────────────
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, rol }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

// ── Verificar rol (RBAC) ─────────────────────────────────────
// Uso: verificarRol('admin') o verificarRol('admin', 'tecnico')
const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ message: 'No autenticado.' });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ message: 'No tienes permisos para esta acción.' });
    }

    next();
  };
};

module.exports = { verificarToken, verificarRol };