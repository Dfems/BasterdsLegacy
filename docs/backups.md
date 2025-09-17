# Backup e Restore

Questa guida copre backup on‑demand, restore sicuri e pianificazione automatica.

## Funzionalità
- Backup `full` (intera cartella server) o `world` (solo mondo)
- Restore con stop/snapshot/start automatico
- Retention automatica: giorni e settimane configurabili
- Scheduler con preset e modalità custom

## API Principali
- `GET /api/backups` — elenco backup
- `POST /api/backups` — crea backup `{ mode: "full"|"world" }`
- `POST /api/backups/:id/restore` — ripristina backup
- `GET /api/backups/schedule` — legge configurazione
- `PUT /api/backups/schedule` — aggiorna preset o cron
- `GET /api/backups/presets` — lista preset disponibili

## Preset Disponibili

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

## Esempi
```bash
# Giornaliero alle 3:00 (modalità world)
curl -X PUT http://localhost:3000/api/backups/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"preset": "daily_3am"}'

# Custom: ogni 2 giorni alle 2:30
curl -X PUT http://localhost:3000/api/backups/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"enabled": true, "frequency": "custom", "mode": "world", "cronPattern": "30 2 */2 * *"}'

# Tre volte al giorno (08:00, 14:00, 20:00)
curl -X PUT http://localhost:3000/api/backups/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"preset": "triple_daily"}'

# Settimanale (lunedì) in modalità full
curl -X PUT http://localhost:3000/api/backups/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"preset": "weekly_monday"}'
```

## Variabili Ambiente
- `BACKUP_DIR`, `BACKUP_CRON`, `RETENTION_DAYS`, `RETENTION_WEEKS`
- Automatici: `AUTO_BACKUP_ENABLED`, `AUTO_BACKUP_CRON`, `AUTO_BACKUP_MODE`

## Logging
Ogni operazione è tracciata. Per dettagli vedi [Logging](../server/LOGGING.md).

## Gestione Errori
- Gli errori non interrompono il servizio né la schedulazione futura
- File parziali vengono rimossi automaticamente in caso di errore
- Dopo ogni backup viene applicata la retention configurata
- Modifiche ai piani di backup sono registrate nell'audit log
