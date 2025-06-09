// server/controllers/consoleController.js
const { streamCommand } = require('../services/shellService');

function streamConsole(req, res) {
    const { command } = req.body;
    streamCommand(command, res);
}

module.exports = { streamConsole };
