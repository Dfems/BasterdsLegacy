// server/services/jwtService.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET, TOKEN_EXPIRY, REFRESH_THRESHOLD_MS } = require('../config/config');

function signToken(payload) {
    const createdAt = Date.now();
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    const { exp } = jwt.decode(token);
    console.log(`🔑 Token for ${payload.username} created at ${new Date(createdAt).toISOString()}`);
    console.log(`⌛ Expires at ${new Date(exp * 1000).toISOString()}`);
    return token;
}

function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken, REFRESH_THRESHOLD_MS };
