// server/routes/minecraft.js
const router = require('express').Router();
const { installServer, mcCommand } = require('../controllers/minecraftController');
router.post('/install', installServer);
router.post('/mc-command', mcCommand);
module.exports = router;
