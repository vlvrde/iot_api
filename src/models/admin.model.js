const pool = require('../config/db')
const { v4: uuidv4 } = require('uuid')

const Admin = {

  // ── Todas las solicitudes con filtros opcionales (UC-A06) ────
  getSolicitudes: async ({ estado, tipo, delegacion, fecha_desde, fecha_hasta } = {}) => {
    let query = `
      SELECT
        s.id, s.tipo, s.estado, s.descripcion,
        s.fecha_solicitud, s.fecha_estimada,
        s.colonia, s.delegacion, s.estado_dir,
        s.latitud, s.longitud,
        uc.nombre  AS cliente_nombre,
        uc.paterno AS cliente_paterno,
        ut.nombre  AS tecnico_nombre,
        ut.paterno AS tecnico_paterno,
        d.tipo     AS dispositivo_tipo,
        d.marca    AS dispositivo_marca,
        d.modelo   AS dispositivo_modelo
      FROM Solicitud s
      INNER JOIN Cliente    c  ON c.id  = s.cliente_id
      INNER JOIN Usuario    uc ON uc.id = c.id
      LEFT  JOIN Tecnico    t  ON t.id  = s.tecnico_id
      LEFT  JOIN Usuario    ut ON ut.id = t.id
      INNER JOIN Dispositivo d  ON d.id  = s.dispositivo_id
      WHERE 1=1
    `
    const params = []

    if (estado)      { query += ` AND s.estado = ?`;                    params.push(estado)      }
    if (tipo)        { query += ` AND s.tipo = ?`;                      params.push(tipo)        }
    if (delegacion)  { query += ` AND s.delegacion = ?`;                params.push(delegacion)  }
    if (fecha_desde) { query += ` AND DATE(s.fecha_solicitud) >= ?`;    params.push(fecha_desde) }
    if (fecha_hasta) { query += ` AND DATE(s.fecha_solicitud) <= ?`;    params.push(fecha_hasta) }

    query += ` ORDER BY s.fecha_solicitud DESC`
    const [rows] = await pool.execute(query, params)
    return rows
  },

  // ── Solicitudes con coords para el mapa (UC-A05) ─────────────
  getSolicitudesMapa: async () => {
    const [rows] = await pool.execute(
      `SELECT
         s.id, s.estado, s.tipo,
         s.latitud, s.longitud,
         s.colonia, s.delegacion,
         d.tipo AS dispositivo_tipo
       FROM Solicitud s
       INNER JOIN Dispositivo d ON d.id = s.dispositivo_id
       WHERE s.estado IN ('pendiente','asignado','en_proceso')
         AND s.latitud IS NOT NULL
         AND s.longitud IS NOT NULL`
    )
    return rows
  },

  // ── Asignar técnico a solicitud (UC-A03) ─────────────────────
  asignarTecnico: async (solicitudId, tecnicoId, fechaEstimada, adminId) => {
    const [rows] = await pool.execute(
      `SELECT estado FROM Solicitud WHERE id = ?`,
      [solicitudId]
    )
    if (!rows[0]) return { ok: false, message: 'Solicitud no encontrada.' }
    if (!['pendiente', 'asignado'].includes(rows[0].estado)) {
      return { ok: false, message: 'Solo se pueden asignar solicitudes pendientes o reasignar asignadas.' }
    }

    await pool.execute(
      `UPDATE Solicitud
       SET tecnico_id = ?, estado = 'asignado', fecha_estimada = ?
       WHERE id = ?`,
      [tecnicoId, fechaEstimada || null, solicitudId]
    )

    await pool.execute(
      `INSERT INTO Historial_Estado (id, solicitud_id, estado, actor_id)
       VALUES (?, ?, 'asignado', ?)`,
      [uuidv4(), solicitudId, adminId]
    )

    return { ok: true }
  },

  // ── Listado de técnicos (UC-A02) ─────────────────────────────
  getTecnicos: async () => {
    const [rows] = await pool.execute(
      `SELECT
         u.id, u.nombre, u.paterno, u.materno,
         u.email, u.telefono, u.foto, u.activo,
         t.delegacion, t.colonia,
         COUNT(s.id) AS solicitudes_activas
       FROM Usuario u
       INNER JOIN Tecnico t ON t.id = u.id
       LEFT JOIN Solicitud s
              ON s.tecnico_id = u.id
             AND s.estado IN ('asignado','en_proceso')
       WHERE u.rol = 'tecnico'
       GROUP BY u.id, u.nombre, u.paterno, u.materno,
                u.email, u.telefono, u.foto, u.activo,
                t.delegacion, t.colonia
       ORDER BY u.activo DESC, u.nombre ASC`
    )
    return rows
  },

  // ── Desactivar técnico — baja lógica (UC-A02) ────────────────
  desactivarTecnico: async (tecnicoId) => {
    // Regresar solicitudes asignadas a pendiente
    await pool.execute(
      `UPDATE Solicitud
       SET tecnico_id = NULL, estado = 'pendiente'
       WHERE tecnico_id = ? AND estado = 'asignado'`,
      [tecnicoId]
    )
    await pool.execute(
      `UPDATE Usuario SET activo = 0 WHERE id = ? AND rol = 'tecnico'`,
      [tecnicoId]
    )
    return { ok: true }
  },

  // ── Reactivar técnico ─────────────────────────────────────────
  reactivarTecnico: async (tecnicoId) => {
    await pool.execute(
      `UPDATE Usuario SET activo = 1 WHERE id = ? AND rol = 'tecnico'`,
      [tecnicoId]
    )
    return { ok: true }
  },

  // ── Métricas del dashboard (UC-A04) ──────────────────────────
  getMetricas: async () => {
    const [[totales]] = await pool.execute(
      `SELECT
         COUNT(*)                        AS total,
         SUM(estado = 'pendiente')       AS pendientes,
         SUM(estado = 'asignado')        AS asignadas,
         SUM(estado = 'en_proceso')      AS en_proceso,
         SUM(estado = 'completado')      AS completadas,
         SUM(estado = 'cancelado')       AS canceladas
       FROM Solicitud`
    )

    const [porDispositivo] = await pool.execute(
      `SELECT d.tipo, COUNT(*) AS total
       FROM Solicitud s
       INNER JOIN Dispositivo d ON d.id = s.dispositivo_id
       GROUP BY d.tipo`
    )

    const [porTecnico] = await pool.execute(
      `SELECT
         u.nombre, u.paterno,
         COUNT(s.id)                                AS total_servicios,
         SUM(s.estado = 'completado')               AS completados,
         SUM(s.estado IN ('asignado','en_proceso'))  AS activos
       FROM Usuario u
       INNER JOIN Tecnico   t ON t.id = u.id
       LEFT  JOIN Solicitud s ON s.tecnico_id = u.id
       WHERE u.activo = 1
       GROUP BY u.id, u.nombre, u.paterno
       ORDER BY completados DESC`
    )

    const [porAlcaldia] = await pool.execute(
      `SELECT delegacion, COUNT(*) AS total
       FROM Solicitud
       GROUP BY delegacion
       ORDER BY total DESC
       LIMIT 10`
    )

    return { totales, porDispositivo, porTecnico, porAlcaldia }
  },

}

module.exports = Admin