// server/controllers/minecraftController.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { sendRconCommand } = require('../lib/rcon');
const { MC_RCON_PORT, MC_RCON_PASSWORD, MC_RCON_HOST } = require('../config/config');
const SERVER_DIR = path.join(__dirname, '../minecraft');

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

async function mcCommand(req, res) {
    try {
        const out = await sendRconCommand(req.body.command);
        res.json({ output: out });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { installServer, mcCommand };
