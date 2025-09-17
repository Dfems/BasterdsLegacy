# BasterdsLegacy Server

Backend del pannello di controllo per server Minecraft con database Prisma e gestione utenti completa.

## 🚀 Avvio rapido per sviluppo

### 1. Installazione dipendenze

```bash
npm install
```

### 2. Configurazione ambiente

Copia il file di esempio e modifica se necessario:

```bash
cp .env.example .env
```

### 3. Avvio server di sviluppo

**Avvio completo con Prisma (raccomandato):**
```bash
npm run dev
```
> ✅ Setup automatico database + compila TypeScript + avvia server

**Avvio veloce con TypeScript diretto:**
```bash
npm run dev:ts
```
> ⚡ Setup database + tsx (più veloce per sviluppo iterativo)

**Avvio con mock database (offline):**
```bash
npm run dev:mock
```
> 🔄 Fallback automatico quando Prisma non è disponibile

Il server sarà disponibile su `http://localhost:3000`

## 📚 Documentazione

- API e panoramica: `../docs/api.md`
- Backup/Restore e scheduler: `../docs/backups.md`
- Modpack (loader + versioni): `../docs/modpack.md`
- Logging di sistema: `./LOGGING.md`
- Sicurezza e SFTP OS: `../docs/security.md`, `../docs/sftp.md`

## Licenza e Contributi

Questo pacchetto è parte del repository principale e ricade sotto la stessa licenza proprietaria. Consulta il file `../LICENSE` per i termini completi. Per contribuire, fai riferimento a `../CONTRIBUTING.md`.

## 🎯 Flusso Prisma Lineare

### ✅ Setup Completamente Automatico

**Il sistema Prisma è ora completamente lineare e automatizzato:**

1. **Avvio**: `npm run dev` o `npm run dev:ts`
2. **Database**: Creato automaticamente (`./prisma/dev.db`)
3. **Schema**: Applicato automaticamente con `prisma db push`
4. **Client**: Generato automaticamente con `prisma generate`
5. **Migrazioni**: Gestite automaticamente al bisogno

### 🔧 Zero Configurazione Manuale

- ✅ **Nessun comando manuale** di setup database
- ✅ **Nessuna migrazione manuale** da eseguire
- ✅ **Nessun restart** richiesto per cambi schema
- ✅ **Fallback automatico** a mock se Prisma non disponibile

### 📋 Quando Usare Cosa

| Comando | Quando Usare | Database | Note |
|---------|--------------|----------|------|
| `npm run dev` | **Prima volta / Build completo** | Prisma | Più lento ma sicuro |
| `npm run dev:ts` | **Sviluppo quotidiano** | Prisma | Veloce, raccomandato |
| `npm run dev:mock` | **Offline / CI** | Mock | Credenziali: admin@test.com/password |

### 🛠️ Controllo Manuale (Opzionale)

Se vuoi controllo manuale (non necessario):
```bash
npm run setup:db      # Setup manuale database
npm run db:push       # Applica schema manualmente
npm run db:generate   # Genera client manualmente
```

## 🖥️ Supporto Script di Avvio

### Avvio Server Intelligente

Il sistema ora supporta **script di avvio personalizzati** con fallback automatico:

#### 🔹 Linux/macOS
```bash
# Posiziona script nella directory del server
./server/runtime/run.sh
```

#### 🔹 Windows  
```batch
REM Posiziona script nella directory del server
./server/runtime/run.bat
```

### 📋 Priorità di Avvio

1. **run.sh** (Linux/macOS) o **run.bat** (Windows) se presente
2. **Fallback automatico** al JAR del server se script non trovato
3. **Rilevamento automatico** del sistema operativo

### ✨ Funzionalità Script

- ✅ **Esecuzione automatica** dello script corretto per piattaforma
- ✅ **Permessi automatici** (Linux: `chmod +x run.sh`)
- ✅ **Output in tempo reale** nella console
- ✅ **Fallback JAR** se script non presente

### 🔧 Esempio Script

**run.sh (Linux/macOS):**
```bash
#!/bin/bash
echo "=== Avvio Server Personalizzato ==="

# Configurazione JVM ottimizzata
JVM_ARGS="-Xmx4G -Xms2G -XX:+UseG1GC"

# Trova automaticamente il JAR
if [ -f "server.jar" ]; then
    SERVER_JAR="server.jar"
elif [ -f "fabric-server-launch.jar" ]; then
    SERVER_JAR="fabric-server-launch.jar"
else
    echo "Errore: Nessun JAR trovato!"
    exit 1
fi

echo "Avvio: $SERVER_JAR"
java $JVM_ARGS -jar "$SERVER_JAR" nogui
```

