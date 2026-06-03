const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const Solicitud = {

  // ── Solicitudes activas del cliente (pendiente, asignado, en_proceso) ──
  findActivasByCliente: async (clienteId) => {
    const [rows] = await pool.execute(
      `SELECT
         s.id,
         s.tipo,
         s.estado,
         s.descripcion,
         s.fecha_solicitud,
         s.fecha_estimada,
         s.colonia,
         s.delegacion,
         s.calificacion,
         u.nombre   AS tecnico_nombre,
         u.paterno  AS tecnico_paterno,
         u.foto     AS tecnico_foto
       FROM Solicitud s
       LEFT JOIN Tecnico  t ON t.id = s.tecnico_id
       LEFT JOIN Usuario  u ON u.id = t.id
       WHERE s.cliente_id = ?
         AND s.estado NOT IN ('completado', 'cancelado')
       ORDER BY s.fecha_solicitud DESC`,
      [clienteId]
    );
    return rows;
  },

  // ── Historial: solicitudes completadas o canceladas del cliente ──────
  findHistorialByCliente: async (clienteId) => {
    const [rows] = await pool.execute(
      `SELECT
         s.id,
         s.tipo,
         s.estado,
         s.descripcion,
         s.observaciones,
         s.fecha_solicitud,
         s.fecha_estimada,
         s.colonia,
         s.delegacion,
         s.calificacion,
         u.nombre   AS tecnico_nombre,
         u.paterno  AS tecnico_paterno
       FROM Solicitud s
       LEFT JOIN Tecnico  t ON t.id = s.tecnico_id
       LEFT JOIN Usuario  u ON u.id = t.id
       WHERE s.cliente_id = ?
         AND s.estado IN ('completado', 'cancelado')
       ORDER BY s.fecha_solicitud DESC`,
      [clienteId]
    );
    return rows;
  },

  // ── Crear nueva solicitud ────────────────────────────────────
  create: async ({
    clienteId,
    dispositivoId,
    tipo,
    descripcion,
    calle,
    num_exterior,
    num_interior,
    codigo_postal,
    colonia,
    delegacion,
    estado_dir,
    latitud,
    longitud,
  }) => {
    const id = uuidv4();
    await pool.execute(
      `INSERT INTO Solicitud (
         id, cliente_id, dispositivo_id, tipo, descripcion,
         calle, num_exterior, num_interior,
         codigo_postal, colonia, delegacion, estado_dir,
         latitud, longitud, estado
       ) VALUES (
         ?, ?, ?, ?, ?,
         ?, ?, ?,
         ?, ?, ?, ?,
         ?, ?, 'pendiente'
       )`,
      [
        id, clienteId, dispositivoId, tipo, descripcion,
        calle, num_exterior, num_interior || null,
        codigo_postal, colonia, delegacion, estado_dir,
        latitud || null, longitud || null,
      ]
    );

    // Registrar en historial de estados
    await pool.execute(
      `INSERT INTO Historial_Estado (id, solicitud_id, estado, actor_id)
       VALUES (?, ?, 'pendiente', ?)`,
      [uuidv4(), id, clienteId]
    );

    return id;
  },

};

module.exports = Solicitud;