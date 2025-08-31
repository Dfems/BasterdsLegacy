// server/index.js
const express = require('express');
const bodyParser = require('body-parser');

const config        = require('./config/config');
const authRouter    = require('./routes/auth');
const consoleRouter = require('./routes/console');
const mcRouter      = require('./routes/minecraft');
const authMiddleware= require('./middleware/auth');
const logRouter    = require('./routes/log');
const statusRouter = require('./routes/status');


const app = express();
app.use(bodyParser.json());

// Public routes
app.use('/api', authRouter);

// Protected
app.use('/api', authMiddleware);
app.use('/api', logRouter);
app.use('/api', statusRouter);
app.use('/api/console', consoleRouter);
app.use('/api', mcRouter);

// Profile endpoint (example)
app.get('/api/profile', (req, res) =>
  res.json({ message: `Benvenuto ${req.user.username}!` })
);

// Avvio
app.listen(config.PORT, config.HOST, () => {
  console.log(`🚀 Listening on http://${config.HOST}:${config.PORT}`);
});
