const Admin = require('../models/admin.model')

// ── GET /api/admin/solicitudes ───────────────────────────────
// Query params opcionales: estado, tipo, delegacion, fecha_desde, fecha_hasta
const getSolicitudes = async (req, res) => {
  try {
    const filtros = {
      estado:      req.query.estado      || null,
      tipo:        req.query.tipo        || null,
      delegacion:  req.query.delegacion  || null,
      fecha_desde: req.query.fecha_desde || null,
      fecha_hasta: req.query.fecha_hasta || null,
    }
    const solicitudes = await Admin.getSolicitudes(filtros)
    return res.status(200).json({ solicitudes })
  } catch (error) {
    console.error('Error en getSolicitudes (admin):', error)
    return res.status(500).json({ message: 'Error interno del servidor.' })
  }
}

// ── GET /api/admin/solicitudes/mapa ─────────────────────────
const getSolicitudesMapa = async (req, res) => {
  try {
    const solicitudes = await Admin.getSolicitudesMapa()
    return res.status(200).json({ solicitudes })
  } catch (error) {
    console.error('Error en getSolicitudesMapa:', error)
    return res.status(500).json({ message: 'Error interno del servidor.' })
  }
}

// ── PUT /api/admin/solicitudes/:id/asignar ───────────────────
// Body: { tecnico_id, fecha_estimada? }
const asignarTecnico = async (req, res) => {
  const { tecnico_id, fecha_estimada } = req.body

  if (!tecnico_id) {
    return res.status(400).json({ message: 'tecnico_id es obligatorio.' })
  }

  try {
    const resultado = await Admin.asignarTecnico(
      req.params.id,
      tecnico_id,
      fecha_estimada || null,
      req.usuario.id
    )

    if (!resultado.ok) {
      return res.status(400).json({ message: resultado.message })
    }

    return res.status(200).json({ message: 'Técnico asignado correctamente.' })
  } catch (error) {
    console.error('Error en asignarTecnico:', error)
    return res.status(500).json({ message: 'Error interno del servidor.' })
  }
}

// ── GET /api/admin/tecnicos ──────────────────────────────────
const getTecnicos = async (req, res) => {
  try {
    const tecnicos = await Admin.getTecnicos()
    return res.status(200).json({ tecnicos })
  } catch (error) {
    console.error('Error en getTecnicos:', error)
    return res.status(500).json({ message: 'Error interno del servidor.' })
  }
}

// ── PUT /api/admin/tecnicos/:id/desactivar ───────────────────
const desactivarTecnico = async (req, res) => {
  try {
    await Admin.desactivarTecnico(req.params.id)
    return res.status(200).json({ message: 'Técnico desactivado. Sus solicitudes asignadas volvieron a pendiente.' })
  } catch (error) {
    console.error('Error en desactivarTecnico:', error)
    return res.status(500).json({ message: 'Error interno del servidor.' })
  }
}

// ── PUT /api/admin/tecnicos/:id/reactivar ────────────────────
const reactivarTecnico = async (req, res) => {
  try {
    await Admin.reactivarTecnico(req.params.id)
    return res.status(200).json({ message: 'Técnico reactivado correctamente.' })
  } catch (error) {
    console.error('Error en reactivarTecnico:', error)
    return res.status(500).json({ message: 'Error interno del servidor.' })
  }
}

// ── GET /api/admin/metricas ──────────────────────────────────
const getMetricas = async (req, res) => {
  try {
    const metricas = await Admin.getMetricas()
    return res.status(200).json({ metricas })
  } catch (error) {
    console.error('Error en getMetricas:', error)
    return res.status(500).json({ message: 'Error interno del servidor.' })
  }
}

module.exports = {
  getSolicitudes,
  getSolicitudesMapa,
  asignarTecnico,
  getTecnicos,
  desactivarTecnico,
  reactivarTecnico,
  getMetricas,
}