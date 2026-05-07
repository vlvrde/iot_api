const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// ── Rutas ────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));

// Aquí irás agregando más rutas:
// app.use('/api/solicitudes', require('./routes/solicitudes.routes'));
// app.use('/api/dispositivos', require('./routes/dispositivos.routes'));
// app.use('/api/admin',        require('./routes/admin.routes'));

module.exports = app;