# Deploy su Raspberry Pi

Questa guida descrive come fare il deploy della web app (frontend Vite + backend Fastify) su Raspberry Pi dietro Apache2, e come usare il workflow GitHub Actions `Deploy to Raspberry Pi`.

## Prerequisiti Raspberry
- Raspberry raggiungibile via SSH: `dfems@basterdslegacy.ddns.net`
- Node.js >= 20 installato (`/usr/bin/node`)
- Apache2 con moduli: `ssl`, `rewrite`, `proxy`, `proxy_http`, `proxy_wstunnel`, `headers`
- Directory:
  - Frontend: `/var/www/basterdslegacy` (proprietà `www-data:www-data`)
  - Backend: `/home/dfems/apps/basterdslegacy/server`
  - Minecraft: `/home/dfems/Minecraft` (permessi per gruppo corretto)
- Systemd per backend: vedi `server/deploy/basterds-server.service`

## Variabili ambiente backend
Usa `server/.env.production` come base. Durante il deploy viene copiato in `server/.env`. Verifica:
- `MC_DIR=/home/dfems/Minecraft/Runtime`
- `BACKUP_DIR=/home/dfems/Minecraft/Backups`
- `LOG_DIR=/home/dfems/Minecraft/Log`
- `PORT=3000`
- `DATABASE_URL="file:./prisma/dev.db"` (SQLite locale)
- Aggiorna `JWT_SECRET` con un valore sicuro in produzione.

## Apache virtual host (HTTPS)
Copia `server/deploy/apache-basterdslegacy.conf` in `/etc/apache2/sites-available/basterdslegacy.conf`, poi:

```bash
sudo a2enmod ssl rewrite proxy proxy_http proxy_wstunnel headers
sudo a2ensite basterdslegacy
sudo systemctl reload apache2
```

Servirà la web app su `https://basterdslegacy.ddns.net` (redirect 80→443 incluso nel template):
- Statici dal path `/var/www/basterdslegacy`
- Backend Fastify su `/api/*`
- WebSocket su `/ws/*` (es. `/ws/console`, `/ws/modpack-install`)

## Service systemd backend
Installa il servizio:

```bash
sudo install -m 0644 server/deploy/basterds-server.service /etc/systemd/system/basterds-server.service
sudo systemctl daemon-reload
sudo systemctl enable --now basterds-server
```

Il servizio esegue `/home/dfems/apps/basterdslegacy/server/dist/app.js` con `NODE_ENV=production`.

## Workflow GitHub Actions
File: `.github/workflows/deploy.yml` (deploy manuale via SSH)
Oppure: `.github/workflows/deploy-selfhosted.yml` (deploy manuale su runner self-hosted)

### Segreti richiesti (Repository Settings → Secrets and variables → Actions)
- `SSH_PRIVATE_KEY`: chiave privata per l'utente `dfems` sul Raspberry (solo deploy). Assicurati che la pubblica sia in `~/.ssh/authorized_keys`.

#### Come ottenere `SSH_PRIVATE_KEY` (Windows)
1. Genera la chiave:
  ```powershell
  ssh-keygen -t ed25519 -C "deploy@basterdslegacy" -f "$env:USERPROFILE\.ssh\basterdslegacy_deploy"
  ```
2. Copia la chiave pubblica su Raspberry (incolla in `~/.ssh/authorized_keys`):
  ```powershell
  type "$env:USERPROFILE\.ssh\basterdslegacy_deploy.pub"
  ```
3. Aggiungi su GitHub come Secret:
  - Name: `SSH_PRIVATE_KEY`
  - Value: contenuto di `~/.ssh/basterdslegacy_deploy` (chiave privata)

### Cosa fa il workflow
- Builda il frontend (`vite build`), comprime `dist` e lo carica in `/var/www/basterdslegacy`
- Sincronizza `server/` su `/home/dfems/apps/basterdslegacy/server`
- `npm ci && npm run build` sul Raspberry per il backend
- Copia `server/.env.production` in `server/.env`
- Esegue `prisma generate && prisma db push`
- Riavvia `basterds-server` e ricarica Apache
- Esegue un health check su `http://localhost:3000/api/status`

### Opzione consigliata: Runner self-hosted (niente porte aperte)
1. Sulla Raspberry, crea un utente/usa `dfems` e installa il runner GitHub (Settings → Actions → Runners → New self-hosted runner):
  - Scegli Linux, ARM/ARM64 in base all’architettura
  - Segui i comandi forniti (download, `./config.sh`, `./run.sh`)
  - Aggiungi le label `linux` e `raspberry` (come nel workflow)
2. Installa Node 20 sul sistema (es. `nvm` o pacchetti distro)
3. Esegui il workflow `Deploy (Self-hosted Raspberry)` da Actions.

#### Sudo non interattivo (opzionale ma pratico)
Per evitare prompt password durante deploy, puoi aggiungere una regola NOPASSWD per i comandi usati dal workflow:
```
dfems ALL=(ALL) NOPASSWD: /usr/bin/systemctl, /usr/bin/install, /usr/sbin/a2enmod, /usr/sbin/a2ensite, /usr/sbin/a2dissite, /usr/bin/mkdir, /usr/bin/chown, /usr/bin/chmod, /usr/bin/tar, /usr/bin/cp, /usr/bin/rsync
```
Salva come file sotto `/etc/sudoers.d/99-basterdslegacy` con `visudo -f /etc/sudoers.d/99-basterdslegacy`.

### Come avviarlo
- Manuale: tab Actions → `Deploy to Raspberry Pi` → Run workflow
  - Parametri: `host`, `user`, `port`, `environment`
  - Opzionale: `configure_apache` (true/false) per aggiornare il vhost

## Permessi e gruppi
La directory `/home/dfems/Minecraft` è utilizzabile solo da un gruppo specifico. Assicurati che l'utente `dfems` e l'utente effettivo del servizio (qui `dfems`) appartengano al gruppo richiesto:

```bash
sudo usermod -aG <gruppo-minecraft> dfems
sudo systemctl restart basterds-server
```

Se Apache deve leggere solo i file statici, è sufficiente `www-data` proprietario di `/var/www/basterdslegacy`.

## Troubleshooting
- Log backend: `journalctl -u basterds-server -f`
- Log Apache: `/var/log/apache2/basterdslegacy_error.log`
- Permessi Minecraft: `namei -l /home/dfems/Minecraft` per verificare path e gruppi
- Check porte: `ss -ltnp | grep 3000`

## Note
- Il deploy non tocca il contenuto di `/home/dfems/Minecraft`. Assicurati che i percorsi in `.env` puntino alle dir corrette.
- Le directory remote sono create automaticamente dal workflow se mancanti:
  - `/var/www/basterdslegacy`
  - `/home/dfems/apps/basterdslegacy/server`
