const Compra      = require('../models/compra.model')
const Dispositivo = require('../models/dispositivo.model')

// ── POST /api/compras ────────────────────────────────────────
const crearCompra = async (req, res) => {
  const {
    items,
    metodo_pago,
    descripcion,
    calle, num_exterior, num_interior,
    codigo_postal, colonia, delegacion, estado_dir,
    latitud, longitud,
  } = req.body

  try {
    const clienteId = req.usuario.id

    // 1. Validar campos obligatorios
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'El carrito está vacío.' })
    }
    if (!metodo_pago || !calle || !num_exterior || !codigo_postal || !colonia || !delegacion || !estado_dir) {
      return res.status(400).json({ message: 'Faltan campos obligatorios.' })
    }
    if (!['tarjeta', 'transferencia'].includes(metodo_pago)) {
      return res.status(400).json({ message: 'Método de pago no válido.' })
    }

    // 2. Obtener precios del catálogo (no confiar en el frontend)
    let precioTotal = 0
    const itemsConPrecio = []

    for (const item of items) {
      const dispositivo = await Dispositivo.findById(item.dispositivo_id)
      if (!dispositivo) {
        return res.status(404).json({ message: `Dispositivo ${item.dispositivo_id} no encontrado.` })
      }
      const cantidad = item.cantidad || 1
      const precio   = parseFloat(dispositivo.precio)
      precioTotal   += precio * cantidad * 1.16

      itemsConPrecio.push({
        dispositivo_id:  item.dispositivo_id,
        precio_unitario: precio,
        cantidad,
      })
    }

    precioTotal = Math.round(precioTotal * 100) / 100

    // 3. Crear compra en transacción
    const { compraId, totalUnidades } = await Compra.crear({
      clienteId,
      items: itemsConPrecio,
      precioTotal,
      metodoPago: metodo_pago,
      descripcion,
      calle, num_exterior, num_interior,
      codigo_postal, colonia, delegacion, estado_dir,
      latitud, longitud,
    })

    return res.status(201).json({
      message: `Compra realizada. Se generaron ${totalUnidades} solicitud${totalUnidades !== 1 ? 'es' : ''} de instalación.`,
      compra_id:            compraId,
      precio_total:         precioTotal,
      solicitudes_generadas: totalUnidades,
    })

  } catch (error) {
    console.error('Error en crearCompra:', error)
    return res.status(500).json({ message: 'Error interno del servidor.' })
  }
}

module.exports = { crearCompra }