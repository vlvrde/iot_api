const express = require('express')
const router  = express.Router()
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware')
const { generarQR, validarQR }         = require('../controllers/qr.controller')

// POST /api/qr/generar — solo técnicos
router.post('/generar',
  verificarToken,
  verificarRol('tecnico'),
  generarQR
)

// POST /api/qr/validar — solo clientes
router.post('/validar',
  verificarToken,
  verificarRol('cliente'),
  validarQR
)

module.exports = router