**run.bat (Windows):**
```batch
@echo off
echo === Avvio Server Personalizzato ===

REM Configurazione JVM ottimizzata
set JVM_ARGS=-Xmx4G -Xms2G -XX:+UseG1GC

REM Trova automaticamente il JAR
if exist "server.jar" (
    set SERVER_JAR=server.jar
) else if exist "fabric-server-launch.jar" (
    set SERVER_JAR=fabric-server-launch.jar
) else (
    echo Errore: Nessun JAR trovato!
    pause
    exit /b 1
)

echo Avvio: %SERVER_JAR%
java %JVM_ARGS% -jar "%SERVER_JAR%" nogui
pause
```

> **💡 Script di esempio** sono disponibili in `server/runtime/` come template

### 🚀 Sviluppo
- `npm run dev` - **Avvio completo**: setup DB + compila + esegue
- `npm run dev:ts` - **Avvio veloce**: setup DB + tsx (TypeScript diretto)
- `npm run dev:mock` - **Sviluppo offline**: usa mock database (no Prisma)
- `npm run build` - Compila TypeScript in JavaScript
- `npm run start` - Avvia il server compilato
- `npm run type-check` - Controlla tipi TypeScript senza compilare

### 🗄️ Database (Prisma)
- `npm run setup:db` - **Setup automatico** database con controlli
- `npm run db:push` - Applica schema al database
- `npm run db:generate` - Genera client Prisma
- `npm run db:migrate` - Crea e applica migrazione
- `npm run db:reset` - Reset completo database

### 👥 Gestione Utenti
- `npm run create:owner` - **Crea nuovo owner** (amministratore)
- `npm run create:user` - Crea nuovo utente (user/viewer)
- `npm run remove:owner` - Rimuovi owner esistente

## 🎯 Flusso di sviluppo consigliato

### Prima configurazione
```bash
cd server
npm install           # Installa dipendenze
cp .env.example .env   # Crea configurazione
npm run dev           # Avvio automatico: setup DB + server
npm run create:owner  # Crea il primo amministratore
```

### Sviluppo quotidiano
```bash
npm run dev:ts        # Avvio veloce per sviluppo
```

## 🔧 Configurazione

### File `.env`
```env
PORT=3000                                    # Porta del server
JWT_SECRET=change_me                         # Chiave JWT (CAMBIARE!)
MC_DIR=./server/runtime                      # Directory server Minecraft
BACKUP_DIR=./server/runtime/backups          # Directory backup
DATABASE_URL="file:./prisma/dev.db"          # Database SQLite
JAVA_BIN=java                                # Eseguibile Java
RCON_ENABLED=false                           # RCON abilitato
RCON_HOST=127.0.0.1                          # Host RCON
RCON_PORT=25575                              # Porta RCON
RCON_PASS=                                   # Password RCON
BACKUP_CRON=0 3 * * *                        # Backup automatico (3:00)
RETENTION_DAYS=7                             # Giorni retention backup
RETENTION_WEEKS=4                            # Settimane retention backup
# Opzionali: seed UI rotation all'avvio (solo se non presenti nel DB)
UI_BG_ROTATE_SECONDS=15                      # Intervallo rotazione sfondo (min 3)
UI_BG_ROTATE_ENABLED=true                    # Abilita/disabilita rotazione sfondo
```

### Modalità Database

#### 🟢 Prisma (Produzione/Sviluppo)
- **Quando si attiva**: Automaticamente con `npm run dev` o `npm run dev:ts`
- **Vantaggi**: Database reale, persistenza dati, funzionalità complete
- **Setup**: Automatico con controlli e migrazione
- **Reset**: `npm run db:reset` per ricominciare da zero

#### 🟡 Mock (Fallback)
- **Quando si attiva**: Automatico se Prisma non è disponibile o con `npm run dev:mock`
- **Vantaggi**: Nessuna dipendenza, avvio immediato
- **Limitazioni**: Dati non persistenti, funzionalità limitate
- **Credenziali test**: admin@test.com / password

## 📁 Struttura

