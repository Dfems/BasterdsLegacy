# BasterdsLegacy — Shockbyte‑like Single‑Server Panel

Monorepo semplice: frontend React + Vite e backend Fastify TS single‑service.

## Requisiti

- Node.js 20+

## Script

- dev: vite
- build: tsc -b && vite build
- preview: vite preview
- lint: eslint .
- format / format:check: Prettier
- type-check: tsc -b --pretty
- test: vitest

## Struttura

- server/: backend Fastify TS (porta 3000)
- src/: frontend React

## Dev

1. Installazione dipendenze
2. Avvio frontend: npm run dev
3. Avvio backend: node server/src/app.ts (ts-node/tsup consigliati per dev locale)

Proxy vite: /api → http://localhost:3000

## SFTP OS‑level (guida sintetica)

Non integrare un server SFTP in Node. Usa OpenSSH di sistema con un utente dedicato chrootato nella cartella del server.

Esempio Linux (Debian/Ubuntu):

1) Installa server OpenSSH e crea gruppo/utente:
	- sudo apt-get install openssh-server
	- sudo groupadd mcserver
	- sudo useradd -m -G mcserver -s /usr/sbin/nologin mc
2) Imposta chroot su /opt/mc (o tua MC_DIR) e permessi:
	- sudo mkdir -p /opt/mc
	- sudo chown root:root /opt/mc
	- sudo chmod 755 /opt/mc
	- sudo mkdir -p /opt/mc/data
	- sudo chown mc:mcserver /opt/mc/data
3) Configura /etc/ssh/sshd_config (Match block):
	- Subsystem sftp internal-sftp
	- Match User mc
	  ChrootDirectory /opt/mc
	  ForceCommand internal-sftp
	  AllowTCPForwarding no
	  X11Forwarding no
4) Riavvia sshd: sudo systemctl restart sshd
5) Collega via SFTP con utente mc; la root visibile sarà / (chroot), scrivibile in /data.

Su Windows, usa OpenSSH Server (Feature opzionale), crea un utente non amministratore e limita le cartelle con NTFS ACL.
