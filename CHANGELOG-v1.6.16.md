# Simple Syslog Server v1.6.16

## Event health percentages

- Event health donut now uses percentage values instead of raw message counts.
- Critical / Error, Warning and Normal are calculated as shares of all events from the last 24 hours.
- Hover/center values are formatted as percentages, for example `98%` or `1,42%`.
- Event health total shows `100%` when data is present.
- Existing semantic colors are preserved:
  - Critical / Error: purple
  - Warning: red
  - Normal: green
