const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool      = require('../config/db');
const Usuario   = require('../models/usuario.model');

// ── POST /api/auth/register ──────────────────────────────────
const register = async (req, res) => {
  const { nombre, paterno, materno, email, telefono, password, rol,
          // Campos de dirección para cliente/técnico
          calle, num_exterior, num_interior, codigo_postal, colonia, delegacion, estado } = req.body;

  try {
    // 1. Validar campos obligatorios
    if (!nombre || !paterno || !email || !password || !rol) {
      return res.status(400).json({ message: 'Faltan campos obligatorios.' });
    }

    // 2. Verificar roles válidos
    const rolesValidos = ['cliente', 'tecnico', 'administrador'];
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({ message: 'Rol no válido.' });
    }

    // 3. Verificar que el email no exista
    const existe = await Usuario.emailExists(email);
    if (existe) {
      return res.status(409).json({ message: 'El correo ya está registrado.' });
    }

    // 4. Hash de la contraseña
    const hash = await bcrypt.hash(password, 12);

    // 5. Generar UUID
    const id = uuidv4();

    // 6. Insertar en Usuario
    await Usuario.create({ id, nombre, paterno, materno, email, telefono, password: hash, rol });

    // 7. Insertar en sub entidad según rol
    if (rol === 'cliente') {
      if (!calle || !num_exterior || !codigo_postal || !colonia || !delegacion || !estado) {
        return res.status(400).json({ message: 'Faltan datos de domicilio del cliente.' });
      }
      await pool.execute(
        `INSERT INTO Cliente (id, calle, num_exterior, num_interior, codigo_postal, colonia, delegacion, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, calle, num_exterior, num_interior || null, codigo_postal, colonia, delegacion, estado]
      );
    }

    if (rol === 'tecnico') {
      if (!calle || !num_exterior || !codigo_postal || !colonia || !delegacion || !estado) {
        return res.status(400).json({ message: 'Faltan datos de domicilio del técnico.' });
      }
      await pool.execute(
        `INSERT INTO Tecnico (id, calle, num_exterior, num_interior, codigo_postal, colonia, delegacion, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, calle, num_exterior, num_interior || null, codigo_postal, colonia, delegacion, estado]
      );
    }

    if (rol === 'administrador') {
      await pool.execute(
        'INSERT INTO Administrador (id, acceso) VALUES (?, 1)',
        [id]
      );
    }

    // 8. Generar JWT
    const token = jwt.sign(
      { id, rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      message: 'Usuario registrado correctamente.',
      token,
      usuario: { id, nombre, paterno, email, rol }
    });

  } catch (error) {
    console.error('Error en register:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// ── POST /api/auth/login ─────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Validar campos
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
    }

    // 2. Buscar usuario
    const usuario = await Usuario.findByEmail(email);
    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    // 3. Verificar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    // 4. Generar JWT
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token,
      usuario: {
        id:      usuario.id,
        nombre:  usuario.nombre,
        paterno: usuario.paterno,
        email:   usuario.email,
        rol:     usuario.rol,
        foto:    usuario.foto,
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = { register, login };