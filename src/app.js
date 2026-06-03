const express = require('express')
const cors    = require('cors')
require('dotenv').config()

const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// ── Rutas ────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth.routes'))
app.use('/api/solicitudes', require('./routes/solicitud.routes'))
app.use('/api/dispositivos',require('./routes/dispositivo.routes'))
app.use('/api/compras',     require('./routes/compra.routes'))
app.use('/api/tecnico',     require('./routes/tecnico.routes'))
app.use('/api/qr',          require('./routes/qr.routes'))
app.use('/api/admin',       require('./routes/admin.routes'))

module.exports = app