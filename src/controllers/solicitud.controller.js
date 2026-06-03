const Solicitud = require('../models/solicitud.model');
const Dispositivo = require('../models/dispositivo.model');

// ── GET /api/solicitudes/mis-solicitudes ─────────────────────
const misSolicitudes = async (req, res) => {
  try {
    const clienteId = req.usuario.id;
    const solicitudes = await Solicitud.findActivasByCliente(clienteId);
    return res.status(200).json({ solicitudes });
  } catch (error) {
    console.error('Error en misSolicitudes:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// ── GET /api/solicitudes/historial ───────────────────────────
const historial = async (req, res) => {
  try {
    const clienteId = req.usuario.id;
    const solicitudes = await Solicitud.findHistorialByCliente(clienteId);
    return res.status(200).json({ solicitudes });
  } catch (error) {
    console.error('Error en historial:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// ── POST /api/solicitudes ────────────────────────────────────
const crearSolicitud = async (req, res) => {
  const {
    dispositivo_id,
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
  } = req.body;

  try {
    const clienteId = req.usuario.id;

    // 1. Validar campos obligatorios
    if (!dispositivo_id || !tipo || !descripcion ||
        !calle || !num_exterior || !codigo_postal ||
        !colonia || !delegacion || !estado_dir) {
      return res.status(400).json({ message: 'Faltan campos obligatorios.' });
    }

    // 2. Validar tipo de servicio
    const tiposValidos = ['instalacion', 'reparacion', 'falla', 'desinstalacion'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ message: 'Tipo de servicio no válido.' });
    }

    // 3. Verificar que el dispositivo pertenece al cliente
    const dispositivos = await Dispositivo.findByCliente(clienteId);
    const tieneDispositivo = dispositivos.some(d => d.dispositivo_id === dispositivo_id);
    if (!tieneDispositivo) {
      return res.status(403).json({ message: 'El dispositivo no está registrado en tu cuenta.' });
    }

    // 4. Crear la solicitud
    const solicitudId = await Solicitud.create({
      clienteId,
      dispositivoId: dispositivo_id,
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
    });

    return res.status(201).json({
      message: 'Solicitud creada correctamente.',
      solicitud_id: solicitudId,
    });

  } catch (error) {
    console.error('Error en crearSolicitud:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = { misSolicitudes, historial, crearSolicitud };