# Simple Syslog Server v1.6.26

## Dashboard redesign

- Moved `Top devices` to the left of the 24-hour messages graph.
- Removed `Event severity`, `Event health`, and `Traffic concentration` from Dashboard.
- Added a `Latest 10 messages` table below the charts.
- Dashboard message table uses the same Date & time / Device / Severity / Message layout as Messages.
- Dashboard table has no filters, search, export, pagination, or page-size controls.
- Latest messages refresh automatically every 10 seconds without replacing existing data during background refresh.
- Full Syslog message text remains visible and wraps when needed.
