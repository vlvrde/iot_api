const express = require('express')
const router  = express.Router()
const { verificarToken, verificarRol }                           = require('../middlewares/auth.middleware')
const { getCitas, getDetalleCita, actualizarEstado, registrarResultado } = require('../controllers/tecnico.controller')

router.use(verificarToken)
router.use(verificarRol('tecnico'))

// GET  /api/tecnico/citas
router.get('/citas',              getCitas)

// GET  /api/tecnico/citas/:id
router.get('/citas/:id',          getDetalleCita)

// PUT  /api/tecnico/citas/:id/estado
router.put('/citas/:id/estado',   actualizarEstado)

// PUT  /api/tecnico/citas/:id/resultado
router.put('/citas/:id/resultado', registrarResultado)

module.exports = router