```
src/
├── app.ts              # Punto di ingresso principale
├── lib/                # Utilities e configurazioni
│   ├── auth.ts         # Sistema di autenticazione
│   ├── config.ts       # Configurazioni globali
│   ├── db.ts           # Client database con fallback mock
│   └── ...
├── routes/             # Endpoint API
│   ├── auth.ts         # Login/logout
│   ├── console.ts      # Console Minecraft
│   ├── modpack.ts      # Gestione modpack
│   └── ...
├── minecraft/          # Logica specifica Minecraft
└── filemgr/           # Gestione file del server

scripts/
├── setup-db.ts        # Setup automatico database
├── create-owner.ts     # Creazione owner
├── create-user.ts      # Creazione utenti
└── remove-owner.ts     # Rimozione owner

prisma/
├── schema.prisma       # Schema database
├── migrations/         # Migrazioni database
└── dev.db             # Database SQLite di sviluppo
```

## 👤 Gestione Utenti

### Ruoli disponibili
- **owner** - Amministratore completo (gestione utenti, server, backup)
- **user** - Gestione server e file (no gestione utenti)
- **viewer** - Solo visualizzazione

### Creazione primo owner
```bash
npm run create:owner
# Segui le istruzioni interattive
```

### Gestione utenti
```bash
npm run create:user     # Crea nuovo utente
npm run remove:owner    # Rimuovi owner (attenzione!)
```

## 🛠️ Sviluppo e Debug

### TypeScript
- **tsx**: Esecuzione diretta TypeScript senza compilazione
- **tsc**: Compilazione con controllo tipi rigoroso
- **Configurazione**: `tsconfig.json` ottimizzato per Node.js

### Database
- **Auto-setup**: `npm run dev` configura automaticamente il database
- **Fallback sicuro**: Se Prisma fallisce, usa mock automaticamente
- **Debug**: Log dettagliati delle operazioni database

### Modalità sviluppo
1. **`npm run dev`** - Completo con compilazione (più lento, più sicuro)
2. **`npm run dev:ts`** - Veloce con tsx (sviluppo iterativo)
3. **`npm run dev:mock`** - Offline senza database (prototipazione)

## 🐛 Risoluzione problemi

### Database non si inizializza
```bash
npm run setup:db       # Setup manuale
npm run db:push        # Forza applicazione schema
```

### Errori Prisma
```bash
npm run db:generate    # Rigenera client
npm run db:reset       # Reset completo (ATTENZIONE: cancella dati!)
```

### Fallback a mock
Se vedi "Modalità fallback: usando mock database":
1. Controlla `DATABASE_URL` in `.env`
2. Verifica permessi cartella database
3. Esegui `npm run setup:db`

### Server non si avvia
Verifica che:
1. File `.env` esista (`cp .env.example .env`)
2. Dipendenze installate (`npm install`)
3. Porta 3000 libera
4. Permessi scrittura per database

### Errore "Cannot find module 'tsx'"
```bash
npm install            # Reinstalla dipendenze
```

## 🔐 Sicurezza

### Produzione
- **Cambia `JWT_SECRET`** con valore casuale sicuro
- **Non committare `.env`** con dati sensibili
- **Usa HTTPS** in produzione
- **Limita accesso database** a utenti autorizzati

### Sviluppo
- Credenziali mock: `admin@test.com` / `password`
- Database locale non esposto
- JWT con scadenza configurabile

## 🚀 Deploy

### Preparazione
```bash
npm run build          # Compila per produzione
npm run setup:db       # Inizializza database
npm run create:owner   # Crea amministratore
```

### Avvio produzione
```bash
npm start              # Avvia server compilato
```

## 📖 API Endpoints

- `POST /api/auth/login` - Login utente
- `GET /api/server/status` - Stato server Minecraft
- `POST /api/server/start` - Avvia server
- `POST /api/server/stop` - Ferma server
- `GET /api/console/output` - Output console
- `POST /api/console/command` - Esegui comando
- `GET /api/modpack/status` - Stato modpack
- `POST /api/modpack/install` - Installa modpack
- `GET /api/files/list` - Lista file server
- `GET /api/backups/list` - Lista backup

## 📝 Note

- **tsx** è usato per sviluppo veloce con TypeScript diretto
- **Prisma** gestisce automaticamente migrazioni e schema
- **Mock database** garantisce sviluppo anche offline
- **Setup automatico** riduce errori di configurazione
- **Script interattivi** guidano nella gestione utenti