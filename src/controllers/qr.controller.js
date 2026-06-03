const QR = require('../models/qr.model')

// ── POST /api/qr/generar ─────────────────────────────────────
// Solo técnicos. Body: { solicitud_id }
const generarQR = async (req, res) => {
  const { solicitud_id } = req.body

  if (!solicitud_id) {
    return res.status(400).json({ message: 'solicitud_id es obligatorio.' })
  }

  try {
    const resultado = await QR.generar(solicitud_id, req.usuario.id)

    if (!resultado.ok) {
      return res.status(400).json({ message: resultado.message })
    }

    return res.status(201).json({
      message:    'Código QR generado. Válido por 30 minutos.',
      token:      resultado.token,
      expiracion: resultado.expiracion,
    })

  } catch (error) {
    console.error('Error en generarQR:', error)
    return res.status(500).json({ message: 'Error interno del servidor.' })
  }
}

// ── POST /api/qr/validar ─────────────────────────────────────
// Solo clientes. Body: { token }
const validarQR = async (req, res) => {
  const { token } = req.body

  if (!token) {
    return res.status(400).json({ message: 'token es obligatorio.' })
  }

  try {
    const resultado = await QR.validar(token)

    if (!resultado.ok) {
      return res.status(400).json({ message: resultado.message })
    }

    return res.status(200).json({
      message:     '¡Técnico verificado exitosamente!',
      tecnico:     resultado.tecnico,
      solicitud_id: resultado.solicitud_id,
    })

  } catch (error) {
    console.error('Error en validarQR:', error)
    return res.status(500).json({ message: 'Error interno del servidor.' })
  }
}

module.exports = { generarQR, validarQR }