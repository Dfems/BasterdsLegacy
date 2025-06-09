// server/services/logService.js
const { spawn } = require('child_process');
const { LOG_PATH } = require('../config/config');

/**
 * Ritorna le ultime N righe di log.
 * @param {number} lines
 * @returns {Promise<string>}
 */
function getLogHistory(lines = 200) {
    return new Promise((resolve, reject) => {
        const tail = spawn('tail', ['-n', String(lines), LOG_PATH]);
        let output = '';
        tail.stdout.on('data', chunk => output += chunk.toString());
        tail.stderr.on('data', err => console.error('tail error:', err.toString()));
        tail.on('close', code => {
        if (code !== 0) return reject(new Error(`tail exited with ${code}`));
        resolve(output);
        });
    });
}

/**
 * Inizia lo streaming SSE delle nuove righe di log
 * @param {Response} res Express response con header già settati
 * @returns {ChildProcess} il processo tail -F
 */
function streamLogs(res) {
    // Imposta header SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.flushHeaders?.();

    const tail = spawn('tail', ['-F', LOG_PATH]);
    tail.stdout.on('data', chunk => {
        const lines = chunk.toString().split(/\r?\n/);
        for (const line of lines) {
        if (line) res.write(`data: ${line}\n\n`);
        }
    });
    tail.stderr.on('data', err => console.error('tail -F error:', err.toString()));
    return tail;
}

module.exports = { getLogHistory, streamLogs };
