const pool = require('../config/db');

const Usuario = {

  // Buscar usuario por email (login)
  findByEmail: async (email) => {
    const [rows] = await pool.execute(
      'SELECT * FROM Usuario WHERE email = ? AND activo = 1',
      [email]
    );
    return rows[0] || null;
  },

  // Buscar usuario por id
  findById: async (id) => {
    const [rows] = await pool.execute(
      'SELECT id, nombre, paterno, materno, email, telefono, rol, foto FROM Usuario WHERE id = ? AND activo = 1',
      [id]
    );
    return rows[0] || null;
  },

  // Verificar si el email ya existe
  emailExists: async (email) => {
    const [rows] = await pool.execute(
      'SELECT id FROM Usuario WHERE email = ?',
      [email]
    );
    return rows.length > 0;
  },

  // Crear usuario base
  create: async ({ id, nombre, paterno, materno, email, telefono, password, rol }) => {
    await pool.execute(
      `INSERT INTO Usuario (id, nombre, paterno, materno, email, telefono, password, rol)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, nombre, paterno, materno || null, email, telefono || null, password, rol]
    );
  },

};

module.exports = Usuario;