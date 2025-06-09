// server/routes/console.js
const router = require('express').Router();
const { streamConsole } = require('../controllers/consoleController');
router.post('/', streamConsole);
module.exports = router;
