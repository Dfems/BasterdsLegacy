# BasterdsLegacy — Shockbyte‑like Single‑Server Panel

Pannello di controllo per server Minecraft con installazione automatica modpack e gestione real-time.

## Caratteristiche

- **Dashboard con controlli server**: Start/Stop/Restart direttamente dalla homepage
- **Console real-time**: Output del server in tempo reale via WebSocket
- **Modpack automatico**: Installazione Fabric/Forge/NeoForge/Quilt con progresso real-time
- **Stato JAR intelligente**: Rileva automaticamente il tipo di server installato
- **Sistema di Backup Robusto**: Backup automatici con gestione errori completa
- **Controlli di sicurezza**: Impedisce start senza JAR e cancellazione con server attivo
- **Background personalizzato**: Gli owner possono caricare immagini di sfondo personalizzate

## Come Usare il Sistema

### 1. **Primo Accesso**
- Accedi alla dashboard
- La homepage mostra lo stato del server e del modpack

### 2. **Installazione Modpack**
- Vai alla pagina **Modpack**
- Scegli tra modalità **Automatica** (Fabric/Forge/etc.) o **Manuale** (JAR personalizzato)
- L'installazione avviene in tempo reale con progresso dettagliato
- Al termine, il sistema è pronto per l'avvio

### 3. **Gestione Server**
- **Dashboard**: Controlli rapidi Start/Stop/Restart
- **Console**: Interfaccia completa con:
  - Stato real-time del server
  - Output console in tempo reale
  - Invio comandi
  - Controlli Start/Stop/Restart/Clear

### 4. **Sistema di Backup**
- **Pagina Backup**: Gestione completa backup del server
- **Backup Tipi**: 
  - `full`: Backup completo del server
  - `world`: Backup solo della directory world (più veloce)
- **Ripristino Sicuro**: Il server viene sempre riavviato dopo un restore
- **Gestione Errori**: Cleanup automatico e garanzia di riavvio server

#### **🆕 Backup Automatici**
- **Configurazione Flessibile**: Sistema di backup periodici completamente configurabile
- **Preset Pronti**: Opzioni predefinite per facilità d'uso:
  - Giornaliero alle 3:00 (`daily_3am`)
  - Ogni 2-3 giorni (`every_2_days`, `every_3_days`)
  - Settimanale (lunedì/domenica) (`weekly_monday`, `weekly_sunday`)
  - Multipli giornalieri (`triple_daily` - 8:00, 14:00, 20:00)
- **Configurazione Custom**: Pattern cron personalizzati per esigenze specifiche
- **API Completa**: Gestione tramite `/api/backups/schedule` e `/api/backups/presets`

### 5. **Flusso Tipico**
1. Apri la Console → Vedi se c'è un JAR/Modpack
2. Se manca, vai alla pagina Modpack → Installa
3. Torna alla Console → Premi "Start"
4. Monitora l'avvio in tempo reale
5. Gestisci il server (comandi, stop, restart)

### 6. **Protezioni di Sicurezza**
- ❌ **Non puoi avviare** senza modpack installato
- ❌ **Non puoi cancellare** modpack con server attivo
- ✅ **Feedback real-time** su tutte le operazioni

### 6. **Personalizzazione UI (Solo Owner)**
- **Background personalizzato**: Carica immagini di sfondo per personalizzare l'interfaccia
  - Formati supportati: JPEG, PNG, WebP, GIF
  - Dimensione massima: 5MB
  - Accessibile da Settings → Sfondo Personalizzato
  - Anteprima in tempo reale
  - Rimozione con un click

---

## Requisiti

- Node.js 20+
- Java 17+ (per server Minecraft)

## Script

- `dev`: Avvia sviluppo frontend
- `build`: Compila il progetto
- `preview`: Anteprima build
- `lint`: Controllo codice
- `format` / `format:check`: Formattazione
- `type-check`: Controllo tipi TypeScript
- `test`: Test unitari

## Struttura

- `server/`: Backend Fastify TS (porta 3000)
- `src/`: Frontend React + TypeScript
  - `pages/server/ConsolePage.tsx`: Console real-time
  - `pages/management/ModpackPage.tsx`: Gestione modpack
  - `pages/HomePage.tsx`: Dashboard con controlli

## Sviluppo

1. **Installazione**:
   ```bash
   npm install
   ```

2. **Frontend** (porta 5173):
   ```bash
   npm run dev
   ```

3. **Backend** (porta 3000):
   ```bash
   cd server
   npm run dev
   ```

Proxy Vite: `/api` → `http://localhost:3000`

## Licenza e Contributi

Questo progetto è rilasciato con una licenza proprietaria. Per i termini completi consulta `LICENSE` alla radice del repository. Se desideri contribuire, leggi le linee guida in `CONTRIBUTING.md`.

Nota: nei file `package.json` è specificato "license": "SEE LICENSE IN LICENSE" in conformità alla licenza.

## Configurazione Server

Il sistema gestisce automaticamente:
- EULA del server (`eula=true`)
- Argomenti JVM (`user_jvm_args.txt`)
- Download e installazione server

### Variabili Ambiente

**Server:**
- `MC_DIR`: Directory server Minecraft (default: `./minecraft`)
- `JAVA_BIN`: Eseguibile Java (default: `java`)

