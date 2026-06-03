const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const Compra = {

  crear: async ({
    clienteId,
    items,           // [{ dispositivo_id, precio_unitario, cantidad }]
    precioTotal,
    metodoPago,
    descripcion,
    calle, num_exterior, num_interior,
    codigo_postal, colonia, delegacion, estado_dir,
    latitud, longitud,
  }) => {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      const compraId = uuidv4()

      // 1. Insertar Compra
      await conn.execute(
        `INSERT INTO Compra (id, cliente_id, precio_total, estado, descripcion, metodo_pago)
         VALUES (?, ?, ?, 'confirmada', ?, ?)`,
        [compraId, clienteId, precioTotal, descripcion || null, metodoPago]
      )

      for (const item of items) {
        const { dispositivo_id, precio_unitario, cantidad } = item

        // 2. Insertar Compra_Dispositivo (una fila por tipo, con cantidad)
        await conn.execute(
          `INSERT INTO Compra_Dispositivo (compra_id, dispositivo_id, cantidad, precio_unitario)
           VALUES (?, ?, ?, ?)`,
          [compraId, dispositivo_id, cantidad, precio_unitario]
        )

        // 3. Por cada UNIDAD comprada: registrar dispositivo + solicitud
        for (let i = 0; i < cantidad; i++) {
          // Número de serie único por unidad
          const numeroSerie = `${dispositivo_id.substring(0, 6).toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

          // 3a. Registrar unidad en la cuenta del cliente
          await conn.execute(
            `INSERT INTO Cliente_Dispositivo (cliente_id, dispositivo_id, numero_serie)
             VALUES (?, ?, ?)`,
            [clienteId, dispositivo_id, numeroSerie]
          )

          // 3b. Crear solicitud de instalación por cada unidad
          const solicitudId = uuidv4()
          await conn.execute(
            `INSERT INTO Solicitud (
               id, cliente_id, dispositivo_id, tipo, estado, descripcion,
               calle, num_exterior, num_interior,
               codigo_postal, colonia, delegacion, estado_dir,
               latitud, longitud
             ) VALUES (
               ?, ?, ?, 'instalacion', 'pendiente',
               'Solicitud de instalación generada automáticamente al completar la compra.',
               ?, ?, ?, ?, ?, ?, ?, ?, ?
             )`,
            [
              solicitudId, clienteId, dispositivo_id,
              calle, num_exterior, num_interior || null,
              codigo_postal, colonia, delegacion, estado_dir,
              latitud || null, longitud || null,
            ]
          )

          // 3c. Historial de estado inicial
          await conn.execute(
            `INSERT INTO Historial_Estado (id, solicitud_id, estado, actor_id)
             VALUES (?, ?, 'pendiente', ?)`,
            [uuidv4(), solicitudId, clienteId]
          )
        }
      }

      await conn.commit()

      // Contar total de unidades registradas
      const totalUnidades = items.reduce((sum, i) => sum + i.cantidad, 0)
      return { compraId, totalUnidades }

    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  },

}

module.exports = Compra