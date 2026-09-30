# Simple Syslog Server v1.6.22

## Stable 24-hour dashboard chart

- Changed the 24-hour line chart from a sliding 24-hour cutoff to 24 fixed hourly buckets.
- The chart now shows the current hour plus the previous 23 hourly buckets.
- Completed historical hours no longer decrease minute-by-minute as the rolling cutoff advances.
- The oldest hour is removed only when the clock moves into the next hour.
- Missing hours are explicitly returned as zero-value buckets, keeping the x-axis stable at exactly 24 hours.
- Live WebSocket updates remain enabled; only the current-hour bucket grows during the hour.
