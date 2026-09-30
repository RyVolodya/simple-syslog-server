# Simple Syslog Server v1.5

## Retention
- Retention is now configured in days.
- Default retention is 365 days.
- Minimum retention is 1 day.
- Daily cleanup removes messages older than the configured number of days.
- Existing databases are migrated automatically.

## Authentication and authorization
- Full login page and server-side sessions.
- Default first-run account: `admin` / `syslog`.
- Forced password change after first login.
- Roles: `Operator` (read-only) and `Administrator` (full access).
- Administrator can create and delete users and choose their role.
- Newly created users must change the temporary password after first login.
- Administrator username can be changed.
- Username policy: at least 5 characters, ASCII letters and digits only.
- REST API and WebSocket are authenticated.
- Operator write requests are rejected by backend authorization.
- Session cookie is HttpOnly/SameSite=Lax and sessions expire after 24 hours.
