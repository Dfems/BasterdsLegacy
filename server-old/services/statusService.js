// server/services/statusService.js
const { spawn } = require('child_process');

/**
 * Controlla se la sessione tmux "mc_server" è attiva.
 * Ritorna true se esce con code 0, altrimenti false.
 */
function isServerRunning() {
    return new Promise(resolve => {
        const check = spawn('tmux', ['has-session', '-t', 'mc_server']);
        check.on('exit', code => resolve(code === 0));
        check.on('error', () => resolve(false));
    });
}

module.exports = { isServerRunning };
