const pool = require('../config/db');

const Dispositivo = {

  // ── Dispositivos registrados por el cliente ──────────────────
  findByCliente: async (clienteId) => {
    const [rows] = await pool.execute(
      `SELECT
         cd.dispositivo_id,
         cd.numero_serie,
         cd.fecha_registro,
         d.marca,
         d.modelo,
         d.tipo,
         d.precio
       FROM Cliente_Dispositivo cd
       INNER JOIN Dispositivo d ON d.id = cd.dispositivo_id
       WHERE cd.cliente_id = ?
       ORDER BY cd.fecha_registro DESC`,
      [clienteId]
    );
    return rows;
  },

  // ── Catálogo completo ────────────────────────────────────────
  findAll: async () => {
    const [rows] = await pool.execute(
      `SELECT id, marca, modelo, tipo, precio
       FROM Dispositivo
       ORDER BY tipo, marca`
    );
    return rows;
  },

  // ── Detalle de un dispositivo ────────────────────────────────
  findById: async (id) => {
    const [rows] = await pool.execute(
      `SELECT id, marca, modelo, tipo, precio
       FROM Dispositivo
       WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  // ── Verificar si el número de serie ya existe ────────────────
  serieExists: async (numeroSerie) => {
    const [rows] = await pool.execute(
      `SELECT numero_serie FROM Cliente_Dispositivo WHERE numero_serie = ?`,
      [numeroSerie]
    );
    return rows.length > 0;
  },

  // ── Registrar dispositivo en la cuenta del cliente ───────────
  registrarEnCuenta: async (clienteId, dispositivoId, numeroSerie) => {
    await pool.execute(
      `INSERT INTO Cliente_Dispositivo (cliente_id, dispositivo_id, numero_serie)
       VALUES (?, ?, ?)`,
      [clienteId, dispositivoId, numeroSerie]
    );
  },

};

module.exports = Dispositivo;