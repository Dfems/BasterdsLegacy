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

**Avvio standard con Prisma (raccomandato):**
```bash
npm run dev
```
> Esegue automaticamente setup database, compila TypeScript e avvia il server

**Avvio diretto TypeScript con Prisma:**
```bash
npm run dev:ts
```
> Usa tsx per esecuzione diretta senza compilazione

**Avvio con mock database (fallback):**
```bash
npm run dev:mock
```
> Usa il database mock quando Prisma non è disponibile

Il server sarà disponibile su `http://localhost:3000`

## 📋 Script disponibili

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