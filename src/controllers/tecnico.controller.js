const Tecnico = require('../models/tecnico.model')

// ── GET /api/tecnico/citas ───────────────────────────────────
const getCitas = async (req, res) => {
  try {
    const tecnicoId = req.usuario.id
    const fecha     = req.query.fecha || null
    const citas     = await Tecnico.findCitasByTecnico(tecnicoId, fecha)
    return res.status(200).json({ citas })
  } catch (error) {
    console.error('Error en getCitas:', error)
    return res.status(500).json({ message: 'Error interno del servidor.' })
  }
}

// ── GET /api/tecnico/citas/:id ───────────────────────────────
const getDetalleCita = async (req, res) => {
  try {
    const cita = await Tecnico.findDetalleCita(req.params.id, req.usuario.id)
    if (!cita) return res.status(404).json({ message: 'Cita no encontrada.' })
    return res.status(200).json({ cita })
  } catch (error) {
    console.error('Error en getDetalleCita:', error)
    return res.status(500).json({ message: 'Error interno del servidor.' })
  }
}

// ── PUT /api/tecnico/citas/:id/estado ────────────────────────
// Body: { estado: 'en_proceso' | 'completado' | 'cancelado' }
const actualizarEstado = async (req, res) => {
  const { estado } = req.body

  if (!estado) {
    return res.status(400).json({ message: 'El campo estado es obligatorio.' })
  }

  try {
    const resultado = await Tecnico.actualizarEstado(req.params.id, req.usuario.id, estado)

    if (!resultado.ok) {
      return res.status(400).json({ message: resultado.message })
    }

    return res.status(200).json({ message: `Estado actualizado a "${estado}" correctamente.` })

  } catch (error) {
    console.error('Error en actualizarEstado:', error)
    return res.status(500).json({ message: 'Error interno del servidor.' })
  }
}

// ── PUT /api/tecnico/citas/:id/resultado ─────────────────────
// Body: { resultado, descripcion_trabajo, materiales?, observaciones? }
const registrarResultado = async (req, res) => {
  const { resultado, descripcion_trabajo, materiales, observaciones } = req.body

  if (!resultado || !descripcion_trabajo) {
    return res.status(400).json({ message: 'resultado y descripcion_trabajo son obligatorios.' })
  }

  const resultadosValidos = ['resuelto', 'requiere_seguimiento', 'no_resuelto']
  if (!resultadosValidos.includes(resultado)) {
    return res.status(400).json({ message: `resultado debe ser: ${resultadosValidos.join(', ')}.` })
  }

  try {
    const resp = await Tecnico.registrarResultado(
      req.params.id,
      req.usuario.id,
      { resultado, descripcion_trabajo, materiales, observaciones }
    )

    if (!resp.ok) return res.status(400).json({ message: resp.message })

    return res.status(200).json({ message: 'Resultado registrado. Solicitud marcada como completada.' })

  } catch (error) {
    console.error('Error en registrarResultado:', error)
    return res.status(500).json({ message: 'Error interno del servidor.' })
  }
}

module.exports = { getCitas, getDetalleCita, actualizarEstado, registrarResultado }