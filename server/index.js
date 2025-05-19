require('dotenv').config();
const express     = require('express');
const bodyParser  = require('body-parser');
const bcrypt      = require('bcrypt');
const jwt         = require('jsonwebtoken');
const fs          = require('fs');
const path        = require('path');
const { spawn }    = require('child_process');
const os = require('os');

const app = express();
app.use(bodyParser.json());

// --- Config ---
const HOST        = process.env.BACKEND_HOST || '0.0.0.0';
const PORT        = parseInt(process.env.BACKEND_PORT ?? '4000', 10);
const BASE_URL    = process.env.BACKEND_URL ?? `http://${HOST}:${PORT}`;
const USERS_FILE           = path.join(__dirname, 'users.json');
const JWT_SECRET           = process.env.JWT_SECRET;
const TOKEN_EXPIRY         = process.env.TOKEN_EXPIRY;                 
const REFRESH_THRESHOLD_MS = parseInt(process.env.REFRESH_THRESHOLD_MINUTES, 10) * 60 * 1000;
const OS_TYPE = process.env.OS_TYPE ?? 'linux';
const SHELL_WORK_DIR = process.env.SHELL_WORK_DIR;

// --- Shell persistente ---
const shellCmd = OS_TYPE === 'windows' ? 'powershell.exe' : '/bin/bash';
const shell = spawn(shellCmd, [], {
  cwd: SHELL_WORK_DIR,
  stdio: ['pipe', 'pipe', 'pipe'],
});
shell.stdout.setEncoding('utf-8');
shell.stderr.setEncoding('utf-8');
console.log(`🐚 Spawned shell (${shellCmd}) in ${SHELL_WORK_DIR}`);

// --- Autenticazione & JWT ---
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


// --- Login endpoint ---
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

// --- Middleware JWT & sliding-expiration ---
app.use('/api', (req, res, next) => {
  if (req.path === '/login') return next();

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    console.log('❌ [AUTH] Missing token');
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

  console.log(`⏳ [TIME REMAINING]  for user ${payload.username} ${Math.round(msLeft/1000)}s left`);

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

// --- Streaming /api/console ---
app.post('/api/console', (req, res) => {
  const { command } = req.body;

  // chunked & text
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.flushHeaders();

  const marker = `__CMD_END_${Date.now()}__`;

  const onStdout = chunk => {
    const text = chunk.toString('utf-8');
    if (text.includes(marker)) {
      // scrivo tutto prima del marker, poi chiudo
      const [before] = text.split(marker);
      if (before) res.write(before);
      cleanup();
      return res.end();
    }
    res.write(text);
  };

  const onStdErr = chunk => {
    res.write(chunk.toString('utf-8'));
  };

  const cleanup = () => {
    shell.stdout.off('data', onStdout);
    shell.stderr.off('data', onStdErr);
  };

  shell.stdout.on('data', onStdout);
  shell.stderr.on('data', onStdErr);

  // inietto il comando e poi il marker
  // shell.stdin.write(`${command}\n`);
  // shell.stdin.write(`echo ${marker}\n`);
  shell.stdin.write(`${command}${os.EOL}`);
  const markerCmd = OS_TYPE === 'windows' ? `Write-Output ${marker}` : `echo "${marker}"`;
  shell.stdin.write(`${markerCmd}${os.EOL}`);
});

app.get('/api/profile', (req, res) => {
  res.json({ message: `Benvenuto ${req.user.username}!` });
});

app.listen(PORT, HOST, () => {
  console.log(`🚀 Backend in ascolto su ${BASE_URL}`);
});