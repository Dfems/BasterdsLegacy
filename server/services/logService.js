// server/services/logService.js
const fs    = require('fs');
const { Tail } = require('tail');
const { LOG_PATH } = require('../config/config');

/**
 * Ritorna le ultime N righe di log.
 * @param {number} lines
 * @returns {Promise<string>}
 */
function getLogHistory(lines = 200) {
    try {
        // Legge tutto il file e prende le ultime `lines` righe
        const data = fs.readFileSync(LOG_PATH, 'utf-8');
        const allLines = data.split(/\r?\n/);
        const selected = allLines.slice(-lines);
        return Promise.resolve(selected.join('\n'));
    } catch (err) {
        return Promise.reject(err);
    }
}

/**
 * Inizia lo streaming SSE delle nuove righe di log
 * @param {Response} res Express response con header già settati
 * @returns {Tail} istanza di Tail, da disattivare con unwatch()
 */
function streamLogs(res) {
    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.flushHeaders?.();

    // Inizializza il tail cross-platform
    const tail = new Tail(LOG_PATH, {
        useWatchFile: true,     // fallback fs.watch o fs.watchFile
        follow: true,
        flushAtEOF: true
    });

    tail.on('line', line => {
        if (line) res.write(`data: ${line}\n\n`);
    });
    tail.on('error', err => console.error('tail error:', err));

    // Cleanup alla chiusura della connessione
    res.on('close', () => tail.unwatch());

    return tail;
}

module.exports = { getLogHistory, streamLogs };
