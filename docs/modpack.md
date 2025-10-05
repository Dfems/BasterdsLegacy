# Installazione Modpack

Guida all'installazione dei loader (Vanilla, Fabric, Forge, NeoForge, Quilt) e all'uso di JAR personalizzati.

## Supporto Automatico con API

Il sistema recupera automaticamente le versioni disponibili dalle API ufficiali:

- **Vanilla**: Server ufficiale Minecraft per tutte le versioni
- **Fabric**: Versioni dinamiche da API Fabric Meta (`https://meta.fabricmc.net`)
- **Forge**: Versioni da API Maven Forge con fallback a versioni statiche
- **NeoForge**: Versioni da API Maven NeoForge per MC 1.20.1+
- **Quilt**: Versioni dinamiche da API Quilt Meta (`https://meta.quiltmc.org`)
- **Personalizzato**: Upload manuale JAR

### Informazioni Versione

Ogni versione include i seguenti flag:
- `stable`: Versione stabile (non beta)
- `recommended`: Versione raccomandata (★)
- `latest`: Ultima versione disponibile ([Latest])

## API

- `GET /api/modpack/versions` — versioni supportate con dettagli (stable, recommended, latest)
- `POST /api/modpack/install` — avvia installazione
  ```json
  {
    "mode": "automatic",
    "loader": "Forge",
    "mcVersion": "1.21.1",
    "loaderVersion": "52.0.31"  // opzionale, se omesso usa latest/recommended
  }
  ```
- WebSocket `/ws/modpack-install` — stato/progresso realtime

## Consigli
- Verifica Java 17+ installata (`JAVA_BIN`)
- Dopo l'installazione, controlla la pagina Console e avvia
- Non eliminare modpack con server in esecuzione
- Se le API non sono disponibili, il sistema usa versioni statiche predefinite

## File runtime generati automaticamente
- `eula.txt`: creato con `eula=true` al momento dell'installazione (richiesto da Minecraft).
- `user_jvm_args.txt`: creato con argomenti JVM di default (es. `-Xms1G`, `-Xmx2G`).

Questi file vengono scritti in `MC_DIR` (configurabile via variabile d'ambiente o dalle impostazioni backend) e non devono essere versionati. In produzione imposta `MC_DIR` alla directory finale del server: i file verranno generati lì durante l'installazione.
