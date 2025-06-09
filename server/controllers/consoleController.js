// server/controllers/consoleController.js
const { streamCommand } = require('../services/shellService');

/**
 * POST /api/console
 * Riceve un comando shell arbitrario e ne fa lo streaming chunked.
 */
function streamConsole(req, res) {
  const { command } = req.body;
  streamCommand(command, res);
}

module.exports = { streamConsole };
