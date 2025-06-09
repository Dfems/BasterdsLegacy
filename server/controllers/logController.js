// server/controllers/statusController.js
const { isServerRunning } = require('../services/statusService');

async function status(req, res) {
    const running = await isServerRunning();
    res.json({ running });
}

module.exports = { status };
