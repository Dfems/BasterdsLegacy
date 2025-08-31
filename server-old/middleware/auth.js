// server/middleware/auth.js
const { verifyToken, signToken, REFRESH_THRESHOLD_MS } = require('../services/jwtService');

module.exports = (req, res, next) => {
    if (req.path === '/login') return next();
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).end();

    const token = auth.slice(7);
    let payload;
    try {
        payload = verifyToken(token);
    } catch {
        return res.status(401).end();
    }

    const { exp } = require('jsonwebtoken').decode(token);
    const msLeft = exp * 1000 - Date.now();
    if (msLeft < REFRESH_THRESHOLD_MS) {
        const newToken = signToken({ username: payload.username });
        res.setHeader('x-refresh-token', newToken);
    }

    req.user = payload;
    next();
};
