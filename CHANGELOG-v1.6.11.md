# Simple Syslog Server v1.6.11

## Reliable server time

- PostgreSQL now assigns `receivedat` with `NOW()` instead of rsyslog sending a timezone-less timestamp.
- `/api/timezone` validates `/etc/timezone` against the container's actual local offset.
- If the zone name is stale or unavailable, the frontend falls back to the server offset.
- Messages, Dashboard, filters, Excel and Print continue to use server time.
- Existing historical rows are not rewritten.
