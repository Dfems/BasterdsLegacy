// server/controllers/statusController.js
const { Rcon } = require('rcon-client');
const { MC_RCON_HOST, MC_RCON_PORT, MC_RCON_PASSWORD } = require('../config/config');

/**
 * GET /api/status
 * Ritorna { running: true } se RCON risponde, altrimenti { running: false }.
 */
async function getStatus(req, res) {
    try {
        // Proviamo a connetterci via RCON
        const rcon = await Rcon.connect({
            host: MC_RCON_HOST,
            port: MC_RCON_PORT,
            password: MC_RCON_PASSWORD,
        });
        await rcon.end();
        return res.json({ running: true });
    } catch (err) {
        return res.json({ running: false });
    }
}

module.exports = { getStatus };
