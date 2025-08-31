// server/lib/rcon.js
const { Rcon } = require('rcon-client')

/**
 * Invia un singolo comando via RCON al server Minecraft.
 * @param {string} command Il comando Minecraft (es. "op user", "say Ciao!")
 * @returns {Promise<string>} L'output restituito dalla console di gioco
 */
async function sendCommand(command) {
  const rcon = await Rcon.connect({
    host: '127.0.0.1',
    port: Number(process.env.MC_RCON_PORT),
    password: process.env.MC_RCON_PASSWORD,
  })

  const response = await rcon.send(command)
  await rcon.end()

  return response
}

module.exports = { sendCommand }
