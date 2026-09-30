# Simple Syslog Server v1.6.10

## Host/server timezone

- Removed hard-coded `Europe/Berlin`.
- PostgreSQL, backend and collector inherit `/etc/localtime` and `/etc/timezone` from the Linux host.
- Added `/api/timezone` so the frontend knows the server IANA timezone.
- Messages timestamps, Header date and Dashboard hourly chart use the server timezone.
- Message From/To filters are interpreted in the server timezone.
- Excel and Print timestamps use the server timezone.
