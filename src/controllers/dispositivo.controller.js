const Dispositivo = require('../models/dispositivo.model');

// ── GET /api/dispositivos/mis-dispositivos ───────────────────
const misDispositivos = async (req, res) => {
  try {
    const clienteId = req.usuario.id;
    const dispositivos = await Dispositivo.findByCliente(clienteId);
    return res.status(200).json({ dispositivos });
  } catch (error) {
    console.error('Error en misDispositivos:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// ── GET /api/dispositivos ────────────────────────────────────
const catalogo = async (req, res) => {
  try {
    const dispositivos = await Dispositivo.findAll();
    return res.status(200).json({ dispositivos });
  } catch (error) {
    console.error('Error en catalogo:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// ── GET /api/dispositivos/:id ────────────────────────────────
const detalle = async (req, res) => {
  try {
    const dispositivo = await Dispositivo.findById(req.params.id);
    if (!dispositivo) {
      return res.status(404).json({ message: 'Dispositivo no encontrado.' });
    }
    return res.status(200).json({ dispositivo });
  } catch (error) {
    console.error('Error en detalle:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// ── POST /api/dispositivos/registrar ────────────────────────
// Vincula un dispositivo del catálogo a la cuenta del cliente
// mediante su número de serie físico.
const registrarDispositivo = async (req, res) => {
  const { dispositivo_id, numero_serie } = req.body;

  try {
    const clienteId = req.usuario.id;

    // 1. Validar campos
    if (!dispositivo_id || !numero_serie) {
      return res.status(400).json({ message: 'dispositivo_id y numero_serie son obligatorios.' });
    }

    // 2. Verificar que el dispositivo existe en el catálogo
    const dispositivo = await Dispositivo.findById(dispositivo_id);
    if (!dispositivo) {
      return res.status(404).json({ message: 'Dispositivo no encontrado en el catálogo.' });
    }

    // 3. Verificar que el número de serie no esté ya registrado
    const serieOcupada = await Dispositivo.serieExists(numero_serie);
    if (serieOcupada) {
      return res.status(409).json({ message: 'El número de serie ya está registrado.' });
    }

    // 4. Registrar en la cuenta del cliente
    await Dispositivo.registrarEnCuenta(clienteId, dispositivo_id, numero_serie);

    return res.status(201).json({
      message: 'Dispositivo registrado correctamente en tu cuenta.',
      dispositivo: {
        dispositivo_id,
        numero_serie,
        marca:  dispositivo.marca,
        modelo: dispositivo.modelo,
        tipo:   dispositivo.tipo,
      }
    });

  } catch (error) {
    console.error('Error en registrarDispositivo:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = { misDispositivos, catalogo, detalle, registrarDispositivo };