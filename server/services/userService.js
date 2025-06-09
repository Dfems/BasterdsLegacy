// server/services/userService.js
const fs = require('fs');
const { USERS_FILE } = require('../config/config');

function loadUsers() {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

module.exports = { loadUsers };
