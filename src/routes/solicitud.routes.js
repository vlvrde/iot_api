const express  = require('express');
const router   = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { misSolicitudes, historial, crearSolicitud } = require('../controllers/solicitud.controller');

// Todas las rutas requieren token válido + rol cliente
router.use(verificarToken);
router.use(verificarRol('cliente'));

// GET  /api/solicitudes/mis-solicitudes
router.get('/mis-solicitudes', misSolicitudes);

// GET  /api/solicitudes/historial
router.get('/historial', historial);

// POST /api/solicitudes
router.post('/', crearSolicitud);

// Próximas rutas:
// GET  /api/solicitudes/:id          ← detalle de solicitud
// PUT  /api/solicitudes/:id/estado   ← técnico actualiza estado
// PUT  /api/solicitudes/:id/asignar  ← admin asigna técnico

module.exports = router;