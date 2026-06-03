const pool   = require('../config/db')
const crypto = require('crypto')
const { v4: uuidv4 } = require('uuid')

const QR = {

  // ── Generar código QR (UC-T04) ───────────────────────────────
  // Crea o reemplaza el QR activo de una solicitud.
  generar: async (solicitudId, tecnicoId) => {
    // 1. Verificar que la solicitud existe y está asignada al técnico
    const [rows] = await pool.execute(
      `SELECT estado FROM Solicitud WHERE id = ? AND tecnico_id = ?`,
      [solicitudId, tecnicoId]
    )

    if (!rows[0]) {
      return { ok: false, message: 'Solicitud no encontrada o no asignada a este técnico.' }
    }

    if (!['asignado', 'en_proceso'].includes(rows[0].estado)) {
      return { ok: false, message: 'Solo se puede generar QR para solicitudes asignadas o en proceso.' }
    }

    // 2. Construir payload y firmarlo con HMAC-SHA256
    const expiracion    = new Date(Date.now() + 30 * 60 * 1000) // +30 min
    const payload       = `${tecnicoId}:${solicitudId}:${expiracion.getTime()}`
    const tokenHash     = crypto
      .createHmac('sha256', process.env.JWT_SECRET)
      .update(payload)
      .digest('hex')

    // El token que se incrusta en el QR incluye el payload + hash
    // para que el backend pueda verificar sin consultar DB primero
    const tokenQR = Buffer.from(JSON.stringify({
      tecnico_id:   tecnicoId,
      solicitud_id: solicitudId,
      exp:          expiracion.getTime(),
      hash:         tokenHash,
    })).toString('base64')

    // 3. Guardar / reemplazar en BD (un solo QR activo por solicitud)
    await pool.execute(
      `INSERT INTO Codigo_QR (id, solicitud_id, tecnico_id, token_hash, used, fecha_activacion, fecha_expiracion)
       VALUES (?, ?, ?, ?, 0, NOW(), ?)
       ON DUPLICATE KEY UPDATE
         token_hash       = VALUES(token_hash),
         used             = 0,
         fecha_activacion = NOW(),
         fecha_expiracion = VALUES(fecha_expiracion)`,
      [uuidv4(), solicitudId, tecnicoId, tokenHash, expiracion]
    )

    return { ok: true, token: tokenQR, expiracion }
  },

  // ── Validar código QR (UC-C06) ───────────────────────────────
  validar: async (tokenQR) => {
    // 1. Decodificar el token
    let payload
    try {
      payload = JSON.parse(Buffer.from(tokenQR, 'base64').toString('utf8'))
    } catch {
      return { ok: false, message: 'Código QR inválido.' }
    }

    const { tecnico_id, solicitud_id, exp, hash } = payload

    if (!tecnico_id || !solicitud_id || !exp || !hash) {
      return { ok: false, message: 'Código QR con formato incorrecto.' }
    }

    // 2. Verificar expiración
    if (Date.now() > exp) {
      return { ok: false, message: 'El código QR ha expirado. Pide al técnico que genere uno nuevo.' }
    }

    // 3. Verificar firma HMAC
    const expectedHash = crypto
      .createHmac('sha256', process.env.JWT_SECRET)
      .update(`${tecnico_id}:${solicitud_id}:${exp}`)
      .digest('hex')

    if (hash !== expectedHash) {
      return { ok: false, message: 'Firma del código QR inválida. Posible falsificación.' }
    }

    // 4. Verificar en BD: existe, no usado, no expirado
    const [rows] = await pool.execute(
      `SELECT id, used, fecha_expiracion
       FROM Codigo_QR
       WHERE solicitud_id = ? AND tecnico_id = ? AND token_hash = ?`,
      [solicitud_id, tecnico_id, hash]
    )

    if (!rows[0]) {
      return { ok: false, message: 'Código QR no encontrado en el sistema.' }
    }

    if (rows[0].used) {
      return { ok: false, message: 'Este código QR ya fue utilizado.' }
    }

    if (new Date(rows[0].fecha_expiracion) < new Date()) {
      return { ok: false, message: 'El código QR ha expirado.' }
    }

    // 5. Marcar como usado (un solo uso)
    await pool.execute(
      `UPDATE Codigo_QR SET used = 1 WHERE id = ?`,
      [rows[0].id]
    )

    // 6. Obtener datos del técnico para mostrar al cliente
    const [tecnico] = await pool.execute(
      `SELECT u.nombre, u.paterno, u.foto
       FROM Usuario u WHERE u.id = ?`,
      [tecnico_id]
    )

    return {
      ok:          true,
      tecnico:     tecnico[0] || null,
      solicitud_id,
    }
  },

}

module.exports = QR