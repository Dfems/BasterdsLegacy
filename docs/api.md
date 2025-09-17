# API Reference (REST + WebSocket)

Questa pagina riepiloga gli endpoint principali. Per dettagli operativi consulta anche i README in `server/`.

## Auth
- `POST /api/auth/login`

## Server & Power
- `GET /api/status`
- `POST /api/power` `{ action: "start"|"stop"|"restart" }`

## Console
- WS: `/ws/console?token=...`
- REST complementari: `GET /api/console/output`, `POST /api/console/command`

## Modpack
- `GET /api/modpack/versions`
- `POST /api/modpack/install`

## File Manager
- `GET /api/files?path=/`
- `POST /api/files/upload`
- `POST /api/files/rename`
- `DELETE /api/files`
- `POST /api/files/zip`
- `POST /api/files/unzip`

## Backups
- `GET /api/backups`
- `POST /api/backups`
- `POST /api/backups/:id/restore`
- `GET /api/backups/schedule`
- `PUT /api/backups/schedule`
- `GET /api/backups/presets`

## Logs
- `GET /api/logs/system?lines=1000`
- `GET /api/logs/stats`
- `POST /api/logs/cleanup`
