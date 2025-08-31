// server/controllers/minecraftController.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { sendRconCommand } = require('../lib/rcon');
const { MC_RCON_PORT, MC_RCON_PASSWORD, SHELL_WORK_DIR, OS_TYPE } = require('../config/config');
const SERVER_DIR = SHELL_WORK_DIR;

/**
 * POST /api/install
 * Installa il server Minecraft e genera server.properties, eula.txt e user_jvm_args.txt.
 */
function installServer(req, res) {
    const { jarName, minGb, maxGb } = req.body;
    const installer = spawn('java', ['-jar', jarName, '--installServer'], {
        cwd: SERVER_DIR, shell:true
    });

    installer.stdout.pipe(res,{ end:false });
    installer.stderr.pipe(res,{ end:false });

    installer.on('close', code => {
        if (code !== 0) return res.status(500).end(`Code ${code}`);
        // write server.properties, eula.txt, jvm args…
        const props = [
            'enable-rcon=true',
            `rcon.port=${MC_RCON_PORT}`,
            `rcon.password=${MC_RCON_PASSWORD}`,
            'online-mode=true',
        ].join('\n');
        fs.writeFileSync(path.join(SERVER_DIR,'server.properties'), props);
        fs.writeFileSync(path.join(SERVER_DIR,'eula.txt'),'eula=true\n');
        fs.writeFileSync(path.join(SERVER_DIR,'user_jvm_args.txt'), `-Xms${minGb}G -Xmx${maxGb}G`);
        res.end('\n✅ Done\n');
    });
}

/**
 * POST /api/mc-command
 * Invia un comando di gioco via RCON e restituisce l’output.
 */
async function mcCommand(req, res) {
    const { command } = req.body;
    if (!command) {
        return res.status(400).json({ error: 'Nessun comando fornito' });
    }

    try {
        const output = await sendRconCommand(command);
        res.json({ output });
    } catch (err) {
        console.error('RCON error:', err);
        res.status(500).json({ error: 'Errore invio comando RCON: ' + err.message });
    }
}

/**
 * POST /api/start
 * Avvia il server Minecraft in background.
 */
function startServer(req, res) {
    console.log('Starting Minecraft server...');
    console.log('OS_TYPE:', OS_TYPE);
    console.log('SERVER_DIR:', SERVER_DIR);
    if (OS_TYPE === 'windows') {
        // Windows: usa `start` per lanciare run.bat in una nuova finestra
        const cmd = spawn('cmd', ['/C', 'run.bat', 'nogui'], {
            cwd: SERVER_DIR,
            detached: true,
            windowsHide: true,
            stdio: 'ignore'
        });
        // Consente a Node di uscire senza attendere la chiusura del batch
        cmd.unref();

        // Rispondi subito al client
        return res.json({ message: 'Server avviato' });
    } else {
        // Linux: crea una sessione tmux “mc_server”
        const cmd = spawn('tmux', ['new-session', '-d', '-s', 'mc_server', './run.sh', 'nogui'], {
        cwd: SERVER_DIR
        });
        cmd.on('exit', code =>
        code === 0
            ? res.json({ message: 'Server avviato' })
            : res.status(500).json({ error: `Start failed (code ${code})` })
        );
    }
}

/**
 * POST /api/stop
 * Ferma il server Minecraft inviando il comando RCON “stop”.
 */
async function stopServer(req, res) {
    try {
        const output = await sendRconCommand('stop');
        res.json({ message: 'Server fermato', output });
    } catch (err) {
        res.status(500).json({ error: 'Errore stop server: ' + err.message });
    }
}

/**
 * POST /api/restart
 * Riavvia il server Minecraft: prima stop, poi start.
 */
function restartServer(req, res) {
    // 1) Proviamo a fermarlo via RCON
    sendRconCommand('stop')
        .catch(err => console.warn('RCON stop error (ignored):', err.message))
        .finally(() => {
        // 2) E poi riavviamo esattamente come startServer
        if (config.OS_TYPE === 'windows') {
            const cmd = spawn('cmd.exe', ['/C', 'start', 'run.bat', 'nogui'], {
            cwd: SERVER_DIR,
            shell: true
            });
            cmd.on('exit', code =>
            code === 0
                ? res.json({ message: 'Server riavviato' })
                : res.status(500).json({ error: `Restart failed (code ${code})` })
            );
        } else {
            const kill = spawn('tmux', ['kill-session', '-t', 'mc_server']);
            kill.on('exit', () => {
                const cmd = spawn('tmux', ['new-session', '-d', '-s', 'mc_server', './run.sh', 'nogui'], {
                    cwd: SERVER_DIR
                });
                cmd.on('exit', code =>
                    code === 0
                    ? res.json({ message: 'Server riavviato' })
                    : res.status(500).json({ error: `Restart failed (code ${code})` })
                );
            });
        }
        });
}

/**
 * POST /api/delete
 * Elimina ricorsivamente TUTTI i file nella directory del server Minecraft,
 * poi ricrea la cartella vuota.
 */
async function deleteServer(req, res) {
    try {
        // rimuove ricorsivamente (node 14+)
        await fs.promises.rm(SHELL_WORK_DIR, { recursive: true, force: true });
        // ricrea la cartella vuota
        await fs.promises.mkdir(SHELL_WORK_DIR, { recursive: true });
        return res.json({ message: 'Server eliminato con successo.' });
    } catch (err) {
        console.error('DeleteServer error:', err);
        return res.status(500).json({ error: 'Errore delete server: ' + err.message });
    }
}

module.exports = {
    installServer,
    mcCommand,
    startServer,
    stopServer,
    restartServer,
    deleteServer
};
