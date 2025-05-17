// server/index.js
const express     = require('express');
const bodyParser  = require('body-parser');
const bcrypt      = require('bcrypt');
const jwt         = require('jsonwebtoken');
const fs          = require('fs');
const path        = require('path');
const { exec }    = require('child_process');

const app = express();
app.use(bodyParser.json());

const USERS_FILE           = path.join(__dirname, 'users.json');
const JWT_SECRET           = 'cambia_questa_chiave_con_una_strong_secret';
const TOKEN_EXPIRY         = '2h';                   // 2 ore
const REFRESH_THRESHOLD_MS = 15 * 60 * 1000;         // 15 minuti

function loadUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

// Genera e logga i dettagli del token con l'username
function signToken(payload) {
  const createdAt = Date.now();
  const token     = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  const decoded   = jwt.decode(token);
  const expiresAt = decoded.exp * 1000;

  console.log(`🗝️  [TOKEN CREATED] for user ${payload.username} at ${new Date(createdAt).toISOString()}`);
  console.log(`⌛ [TOKEN EXPIRES] for user ${payload.username} at ${new Date(expiresAt).toISOString()}`);

  return token;
}

// Login endpoint
app.post('/api/login', async (req, res) => {
  console.log('🔐 Login attempt:', req.body);
  const { username, password } = req.body;
  const users = loadUsers();
  const user  = users.find(u => u.username === username);

  if (!user) {
    console.log(`⚠️  [LOGIN FAILED] for user ${username} not found`);
    return res.status(401).json({ error: 'Credenziali errate' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    console.log(`⚠️  [LOGIN FAILED] for user ${username} password mismatch`);
    return res.status(401).json({ error: 'Credenziali errate' });
  }

  const token = signToken({ username });
  return res.json({ token });
});

// Middleware di autenticazione + sliding-expiration
app.use('/api', (req, res, next) => {
  if (req.path === '/login') return next();

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    console.log('❌  [AUTH] Missing token');
    return res.status(401).end();
  }

  const token = auth.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.log(`⏱️  [AUTH] for user ${payload?.username ?? 'unknown'} token invalid/expired: ${err.message}`);
    return res.status(401).end();
  }

  // Calcolo tempo residuo
  const decoded   = jwt.decode(token);
  const expiresAt = decoded.exp * 1000;
  const msLeft    = expiresAt - Date.now();

  console.log(`⏳  [TIME REMAINING]  for user ${payload.username} ${Math.round(msLeft/1000)}s left`);

  // Se entro la soglia, rigeneriamo
  if (msLeft < REFRESH_THRESHOLD_MS) {
    console.log(`⚡  [NEAR EXPIRY] for user ${payload.username} less than ${REFRESH_THRESHOLD_MS/1000}s left`);
    const newToken     = signToken({ username: payload.username });
    const newDecoded   = jwt.decode(newToken);
    const newExpiresAt = newDecoded.exp * 1000;

    console.log(`🔄  [TOKEN REFRESHED] for user ${payload.username} at ${new Date().toISOString()}`);
    console.log(`⌛  [NEW EXPIRES AT] for${payload.username} at ${new Date(newExpiresAt).toISOString()}`);

    res.setHeader('x-refresh-token', newToken);
  }

  req.user = payload;
  next();
});

// Dopo il tuo middleware "app.use('/api', ...)" e prima della rot­ta /api/profile
app.post('/api/console', (req, res) => {
  const { command } = req.body;

  console.log(`💻 [CONSOLE] for user ${req.user.username} running: ${command}`);

  // Esegui il comando nella shell
  exec(command, { shell: '/bin/bash', timeout: 60_000 }, (err, stdout, stderr) => {
    if (err) {
      console.log(`❌ [CONSOLE ERROR] for user ${req.user.username}`, err);
      // Includi stdout e stderr nell’errore per il debug
      return res.status(500).json({
        error: err.message,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    }
    console.log(`✅ [CONSOLE OUTPUT] for user ${req.user.username}\n${stdout}`);
    // Ritorna semplicemente tutto lo stdout
    return res.send(stdout);
  });
});


// Rotta di test protetta
app.get('/api/profile', (req, res) => {
  res.json({ message: `Benvenuto ${req.user.username}!` });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend CommonJS in ascolto su http://localhost:${PORT}`);
});
