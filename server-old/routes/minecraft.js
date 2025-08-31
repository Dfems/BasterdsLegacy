// server/routes/minecraft.js
const router = require('express').Router();
const {
  installServer,
  mcCommand,
  startServer,
  stopServer,
  restartServer,
  deleteServer
} = require('../controllers/minecraftController');

// installa il server e genera i file di config
router.post('/install', installServer);

// avvia / ferma / riavvia
router.post('/start',   startServer);
router.post('/stop',    stopServer);
router.post('/restart', restartServer);
router.post('/delete',  deleteServer);

// invia un comando di gioco via RCON
router.post('/mc-command', mcCommand);

module.exports = router;
