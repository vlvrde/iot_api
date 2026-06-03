const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Máquina de estados válidos para el técnico
const TRANSICIONES_VALIDAS = {
  asignado:   ['en_proceso', 'cancelado'],
  en_proceso: ['completado', 'cancelado'],
}

const Tecnico = {

  // ── Citas del técnico ────────────────────────────────────────
  findCitasByTecnico: async (tecnicoId, fecha) => {
    let query = `
      SELECT
        s.id, s.tipo, s.estado, s.descripcion,
        s.fecha_solicitud, s.fecha_estimada,
        s.calle, s.num_exterior, s.num_interior,
        s.codigo_postal, s.colonia, s.delegacion, s.estado_dir,
        s.latitud, s.longitud,
        u.nombre   AS cliente_nombre,
        u.paterno  AS cliente_paterno,
        u.telefono AS cliente_telefono,
        d.tipo     AS dispositivo_tipo,
        d.marca    AS dispositivo_marca,
        d.modelo   AS dispositivo_modelo
      FROM Solicitud s
      INNER JOIN Cliente    c ON c.id = s.cliente_id
      INNER JOIN Usuario    u ON u.id = c.id
      INNER JOIN Dispositivo d ON d.id = s.dispositivo_id
      WHERE s.tecnico_id = ?
        AND s.estado IN ('asignado', 'en_proceso')
    `
    const params = [tecnicoId]

    if (fecha) {
      query += ` AND DATE(s.fecha_estimada) = ?`
      params.push(fecha)
    }

    query += ` ORDER BY s.fecha_estimada ASC`
    const [rows] = await pool.execute(query, params)
    return rows
  },

  // ── Detalle completo de una cita ─────────────────────────────
  findDetalleCita: async (solicitudId, tecnicoId) => {
    const [rows] = await pool.execute(
      `SELECT
         s.id, s.tipo, s.estado, s.descripcion, s.observaciones,
         s.fecha_solicitud, s.fecha_estimada, s.calificacion,
         s.calle, s.num_exterior, s.num_interior,
         s.codigo_postal, s.colonia, s.delegacion, s.estado_dir,
         s.latitud, s.longitud,
         u.nombre   AS cliente_nombre,
         u.paterno  AS cliente_paterno,
         u.telefono AS cliente_telefono,
         d.id       AS dispositivo_id,
         d.tipo     AS dispositivo_tipo,
         d.marca    AS dispositivo_marca,
         d.modelo   AS dispositivo_modelo,
         cd.numero_serie
       FROM Solicitud s
       INNER JOIN Cliente    c  ON c.id = s.cliente_id
       INNER JOIN Usuario    u  ON u.id = c.id
       INNER JOIN Dispositivo d ON d.id = s.dispositivo_id
       LEFT  JOIN Cliente_Dispositivo cd
              ON cd.cliente_id    = s.cliente_id
             AND cd.dispositivo_id = s.dispositivo_id
       WHERE s.id = ? AND s.tecnico_id = ?`,
      [solicitudId, tecnicoId]
    )
    return rows[0] || null
  },

  // ── Actualizar estado (UC-T06) ───────────────────────────────
  actualizarEstado: async (solicitudId, tecnicoId, nuevoEstado) => {
    // 1. Obtener estado actual
    const [rows] = await pool.execute(
      `SELECT estado FROM Solicitud WHERE id = ? AND tecnico_id = ?`,
      [solicitudId, tecnicoId]
    )

    if (!rows[0]) return { ok: false, message: 'Solicitud no encontrada o no asignada a este técnico.' }

    const estadoActual = rows[0].estado
    const permitidos   = TRANSICIONES_VALIDAS[estadoActual] || []

    if (!permitidos.includes(nuevoEstado)) {
      return {
        ok: false,
        message: `Transición inválida: ${estadoActual} → ${nuevoEstado}. Permitidas: ${permitidos.join(', ') || 'ninguna'}.`
      }
    }

    // 2. Actualizar estado
    await pool.execute(
      `UPDATE Solicitud SET estado = ? WHERE id = ?`,
      [nuevoEstado, solicitudId]
    )

    // 3. Registrar en historial
    await pool.execute(
      `INSERT INTO Historial_Estado (id, solicitud_id, estado, actor_id)
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), solicitudId, nuevoEstado, tecnicoId]
    )

    return { ok: true }
  },

  // ── Registrar resultado de intervención (UC-T05) ─────────────
  registrarResultado: async (solicitudId, tecnicoId, { resultado, descripcion_trabajo, materiales, observaciones }) => {
    // Verificar que la solicitud es del técnico y está en proceso
    const [rows] = await pool.execute(
      `SELECT estado FROM Solicitud WHERE id = ? AND tecnico_id = ?`,
      [solicitudId, tecnicoId]
    )

    if (!rows[0]) return { ok: false, message: 'Solicitud no encontrada o no asignada a este técnico.' }
    if (rows[0].estado !== 'en_proceso') {
      return { ok: false, message: 'Solo se puede registrar el resultado de una solicitud en proceso.' }
    }

    // Actualizar solicitud con resultado y marcar como completada
    await pool.execute(
      `UPDATE Solicitud
       SET observaciones = ?, estado = 'completado'
       WHERE id = ?`,
      [
        `[${resultado}] ${descripcion_trabajo}${materiales ? ' | Materiales: ' + materiales : ''}${observaciones ? ' | ' + observaciones : ''}`,
        solicitudId,
      ]
    )

    // Registrar en historial
    await pool.execute(
      `INSERT INTO Historial_Estado (id, solicitud_id, estado, actor_id)
       VALUES (?, ?, 'completado', ?)`,
      [uuidv4(), solicitudId, tecnicoId]
    )

    return { ok: true }
  },

}

module.exports = Tecnico