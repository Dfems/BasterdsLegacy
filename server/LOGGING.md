# Logging System Documentation

This server includes a comprehensive logging system designed to track all server activities in a human-readable format.

## Features

### 🔍 What Gets Logged
- **API Requests**: All incoming API calls with method, URL, user, duration, and status
- **User Actions**: Login, logout, user creation, permission changes
- **Server Operations**: Server start/stop, configuration changes
- **Minecraft Server**: Power operations (start/stop/restart)
- **File Operations**: File uploads, deletions, backups
- **Automated Jobs**: Scheduled tasks like backups, log cleanup
- **Errors**: All system errors with context and user-friendly descriptions

### 📁 Log Files
- **Location**: Configurable via `LOG_DIR` (default: `./logs/`)
- **Format**: JSON for parsing + human-readable messages
- **Rotation**: Automatic cleanup based on retention policy
- **File naming**: `app.log` (current), older files preserved based on settings

### ⚙️ Configuration

Add these environment variables to your `.env` file:

```bash
# Logging Configuration
LOG_LEVEL=info                 # trace, debug, info, warn, error, fatal
LOG_DIR=./logs                 # Directory for log files
LOG_FILE_ENABLED=true          # Enable/disable file logging
LOG_RETENTION_DAYS=30          # Keep logs for X days
LOG_MAX_FILES=10               # Maximum number of log files to keep
```

### 🎛️ API Endpoints

#### View System Logs
```
GET /api/logs/system?lines=1000
```
Returns parsed, human-readable system logs.

#### Log Statistics
```
GET /api/logs/stats
```
Returns information about log files, sizes, and retention settings.

#### Manual Log Cleanup
```
POST /api/logs/cleanup
```
Manually trigger log file cleanup (requires user permission).

### 📊 Log Levels

- **INFO**: Normal operations (API calls, job completions)
- **WARN**: Important events (server start/stop, configuration changes)
- **ERROR**: Errors and failures
- **DEBUG**: Detailed information (development only)

### 🔄 Automatic Maintenance

- **Daily Cleanup**: Runs at 4:00 AM to remove old log files
- **Retention Policy**: Configurable days and maximum file count
- **File Rotation**: Automatic management of log file sizes

### 📋 Log Message Format

Messages are designed to be understood by non-technical users:

```
✅ Good Examples:
- "User logged in successfully"
- "Minecraft server started"
- "Backup created: backup_20231213_030000 (15.2 MB)"
- "API Request completed: POST /api/backups - Status: 200 - Duration: 1.2s"

❌ Technical Examples (what we avoid):
- "POST /api/auth/login 200 OK 45ms"
- "Process spawned with PID 1234"
- "Database query executed in 0.045s"
```

### 🛠️ Troubleshooting

#### No Log Files Created
1. Check `LOG_FILE_ENABLED=true` in your `.env`
2. Verify `LOG_DIR` path is writable
3. Check server console for initialization errors

#### Log Files Too Large
1. Reduce `LOG_RETENTION_DAYS` setting
2. Lower `LOG_MAX_FILES` setting
3. Manually run cleanup: `POST /api/logs/cleanup`

#### Missing Log Entries
1. Check `LOG_LEVEL` setting (info or lower)
2. Verify the operation triggers logging (not all operations are logged)
3. Check server console for audit log errors

### 🔧 Development

To test the logging system:

```bash
cd server
npm run type-check
node scripts/test-logging.mjs
```

To view real-time logs during development:

```bash
cd server
npm run dev:ts
```

### 🏗️ Architecture

- **Pino Logger**: High-performance JSON logging
- **Fastify Integration**: Automatic request/response logging
- **Audit System**: Structured event logging for important actions
- **File Management**: Automatic rotation and cleanup
- **API Access**: RESTful endpoints for log viewing and management

### 🔒 Security Notes

- Log files may contain sensitive information
- Access to log APIs requires authentication
- User actions are tracked with user IDs
- No passwords or secrets are logged

---

For more details, see the source code in:
- `src/lib/logger.ts` - Logger configuration
- `src/lib/audit.ts` - Audit event system
- `src/lib/request-logger.ts` - API request logging
- `src/routes/logs.ts` - Log management APIs