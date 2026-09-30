# Simple Syslog Server v1.6.12

## Server timezone correction

- Backend timezone offset is now read directly from Linux `date +%z`.
- Stale `/etc/timezone` values are ignored when they do not match `/etc/localtime`.
- Frontend retries `/api/timezone` instead of silently falling back to UTC.
- PostgreSQL runs internally in UTC (`timezone=UTC`) to keep TIMESTAMPTZ behavior unambiguous.
- UI still renders timestamps in the actual Linux server timezone.
