const express  = require('express');
const router   = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { misDispositivos, catalogo, detalle, registrarDispositivo } = require('../controllers/dispositivo.controller');

// ── Rutas protegidas (específicas ANTES que /:id) ────────────
// GET  /api/dispositivos/mis-dispositivos
router.get('/mis-dispositivos', verificarToken, verificarRol('cliente'), misDispositivos);

// POST /api/dispositivos/registrar
router.post('/registrar', verificarToken, verificarRol('cliente'), registrarDispositivo);

// ── Rutas públicas ───────────────────────────────────────────
// GET /api/dispositivos
router.get('/', catalogo);

// GET /api/dispositivos/:id
router.get('/:id', detalle);

module.exports = router;