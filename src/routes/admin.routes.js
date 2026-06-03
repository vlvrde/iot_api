const express = require('express')
const router  = express.Router()
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware')
const {
  getSolicitudes,
  getSolicitudesMapa,
  asignarTecnico,
  getTecnicos,
  desactivarTecnico,
  reactivarTecnico,
  getMetricas,
} = require('../controllers/admin.controller')

// Todas las rutas requieren token + rol administrador
router.use(verificarToken)
router.use(verificarRol('administrador'))

// ── Solicitudes ──────────────────────────────────────────────
// IMPORTANTE: /mapa debe ir antes de /:id para evitar conflicto
router.get('/solicitudes/mapa',        getSolicitudesMapa)
router.get('/solicitudes',             getSolicitudes)
router.put('/solicitudes/:id/asignar', asignarTecnico)

// ── Técnicos ─────────────────────────────────────────────────
router.get('/tecnicos',                  getTecnicos)
router.put('/tecnicos/:id/desactivar',   desactivarTecnico)
router.put('/tecnicos/:id/reactivar',    reactivarTecnico)

// ── Métricas ─────────────────────────────────────────────────
router.get('/metricas', getMetricas)

module.exports = router