# Simple Syslog Server v1.5 — Docker Edition

A self-contained Syslog dashboard stack running in Docker Compose.

## Architecture

```text
Network devices
   │ UDP/TCP 514
   ▼
rsyslog collector
   │ ompgsql
   ▼
PostgreSQL
   │ LISTEN / NOTIFY
   ▼
Node.js + Express + WebSocket
   │ /api + /ws
   ▼
Nginx + React
```

## Containers

- `simple-syslog-postgres` — PostgreSQL database and persistent log storage.
- `simple-syslog-collector` — rsyslog receiver on UDP/TCP 514 and PostgreSQL writer.
- `simple-syslog-backend` — REST API, PostgreSQL LISTEN/NOTIFY, WebSocket realtime updates, retention job.
- `simple-syslog-frontend` — React application served by Nginx; Nginx proxies `/api` and `/ws` to the backend.

## Requirements

- Docker Engine
- Docker Compose v2
- TCP/UDP 514 available on the Docker host, or change the published ports in `.env`
- A web port such as TCP 8080

## Installation

```bash
cp .env.example .env
nano .env
```

At minimum, change:

```env
POSTGRES_PASSWORD=use-a-strong-password
```

Then start the stack:

```bash
docker compose up -d --build
```

Check status:

```bash
docker compose ps
```

Open:

```text
http://SERVER_IP:8080
```

## Syslog ports

Default listeners:

```text
UDP 514
TCP 514
```

They can be changed in `.env`:

```env
SYSLOG_UDP_PORT=514
SYSLOG_TCP_PORT=514
WEB_PORT=8080
```

## MikroTik example

Replace `192.168.1.100` with the Docker host address.

```routeros
/system logging action
add name=simple-syslog target=remote remote=192.168.1.100 remote-port=514

/system logging
add action=simple-syslog topics=info
add action=simple-syslog topics=warning
add action=simple-syslog topics=error
add action=simple-syslog topics=critical
```

## Linux / rsyslog client example

Create `/etc/rsyslog.d/60-simple-syslog.conf`:

```text
*.* @192.168.1.100:514
```

For TCP use two `@` characters:

```text
*.* @@192.168.1.100:514
```

Restart rsyslog:

```bash
sudo systemctl restart rsyslog
```

## Useful commands

View all containers:

```bash
docker compose ps
```

Follow logs:

```bash
docker compose logs -f
```

Collector only:

```bash
docker compose logs -f collector
```

Backend only:

```bash
docker compose logs -f backend
```

PostgreSQL shell:

```bash
docker compose exec postgres psql -U syslog -d rsyslog
```

Recent messages:

```sql
SELECT id, receivedat, fromhost, priority, message
FROM systemevents
ORDER BY receivedat DESC
LIMIT 20;
```

## Data persistence

Docker named volumes are used:

```text
postgres_data   PostgreSQL database
rsyslog_queue   collector queue
```

Normal container recreation does not remove these volumes.

To stop the application without deleting data:

```bash
docker compose down
```

To delete the application **and all stored syslog data**:

```bash
docker compose down -v
```

## Retention

The backend runs a retention task every day at 02:00. Retention is configured in **days** from Settings.

- Default: `365` days
- Minimum: `1` day
- Messages older than the configured period are automatically deleted from `systemevents`.
- Existing PostgreSQL volumes are migrated automatically from the older month-based setting.

The cleanup query is parameterized and uses `systemevents.receivedat`.

## Device aliases

Device aliases are stored in the separate `devices` table. Renaming a device updates only its device record; historical syslog rows are not rewritten.

## Reverse proxy design

The browser never connects to `localhost:5000` directly.

Nginx exposes a single frontend endpoint and proxies:

```text
/api/*  -> backend:5000/api/*
/ws     -> backend:5000/ws
```

This allows the application to work when accessed through the Docker host IP, DNS name, or a future HTTPS reverse proxy.

## Authentication and roles

The application enforces authentication for REST API, Dashboard, Messages and WebSocket connections. Sessions are stored server-side in PostgreSQL and the browser receives only an `HttpOnly` session cookie.

Default account on a new installation:

```text
Username: admin
Password: syslog
```

The default administrator must change the temporary password immediately after the first sign-in.

Roles:

- **Operator** — read-only access to Dashboard and Messages.
- **Administrator** — full access, including Settings, device rename, retention and user management.

Administrator usernames can be changed in Settings. Usernames must be at least 5 characters and may contain ASCII letters and digits only. New user passwords must be at least 8 characters and are temporary until the first login.

## Security notes

- Passwords are hashed with Node.js `scrypt` and never returned to the browser.
- Session identifiers are random, stored only as SHA-256 hashes in PostgreSQL, and sent to the browser in an `HttpOnly`, `SameSite=Lax` cookie.
- Sessions expire after 24 hours.
- Changing a password invalidates the user's other active sessions.
- Login has a dedicated brute-force rate limit.
- PostgreSQL and backend ports are not published to the host.
- WebSocket upgrades are authenticated and accepted only on `/ws`.
- `Operator` write access is denied by the backend, not only hidden in the UI.
- Set `COOKIE_SECURE=true` when the web UI is published through HTTPS.

## Project structure

```text
Simple-Syslog-Server-v1.0/
├── backend/
│   ├── Dockerfile
│   └── src/
├── collector/
│   ├── Dockerfile
│   ├── entrypoint.sh
│   └── rsyslog.conf.template
├── database/
│   └── init.sql
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

## v1.0 Docker changes

- Added PostgreSQL container with persistent volume and initialization schema.
- Added rsyslog collector container for UDP/TCP 514.
- Added a persistent rsyslog action queue.
- Added multi-stage backend image using Node.js 22 Alpine.
- Added multi-stage frontend image using Node.js 22 + Nginx.
- Added `/api` and `/ws` Nginx reverse proxy.
- Removed hardcoded browser connections to `localhost:5000`.
- Restricted WebSocket upgrades to `/ws`.
- Enabled API rate limiting.
- Consolidated PostgreSQL pool usage.
- Fixed message filtering to use the `systemevents` schema.
- Added `devices` table for efficient aliases.
- Fixed retention job and parameterized retention deletion.
- Added health endpoint and Docker health checks.
- Removed development artifacts and secrets from the release package.


## v1.6.3 — Reliable device identity

The collector now treats the actual UDP/TCP source IP as the stable device identity and stores the vendor-reported hostname separately. The UI displays a device using this priority: custom alias, valid reported hostname, source IP. Date/time-like hostnames such as `Aug`, `2026-08-19`, `19`, or `22:15:01` are ignored for display purposes.

After upgrading an existing installation, rebuild the backend and collector (or the full stack). The backend migrates the PostgreSQL schema before the collector starts accepting new syslog messages. Existing historical rows are preserved.
