# BasterdsLegacy — Shockbyte‑like Single‑Server Panel

Pannello di controllo per server Minecraft con installazione automatica modpack e gestione real-time.

## Caratteristiche

- **Dashboard con controlli server**: Start/Stop/Restart direttamente dalla homepage
- **Console real-time**: Output del server in tempo reale via WebSocket
- **Modpack automatico**: Installazione Fabric/Forge/NeoForge/Quilt con progresso real-time
- **Stato JAR intelligente**: Rileva automaticamente il tipo di server installato
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

### 4. **Flusso Tipico**
1. Apri la Console → Vedi se c'è un JAR/Modpack
2. Se manca, vai alla pagina Modpack → Installa
3. Torna alla Console → Premi "Start"
4. Monitora l'avvio in tempo reale
5. Gestisci il server (comandi, stop, restart)

### 5. **Protezioni di Sicurezza**
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

## Configurazione Server

Il sistema gestisce automaticamente:
- EULA del server (`eula=true`)
- Argomenti JVM (`user_jvm_args.txt`)
- Download e installazione server

### Variabili Ambiente

- `MC_DIR`: Directory server Minecraft (default: `./minecraft`)
- `JAVA_BIN`: Eseguibile Java (default: `java`)
- `JWT_SECRET`: Segreto per autenticazione
- `DATABASE_URL`: URL database Prisma

## API Real-time

### WebSocket Endpoints

- `/ws/console`: Console real-time (log + comandi)
- `/ws/modpack-install`: Installazione modpack con progresso

### REST Endpoints

- `GET /api/status`: Stato server
- `POST /api/power`: Controlli server (start/stop/restart)
- `GET /api/server/jar-status`: Stato JAR/modpack
- `GET /api/modpack/versions`: Versioni supportate
- `POST /api/modpack/install`: Installazione modpack

## Tipi di Modpack Supportati

- **Fabric**: Installazione automatica con latest loader
- **Forge**: Versioni statiche per MC 1.16.5-1.21.1
- **NeoForge**: Versioni per MC 1.20.1-1.21.1  
- **Quilt**: Installazione automatica con latest loader
- **Personalizzato**: JAR upload manuale

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
