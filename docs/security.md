# Sicurezza

Linee guida rapide per utilizzare BasterdsLegacy in sicurezza.

- Cambia sempre `JWT_SECRET` in produzione
- Non committare file `.env`
- Usa HTTPS dietro un reverse proxy (Nginx/Caddy)
- Limita RCON a `127.0.0.1`
- Usa ruoli minimi necessari (owner/user/viewer)
- Aggiorna regolarmente dipendenze e Java
- Backup off‑site periodici
