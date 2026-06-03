const express = require('express')
const router  = express.Router()
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware')
const { crearCompra } = require('../controllers/compra.controller')

// POST /api/compras — solo clientes autenticados
router.post('/', verificarToken, verificarRol('cliente'), crearCompra)

module.exports = router