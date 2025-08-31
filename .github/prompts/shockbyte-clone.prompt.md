# Prompt: Shockbyte‑like Single‑Server Panel (BasterdsLegacy)

**Ruolo dell’Agent (VS Code + GitHub Copilot Pro)**  
Applica in autonomia e **fino al completamento** tutte le attività elencate, per trasformare il progetto in un pannello “mini‑Shockbyte” **single‑server**.  
**Parla sempre in italiano.**  
**Commit:** usa **commit atomici** con messaggi in **inglese** nello stile Conventional Commits (`feat|fix|chore|refactor|docs|test|ci|build`).  
**Operazioni su file — OBBLIGO SHELL:** per rinominare/spostare/cancellare/creare file o cartelle usa **sempre la shell** (`git mv`, `git rm -r`, `rm -rf`, `mkdir -p`, `touch`; su Windows l’equivalente PowerShell), così i rename sono **tracciati da Git**.  
**Non fermarti** finché **tutti i task** non sono completati e la pipeline `format:check`, `lint`, `type-check`, `test`, `build` è **verde**.

---

## Contesto & Obiettivo

- Target: **un solo server Minecraft** (uso personale, 1 owner + al massimo 2 user viewer/operator).
- Ambienti: **Linux, Windows, Raspberry Pi 5** (JDK Temurin 17/21 nelle architetture corrette).
- Feature richieste: **console realtime**, **start/stop/restart**, **whitelist/players**, **File Manager web**, **SFTP OS‑level** (utente dedicato), **backup/restore** (anche schedulati), **installazione modpack** (**loader + versione**), **delete con quarantena**.
- Requisito di leggerezza: niente microservizi, niente Redis/queue; tutto in **un servizio Node.js** con **Fastify + TypeScript** e **SQLite + Prisma**.
- Il repository contiene già `.github/copilot-instructions.md` con regole generali: **rispettale** e integrale dove serve.

---

## Modalità Operativa

1. Lavora su branch: `feat/shockbyte-like-single-server` (crealo se manca).
2. Procedi **per step** (roadmap sotto). Dopo **ogni step** esegui:
   ```bash
   npm run format:check && npm run lint && npm run type-check && npm run test && npm run build
   ```
   Se fallisce, **correggi e ripeti** finché passa.
3. Effettua **commit piccoli e coerenti** (uno scopo = un commit). Esempi in ogni step.
4. Dove devi eliminare o rinominare file/cartelle, **usa la shell** (no operazioni manuali da UI).

---

## Roadmap (step‑by‑step)

### 0) Pre‑flight & Setup

- Crea nuova cartella **`server/`** (backend Fastify single‑service).
- Assicurati Node 20+, TypeScript 5, ESLint flat type‑aware, Prettier, Vitest, Husky + lint‑staged, CI attiva (se mancano: installa e configura).
- Aggiorna `vite.config.ts` (**frontend**) con alias `@` → `./src` e **proxy** `'/api' → http://localhost:3000`.
- Aggiorna **README** root (setup dev, comandi, struttura).  
  **Commit:**
- `chore: rename legacy backend to server-old`
- `chore: scaffold new server backend folder`
- `chore: ensure lint/format/type-check/test/build scripts and vite proxy`

---

### 1) Backend Fastify + TS (single‑service)

**Dipendenze**

```bash
npm i fastify @fastify/websocket @fastify/cors @fastify/helmet @fastify/jwt pino pino-pretty
npm i zod fs-extra node-pty pidusage node-cron archiver tar-stream
npm i -D prisma @prisma/client
npm i -D typescript ts-node @types/node @types/archiver @types/tar-stream vitest @vitest/coverage-v8
```

> Nota: inizializza Prisma con SQLite e genera schema base (vedi step 9).

**Struttura**

```
server/
  .env.example
  src/
    app.ts            # bootstrap fastify + plugins (helmet, cors, jwt, ws)
    routes/           # power, console, logs, whitelist, files, backups, modpack, users, health
      power.ts
      console.ts
      logs.ts
      whitelist.ts
      files.ts
      backups.ts
      modpack.ts
      users.ts
      health.ts
    lib/
      config.ts       # env, percorsi, costanti
      logger.ts       # pino
      auth.ts         # jwt guard (owner/user/viewer)
      ws.ts           # helpers ws
    minecraft/
      process.ts      # node-pty spawn, stato/metriche
      rcon.ts         # client rcon opzionale (bind 127.0.0.1)
      logs.ts         # writer + rotazione + lettura paginate
      whitelist.ts    # gestione via rcon o file
      backups.ts      # tar.gz + restore + retention
      modpack.ts      # installatori headless loader+versione
    filemgr/
      fs.ts           # ls/upload/download/rename/delete/zip/unzip (sandbox)
  tsconfig.json
  package.json
```

