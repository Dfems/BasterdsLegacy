// server/services/shellService.js
const { spawn } = require('child_process')
const { OS_TYPE, SHELL_WORK_DIR } = require('../config/config')
const os = require('os')

const shellCmd = OS_TYPE === 'windows' ? 'cmd.exe' : '/bin/bash'
const shellArgs = OS_TYPE === 'windows' ? ['/Q', '/K'] : ['-i']

const shell = spawn(shellCmd, shellArgs, {
  cwd: SHELL_WORK_DIR,
  stdio: ['pipe', 'pipe', 'pipe'],
})
shell.stdout.setEncoding('utf-8')
shell.stderr.setEncoding('utf-8')

/**
 * Esegue in streaming chunked un comando sulla shell persistente.
 * Usa un marker per delimitare la fine.
 */
function streamCommand(cmd, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Transfer-Encoding', 'chunked')
  res.flushHeaders()

  const marker = `__END_${Date.now()}__`
  const onOut = (chunk) => {
    const txt = chunk.toString()
    if (txt.includes(marker)) {
      const [before] = txt.split(marker)
      if (before) res.write(before)
      cleanup()
      return res.end()
    }
    res.write(txt)
  }
  const onErr = (chunk) => res.write(chunk.toString())

  const cleanup = () => {
    shell.stdout.off('data', onOut)
    shell.stderr.off('data', onErr)
  }

  shell.stdout.on('data', onOut)
  shell.stderr.on('data', onErr)
  shell.stdin.write(cmd + os.EOL)
  shell.stdin.write(`echo ${marker}` + os.EOL)
}

module.exports = { streamCommand }
