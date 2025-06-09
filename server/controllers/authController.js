// server/controllers/authController.js
const bcrypt = require('bcrypt');
const { loadUsers } = require('../services/userService');
const { signToken } = require('../services/jwtService');

async function login(req, res) {
    const { username, password } = req.body;
    const users = loadUsers();
    const user  = users.find(u => u.username === username);
    if (!user) return res.status(401).json({ error:'Credenziali errate' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error:'Credenziali errate' });

    const token = signToken({ username });
    res.json({ token });
}

module.exports = { login };
