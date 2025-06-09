// server/services/userService.js
const fs = require('fs');
const { USERS_FILE } = require('../config/config');

/**
 * Carica l’elenco degli utenti da users.json
 * @returns {Array<{username:string,passwordHash:string}>}
 */
function loadUsers() {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

module.exports = { loadUsers };
