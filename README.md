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
 - **Sfondo rotante globale**: Se non è impostato uno sfondo personalizzato, l'interfaccia mostra in rotazione le immagini presenti in `src/assets/background`.

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
  
  Se lo sfondo personalizzato non è impostato, viene mostrata una rotazione automatica delle immagini presenti in `src/assets/background` (JPG/PNG/WebP). L'intervallo di cambio immagine è configurabile dall'endpoint backend `/api/settings/ui-rotation` (default 15s, minimo 3s).

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

**UI Rotation:**
- La rotazione di sfondo è gestita dal backend: `GET /api/settings/ui-rotation` restituisce `{ seconds, enabled }` e `PUT /api/settings/ui-rotation` consente di aggiornare i valori (permessi owner). Il frontend non usa più variabili `VITE_` per questa funzionalità.

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

## Documentazione

- Guide dettagliate in `docs/`:
  - `docs/backups.md` — Backup e Restore (on‑demand, automatici, retention, esempi API)
  - `docs/modpack.md` — Installazione Modpack (loader, versioni, JAR personalizzati)
  - `docs/api.md` — Riferimento API (REST + WebSocket)
  - `docs/sftp.md` — SFTP livello OS (OpenSSH)
  - `docs/security.md` — Note di sicurezza
  - `docs/logging.md` — Logging di sistema

## SFTP OS‑level

La guida completa è in `docs/sftp.md`.
