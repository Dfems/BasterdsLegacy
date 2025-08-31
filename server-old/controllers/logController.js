// server/controllers/logController.js
const { getLogHistory, streamLogs } = require('../services/logService');

/**
 * GET /api/logs/history?lines=200
 * Restituisce le ultime N righe del log.
 */
async function history(req, res) {
    const lines = parseInt(req.query.lines, 10) || 200;
    try {
        const data = await getLogHistory(lines);
        res.type('text/plain').send(data);
    } catch (err) {
        res.status(500).send('Errore nel recupero dei log: ' + err.message);
    }
}

/**
 * GET /api/logs/stream
 * Apre uno stream SSE con tutte le nuove righe di log.
 */
function stream(req, res) {
    const tailProcess = streamLogs(res);
    req.on('close', () => tailProcess.kill());
}

module.exports = { history, stream };