**File da creare**

- `server/src/app.ts`: registra `helmet`, `cors`, `jwt`, `@fastify/websocket`, route; avvia su `:3000`.
- `server/src/lib/config.ts`: carica `.env`, default:
  ```env
  PORT=3000
  JWT_SECRET=change_me
  MC_DIR=./server/runtime
  BACKUP_DIR=./server/runtime/backups
  JAVA_BIN=java
  RCON_ENABLED=false
  RCON_HOST=127.0.0.1
  RCON_PORT=25575
  RCON_PASS=
  BACKUP_CRON=0 3 * * *
  RETENTION_DAYS=7
  RETENTION_WEEKS=4
  ```
  **Commit:**
- `feat(server): scaffold fastify app and core folders`
- `feat(server): add config, logger, jwt, websocket setup`

---

### 2) Console realtime (PTY ↔ WS) + storico log

**Implementazione**

- `minecraft/process.ts`: avvia Java con `node-pty` (cwd=`MC_DIR`), gestisce stdin/out, stato (`RUNNING|STOPPED|CRASHED`) e metriche (`pidusage`).
- `lib/ws.ts` + `routes/console.ts`: **WebSocket** `/ws/console?token=...` (JWT obbligatorio).
- Messaggi WS:
  - **Client→Server**: `{"type":"cmd","data":"say Hello"}`
  - **Server→Client**:
    - `{"type":"log","data":{"ts":<unix_ms>,"line":"[INFO] ..."}}`
    - `{"type":"status","data":{"state":"RUNNING|STOPPED|CRASHED"}}`
    - `{"type":"metric","data":{"cpu":0.42,"memMB":1820}}`
- `minecraft/logs.ts`: scrittura **sempre** su `latest.log` + **rotazione giornaliera**; lettura **paginata**.
- `routes/logs.ts`: `GET /api/logs?cursor=<ts>&limit=1000` → `{lines, nextCursor}` + SSE fallback.  
  **Commit:**
- `feat(server): implement console websocket bridge and log pipeline with rotation`

---

### 3) Power: start/stop/restart + stati/metriche

**REST**

- `POST /api/power` `{ "action": "start"|"stop"|"restart" }`
- `GET /api/status` → `{ state, pid, uptimeMs, cpu, memMB }`
  **Processi**
- Usa `JAVA_BIN` e `user_jvm_args.txt` se presente; su Windows **no** `shell:true`; chiusura graceful + timeout kill.  
  **Commit:**
- `feat(server): power endpoints and process lifecycle`

---

### 4) Whitelist/Players (chi può entrare)

**Preferenza: RCON locale** (bind 127.0.0.1; backend fa proxy).

- `POST /api/whitelist` `{ action: "add"|"remove", "player": "Nick" }`
- `GET /api/whitelist` → elenco (via `whitelist list` parse o file)
- Helper per `server.properties`: `enforce-whitelist=true`.  
  **Fallback file**: aggiorna `whitelist.json` con lock; reload su restart.  
  **Commit:**
- `feat(server): whitelist management via rcon with local binding`

---

### 5) File Manager web (sandbox = MC_DIR) + guida SFTP OS‑level

**API web**

- `GET /api/files?path=/` → list (name, type, size, mtime)
- `POST /api/files/upload` (multipart/chunk)
- `POST /api/files/rename` `{ from, to }`
- `DELETE /api/files` `{ path }`
- `POST /api/files/zip` `{ paths[], out }`
- `POST /api/files/unzip` `{ file, to }`
  > Evita modifiche pericolose mentre `RUNNING` (warning/confirm).  
  > **SFTP**: **non** implementare server SFTP embedded. Documenta **OpenSSH** (utente dedicato chroot nella dir del server).  
  > **Commit:**
- `feat(server): file manager endpoints (ls/upload/download/rename/delete/zip)`
- `docs: add SFTP OS-level setup guide`

---

### 6) Backup/Restore + scheduler leggero

**REST**

- `POST /api/backups` `{ mode: "full"|"world" }` → produce `.tar.gz` in `BACKUP_DIR`
- `GET /api/backups` → elenco + size + createdAt
- `POST /api/backups/:id/restore` → stop → snapshot corrente → restore → start
  **Scheduler**
- `node-cron` con `BACKUP_CRON` (default 03:00). **Retention**: `RETENTION_DAYS` + `RETENTION_WEEKS`.  
  **Commit:**
- `feat(server): backups create/list/restore with tar.gz and retention`

---

### 7) Modpack Installer (loader + versione)

**Flow**

