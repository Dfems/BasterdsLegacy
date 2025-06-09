require('dotenv').config();
const path = require('path');

module.exports = {
    HOST: process.env.BACKEND_HOST || '0.0.0.0',
    PORT: parseInt(process.env.BACKEND_PORT ?? '4000', 10),
    BASE_URL: process.env.BACKEND_URL ?? '',
    USERS_FILE: path.join(__dirname, '../users.json'),
    SHELL_WORK_DIR: process.env.SHELL_WORK_DIR,
    OS_TYPE: process.env.OS_TYPE ?? 'linux',
    JWT_SECRET: process.env.JWT_SECRET,
    TOKEN_EXPIRY: process.env.TOKEN_EXPIRY,
    REFRESH_THRESHOLD_MS: parseInt(process.env.REFRESH_THRESHOLD_MINUTES, 10) * 60 * 1000,
    MC_RCON_HOST: process.env.MC_RCON_HOST || '127.0.0.1',
    MC_RCON_PORT: Number(process.env.MC_RCON_PORT),
    MC_RCON_PASSWORD: process.env.MC_RCON_PASSWORD,
    LOG_PATH: path.join(__dirname, process.env.LOGS_DIR ),
};
