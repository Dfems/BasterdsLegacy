# BasterdsLegacy Server

Backend del pannello di controllo per server Minecraft.

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

```bash
npm run dev
```

Il server sarà disponibile su `http://localhost:3000`

## 📋 Script disponibili

- `npm run dev` - Avvia il server in modalità sviluppo (compila TypeScript e esegue)
- `npm run dev:ts` - Avvia con tsx (alternativa diretta TypeScript)
- `npm run build` - Compila TypeScript in JavaScript
- `npm run start` - Avvia il server compilato
- `npm run type-check` - Controlla tipi TypeScript senza compilare

## 🔧 Configurazione

Il file `.env` contiene le configurazioni principali:

- `PORT=3000` - Porta del server
- `JWT_SECRET` - Chiave segreta per JWT (cambiare in produzione!)
- `MC_DIR` - Directory del server Minecraft
- `DATABASE_URL` - URL del database (SQLite locale)

## 📁 Struttura

```
src/
├── app.ts              # Punto di ingresso principale
├── lib/                # Utilities e configurazioni
│   ├── auth.ts         # Sistema di autenticazione
│   ├── config.ts       # Configurazioni globali
│   ├── db.ts           # Client database
│   └── ...
├── routes/             # Endpoint API
│   ├── auth.ts         # Login/logout
│   ├── console.ts      # Console Minecraft
│   ├── modpack.ts      # Gestione modpack
│   └── ...
├── minecraft/          # Logica specifica Minecraft
└── filemgr/           # Gestione file del server
```

## 🛠️ Modalità sviluppo

In ambiente di sviluppo (quando Prisma non è disponibile), il server utilizza un database mock che permette di:

- Testare l'avvio del server
- Provare l'autenticazione con credenziali di test
- Sviluppare nuove funzionalità senza dipendenze esterne

**Credenziali di test:**
- Email: `admin@test.com`
- Password: `password`

## 🐛 Risoluzione problemi

### Errore "Cannot find module 'ts-node'"
```bash
npm install
```

### Errore Prisma "did not initialize"
Il server usa automaticamente un mock in sviluppo quando Prisma non è disponibile.

### Server non si avvia
Verifica che:
1. Il file `.env` esista (copia da `.env.example`)
2. Le dipendenze siano installate (`npm install`)
3. La porta 3000 non sia occupata

## 🔐 Sicurezza

- Cambia sempre `JWT_SECRET` in produzione
- Non committare mai il file `.env` con dati sensibili
- Usa HTTPS in produzione