1. Scegli **loader** (Forge/Fabric/Quilt/NeoForge) + **MC version**.
2. Scarica/avvia installer **headless** (`--installServer` o equivalente).
3. Se manifest (Modrinth/CF), risolvi deps e copia in `mods/`.
4. Genera `eula.txt`, `user_jvm_args.txt` (flags), valida `JAVA_BIN`.  
   **REST**

- `POST /api/modpack/install` `{ loader, mcVersion, manifest? }`  
  **Commit:**
- `feat(server): modpack installation flow (loader+version)`

---

### 8) Delete con quarantena

- `DELETE /api/server` → sposta `MC_DIR` in `quarantine/<timestamp>`; purge schedulato (48h).  
  **Commit:**
- `feat(server): soft-delete with quarantine and scheduled purge`

---

### 9) Persistenza minima con Prisma/SQLite

**Schema (indicativo)**

- `User(id, email, passHash, role)`
- `CommandHistory(id, cmd, ts, exit, durationMs)`
- `Backup(id, path, size, createdAt, notes)`
- `Setting(key, value)` (JAVA_BIN, flags, paths, ecc.)
  > Single‑server → nessun `serverId`.  
  > **Task**
- Inizializza Prisma, crea `schema.prisma`, genera client, wrapper `db.ts`.  
  **Commit:**
- `feat(server): init prisma with sqlite and base models`

---

### 10) Security & Auth minima

- **JWT** HS256; ruoli: `owner`, `user`, `viewer` (max 3 utenti).
- Rate‑limit su `/api/command` e su socket (es. 10 cmd/5s).
- **Audit log**: salva chi invia comandi/power + timestamp.  
  **Commit:**
- `feat(server): minimal jwt auth, simple rbac and audit log`

---

### 11) Cross‑platform hardening

- **JAVA_BIN**: check `java -version` al boot, warning su arch/vers incompatibili.
- **Path**: `path.join`, preserva permessi su Linux; su Windows evita symlink.
- **Porte**: RCON solo `127.0.0.1`; HTTP :3000; MC in porta configurabile.
- **Windows**: nessun `shell:true`; opzionale NSSM per run come servizio.
- **Raspberry**: Temurin ARM; attenzione a RAM/flags.  
  **Commit:**
- `chore(server): cross-platform checks and defaults`

---

### 12) Frontend (React + Vite + TS + Chakra)

**Dipendenze**

```bash
npm i @chakra-ui/react @emotion/react @emotion/styled framer-motion
npm i @tanstack/react-query zustand
```

**Pagine**

- **Dashboard** (stato server, azioni rapide)
- **Console** (log live, input comandi, filtri, export)
- **Players/Whitelist** (lista/add/remove)
- **Files** (file manager)
- **Backups** (lista, crea, schedula, restore)
- **Modpack** (loader/versione)
- **Settings** (JAVA_BIN, path, RCON, SFTP info)
- **Login** / **NotFound**  
  **Componenti chiave**
- `LogViewer` (virtualized), `CommandBar`, `StatusBadge`, `ConfirmDialog`,  
   `FilesTable`, `UploadDropzone`, `BackupCard`, `ScheduleForm`.  
  **Commit:**
- `feat(web): scaffold chakra theme and app layout`
- `feat(web): console, backups, files, whitelist, modpack, settings pages`

---

### 13) Test, CI & DoD

**Test (Vitest)**

- Utils: parsing log level, build args JVM.
- Endpoint `status`/`power` con mock process manager.
- File ops “dry run”.  
  **CI**: assicurati che il workflow esegua `format:check`, `lint`, `type-check`, `test`, `build`.  
  **Definition of Done (ogni milestone)**
- Pipeline locale e CI **verdi**.
- Console live stabile (≥ 30 min), no memory leak evidente.
- Start/stop/restart affidabili su Linux e Windows; smoke su Raspberry.
- Backup on‑demand + restore testati; schedulazione attiva.
- Whitelist add/remove funzionanti (RCON o file).  
  **Commit:**
- `test: add unit tests for core utilities and endpoints`
- `ci: ensure full pipeline checks`

---

## Regole di Sicurezza & Qualità (sempre attive)

- **Shell obbligatoria** per operazioni su file (rename/move/delete/create).
- **Zero `any`** non motivati; **zero `@ts-ignore`** non motivati.
- Import ordinati, Prettier coerente, ESLint type‑aware senza warning.
- Niente `shell:true` negli spawn; gestione segnali e timeout kill.
- **RCON** solo su localhost; non esporre credenziali in chiaro.
- Documenta nel README i passaggi SFTP OS‑level e le note licenza Modpack/CF.

## Validazione finale (blocking)

Esegui in root:

```bash
npm ci
npm run format:check
npm run lint
npm run type-check
npm run test
npm run build
```

Se qualcosa fallisce, **correggi e ripeti**. **Non chiudere** i lavori finché **tutto** è verde.
