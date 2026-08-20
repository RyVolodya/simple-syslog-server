# Simple Syslog Server v1.6.18

## Traffic concentration logic restored

- `Top devices` remains unchanged and continues to show individual Top 10 devices.
- `Traffic concentration` no longer duplicates `Top devices`.
- Traffic concentration restores the previous grouped logic, now calculated across the Top 10 set:
  - busiest device
  - devices #2–10
  - all remaining devices
- Tooltip and center values remain percentage-formatted with up to two decimal places.
