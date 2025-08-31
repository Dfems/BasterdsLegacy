// server/routes/status.js
const router = require('express').Router()
const { status } = require('../controllers/statusController')

// GET /api/status
router.get('/status', status)

module.exports = router
