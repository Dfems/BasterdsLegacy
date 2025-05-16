const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());

const USERS_FILE = path.join(__dirname, 'users.json');
const JWT_SECRET = 'cambia_questa_chiave_con_una_strong_secret';
const TOKEN_EXPIRY = '2h';

// Carica gli utenti da file
function loadUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

// Endpoint di login
app.post('/api/login', async (req, res) => {
  console.log('💥 Login attempt payload:', req.body);
  const { username, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: 'Credenziali errate' });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: 'Credenziali errate' });

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  res.json({ token });
});

// Middleware di protezione
function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).end();
  const token = auth.slice(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).end();
  }
}

// Esempio di rotta protetta
app.get('/api/profile', authenticate, (req, res) => {
  res.json({ message: `Benvenuto ${req.user.username}!` });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend in ascolto su http://localhost:${PORT}`));
