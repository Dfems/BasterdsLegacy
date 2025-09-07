# Refactor Whitelist - Documentazione

## Problema risolto

L'issue originale evidenziava che il sistema di whitelist non abilitava automaticamente la whitelist nel `server.properties` quando si aggiungevano utenti. Tipicamente, le configurazioni di Minecraft iniziano con `white-list=false`, ma quando aggiungiamo un utente alla whitelist, vorremmo che questa diventi automaticamente `true`.

## Analisi dell'implementazione precedente

Il sistema precedente funzionava così:
- **Con RCON abilitato**: Eseguiva comandi `whitelist add <player>` e `whitelist remove <player>`
- **Senza RCON**: Gestiva direttamente il file `whitelist.json`
- **Problema**: Non gestiva mai il parametro `white-list` nel `server.properties`

## Soluzione implementata

### 1. Nuovo modulo `serverProperties.ts`

Creato un modulo dedicato per gestire il file `server.properties`:

```typescript
// Funzioni principali
export const readServerProperties = async (): Promise<Map<string, string>>
export const writeServerProperties = async (properties: Map<string, string>): Promise<void>
export const isWhitelistEnabled = async (): Promise<boolean>
export const setWhitelistEnabled = async (enabled: boolean): Promise<void>
```

**Caratteristiche**:
- Parsing robusto del formato properties (ignora commenti e linee vuote)
- Gestione graceful di file mancanti
- Ordinamento alfabetico delle proprietà per consistenza
- Header di commenti per identificare i file generati da BasterdsLegacy

### 2. Refactor di `whitelist.ts`

Aggiornato il modulo esistente con logica di auto-abilitazione:

```typescript
export type WhitelistAction = 'add' | 'remove' | 'on' | 'off' | 'reload'

export const updateWhitelist = async (action: WhitelistAction, player: string): Promise<void>
```

**Nuova logica**:
1. **Quando si aggiunge un utente**:
   - Controlla se la whitelist è abilitata nel `server.properties`
   - Se disabilitata, la abilita automaticamente
   - Con RCON: esegue anche `whitelist on`
   - Procede con l'aggiunta normale (RCON o file)

2. **Nuove azioni supportate**:
   - `on`: Abilita whitelist (server.properties + RCON se disponibile)
   - `off`: Disabilita whitelist (server.properties + RCON se disponibile)
   - `reload`: Ricarica whitelist (solo RCON, se disponibile)

3. **Gestione errori**:
   - Errori RCON non bloccano l'aggiornamento del server.properties
   - Warning logs per errori non critici

### 3. Aggiornamento API routes

Esteso il supporto nelle API routes per gestire le nuove azioni:

```typescript
// Player è obbligatorio solo per add/remove
const requiresPlayer = ['add', 'remove'].includes(body.action)
if (requiresPlayer && !body.player) {
  return reply.status(400).send({ error: 'Invalid body' })
}
```

### 4. Test coverage completa

Creati test completi per tutte le funzionalità:

- **`serverProperties.test.ts`** (14 test): Testing del modulo server.properties
- **`whitelistIntegration.test.ts`** (12 test): Testing integrazione completa
- **`whitelist.test.ts`** (11 test aggiornati): Testing API frontend

**Totale: 37 test** che coprono:
- Lettura/scrittura server.properties
- Auto-abilitazione whitelist
- Gestione RCON e fallback file
- Gestione errori e casi edge
- Azioni whitelist (on/off/reload)

## Come funziona il refactor

### Scenario 1: Aggiunta primo utente (whitelist disabilitata)

```
1. Utente chiama POST /api/whitelist { action: 'add', player: 'TestPlayer' }
2. updateWhitelist('add', 'TestPlayer') viene chiamata
3. isWhitelistEnabled() → false
4. setWhitelistEnabled(true) → aggiorna server.properties
5. Se RCON: esegue 'whitelist on'
6. Se RCON: esegue 'whitelist add TestPlayer'
7. Se no RCON: aggiorna whitelist.json
```

**Risultato**: 
- `server.properties`: `white-list=true`
- `whitelist.json`: `[{"name": "TestPlayer"}]`

### Scenario 2: Aggiunta utente successivo (whitelist già abilitata)

```
1. Utente chiama POST /api/whitelist { action: 'add', player: 'TestPlayer2' }
2. updateWhitelist('add', 'TestPlayer2') viene chiamata
3. isWhitelistEnabled() → true
4. Salta auto-abilitazione (già abilitata)
5. Procede con aggiunta normale
```

**Risultato**: 
- `server.properties`: `white-list=true` (non modificato)
- `whitelist.json`: `[{"name": "TestPlayer"}, {"name": "TestPlayer2"}]`

### Scenario 3: Controllo esplicito whitelist

```
1. POST /api/whitelist { action: 'on', player: '' }
2. updateWhitelist('on', '') viene chiamata
3. setWhitelistEnabled(true) → forza abilitazione
4. Se RCON: esegue 'whitelist on'
```

## Demo funzionante

Il file `demo-whitelist.mjs` mostra l'esatto comportamento:

```bash
node demo-whitelist.mjs
```

Output:
```
🚀 DEMO: Auto-abilitazione Whitelist
📋 Whitelist attualmente disabilitata in server.properties
⚡ Auto-abilitazione whitelist nel server.properties...
✅ Whitelist abilitata nel server.properties
👤 Utente 'TestPlayer1' aggiunto a whitelist.json
```

## Vantaggi della soluzione

1. **Comportamento intuitivo**: Aggiungere un utente abilita automaticamente la whitelist
2. **Compatibilità**: Funziona sia con RCON che con gestione file
3. **Robustezza**: Gestione graceful di errori e file mancanti
4. **Estensibilità**: Supporto per controlli espliciti (on/off/reload)
5. **Test coverage**: 37 test assicurano affidabilità
6. **Non breaking**: Non modifica API esistenti, solo aggiunge funzionalità

## Files modificati/creati

- ✅ **Nuovo**: `server/src/minecraft/serverProperties.ts`
- ✅ **Modificato**: `server/src/minecraft/whitelist.ts`
- ✅ **Modificato**: `server/src/routes/whitelist.ts`
- ✅ **Nuovo**: `src/__tests__/serverProperties.test.ts`
- ✅ **Nuovo**: `src/__tests__/whitelistIntegration.test.ts`
- ✅ **Modificato**: `src/__tests__/whitelist.test.ts`
- ✅ **Demo**: `demo-whitelist.mjs`

La soluzione è completa, testata e pronta per l'uso in produzione.