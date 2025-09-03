// server/routes/log.js
const router = require('express').Router()
const { history, stream } = require('../controllers/logController')

// GET /api/logs/history?lines=200
router.get('/logs/history', history)

// GET /api/logs/stream
router.get('/logs/stream', stream)

module.exports = router