**Backup:**
- `BACKUP_DIR`: Directory backup (default: `MC_DIR/backups`)
- `BACKUP_CRON`: Schedule retention automatica (default: `0 3 * * *`)
- `RETENTION_DAYS`: Giorni retention backup (default: `7`)
- `RETENTION_WEEKS`: Settimane retention backup (default: `4`)

**Backup Automatici (opzionali):**
- `AUTO_BACKUP_ENABLED`: Abilita backup automatici (default: `false`)
- `AUTO_BACKUP_CRON`: Pattern cron per backup automatici (default: `0 3 * * *`)
- `AUTO_BACKUP_MODE`: Modalità backup automatici - `full` o `world` (default: `world`)
- `JWT_SECRET`: Segreto per autenticazione
- `DATABASE_URL`: URL database Prisma

## API Real-time

### WebSocket Endpoints

- `/ws/console`: Console real-time (log + comandi)
- `/ws/modpack-install`: Installazione modpack con progresso

### REST Endpoints

**Core:**
- `GET /api/status`: Stato server
- `POST /api/power`: Controlli server (start/stop/restart)
- `GET /api/server/jar-status`: Stato JAR/modpack
- `GET /api/modpack/versions`: Versioni supportate
- `POST /api/modpack/install`: Installazione modpack

**Backup:**
- `GET /api/backups`: Lista backup esistenti
- `POST /api/backups`: Crea nuovo backup (`mode`: `full`|`world`)
- `POST /api/backups/:id/restore`: Ripristina backup
- `GET /api/backups/schedule`: Configurazione backup automatici
- `PUT /api/backups/schedule`: Aggiorna configurazione backup automatici
- `GET /api/backups/presets`: Lista preset backup disponibili

## Tipi di Modpack Supportati

- **Fabric**: Installazione automatica con latest loader
- **Forge**: Versioni statiche per MC 1.16.5-1.21.1
- **NeoForge**: Versioni per MC 1.20.1-1.21.1  
- **Quilt**: Installazione automatica con latest loader
- **Personalizzato**: JAR upload manuale

## Sistema di Backup Automatici

Il sistema offre backup automatici flessibili e configurabili per proteggere il tuo server senza intervento manuale.

### Configurazione via API

**Usare un preset predefinito:**
```bash
# Backup giornaliero alle 3:00 (modalità world)
curl -X PUT http://localhost:3000/api/backups/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"preset": "daily_3am"}'

# Backup settimanale ogni lunedì alle 3:00 (modalità full)
curl -X PUT http://localhost:3000/api/backups/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"preset": "weekly_monday"}'

# Tre backup giornalieri: 8:00, 14:00, 20:00
curl -X PUT http://localhost:3000/api/backups/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"preset": "triple_daily"}'
```

**Configurazione personalizzata:**
```bash
# Backup ogni 2 giorni alle 2:30
curl -X PUT http://localhost:3000/api/backups/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "enabled": true,
    "frequency": "custom",
    "mode": "world",
    "cronPattern": "30 2 */2 * *"
  }'

# Backup lunedì, mercoledì, venerdì alle 4:00
curl -X PUT http://localhost:3000/api/backups/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "enabled": true,
    "frequency": "custom", 
    "mode": "full",
    "cronPattern": "0 4 * * 1,3,5"
  }'
```

**Visualizzare configurazione corrente:**
```bash
curl http://localhost:3000/api/backups/schedule \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Disabilitare backup automatici:**
```bash
curl -X PUT http://localhost:3000/api/backups/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"preset": "disabled"}'
```

### Configurazione via Variabili Ambiente

Puoi anche configurare i backup automatici tramite variabili ambiente nel file `.env`:

```env
# Abilita backup automatici all'avvio
AUTO_BACKUP_ENABLED=true

# Pattern cron: backup ogni giorno alle 3:00
AUTO_BACKUP_CRON=0 3 * * *

# Modalità: 'world' per backup solo mondo, 'full' per backup completo
AUTO_BACKUP_MODE=world
```

### Preset Disponibili

| Preset | Descrizione | Frequenza | Modalità | Orario |
|--------|-------------|-----------|----------|--------|
| `disabled` | Backup disabilitati | - | - | - |
| `daily_3am` | Backup giornaliero | Ogni giorno | world | 03:00 |
| `daily_2am` | Backup giornaliero | Ogni giorno | world | 02:00 |
| `every_2_days` | Ogni 2 giorni | Ogni 2 giorni | world | 03:00 |
| `every_3_days` | Ogni 3 giorni | Ogni 3 giorni | world | 03:00 |
| `weekly_monday` | Settimanale lunedì | Ogni lunedì | full | 03:00 |
| `weekly_sunday` | Settimanale domenica | Ogni domenica | full | 03:00 |
| `triple_daily` | Tre volte al giorno | Tutti i giorni | world | 08:00, 14:00, 20:00 |

### Gestione Errori e Logging

Il sistema di backup automatico include:
- **Logging dettagliato**: Ogni operazione di backup viene loggata con timestamp e risultato
- **Resilienza agli errori**: Gli errori non interrompono il servizio o future esecuzioni
- **Cleanup automatico**: File parziali vengono rimossi in caso di errore
- **Retention automatica**: Applica le policy di retention dopo ogni backup automatico
- **Audit trail**: Tutte le modifiche alla configurazione vengono registrate

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
