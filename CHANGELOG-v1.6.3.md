# Simple Syslog Server v1.6.3

## Reliable device identity

- Collector now identifies a sender by the real UDP/TCP source IP (`fromhost-ip`).
- Parsed/reported hostname is stored separately in `reported_hostname`.
- Invalid date/time-like hostnames are ignored for display purposes.
- Device display priority is: custom alias → valid reported hostname → source IP.
- Settings now includes a Device inventory with source IP, reported hostname, display name and hostname validation status.
- Existing PostgreSQL volumes are migrated automatically by the backend.
- Collector waits for the backend healthcheck so the schema migration completes before new syslog rows are inserted.
- Full message capture from v1.6.2 (`syslogtag + msg`) is preserved.
