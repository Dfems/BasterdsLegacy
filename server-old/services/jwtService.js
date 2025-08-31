// server/services/jwtService.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET, TOKEN_EXPIRY, REFRESH_THRESHOLD_MS } = require('../config/config');

/**
 * Firma un payload (es. { username }) e restituisce un JWT.
 * Logga anche createdAt ed expiry.
 */
function signToken(payload) {
    const createdAt = Date.now();
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    const { exp } = jwt.decode(token);
    console.log(`🔑 Token for ${payload.username} created at ${new Date(createdAt).toISOString()}`);
    console.log(`⌛ Expires at ${new Date(exp * 1000).toISOString()}`);
    return token;
}

/**
 * Verifica un token JWT e ritorna il payload o lancia un errore.
 */
function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken, REFRESH_THRESHOLD_MS };
