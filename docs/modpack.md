# Installazione Modpack

Guida all'installazione dei loader (Fabric, Forge, NeoForge, Quilt) e all'uso di JAR personalizzati.

## Supporto
- Fabric: latest loader
- Forge: versioni statiche per MC 1.16.5–1.21.1
- NeoForge: MC 1.20.1–1.21.1
- Quilt: latest loader
- Personalizzato: upload JAR

## API
- `GET /api/modpack/versions` — versioni supportate
- `POST /api/modpack/install` — avvia installazione `{ loader, mcVersion, manifest? }`
- WebSocket `/ws/modpack-install` — stato/progresso realtime

## Consigli
- Verifica Java 17+ installata (`JAVA_BIN`)
- Dopo l'installazione, controlla la pagina Console e avvia
- Non eliminare modpack con server in esecuzione

## File runtime generati automaticamente
- `eula.txt`: creato con `eula=true` al momento dell'installazione (richiesto da Minecraft).
- `user_jvm_args.txt`: creato con argomenti JVM di default (es. `-Xms1G`, `-Xmx2G`).

Questi file vengono scritti in `MC_DIR` (configurabile via variabile d'ambiente o dalle impostazioni backend) e non devono essere versionati. In produzione imposta `MC_DIR` alla directory finale del server: i file verranno generati lì durante l'installazione.
