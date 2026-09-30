# Simple Syslog Server v1.6.28

## Hourly message retention

- Changed the message retention cleanup schedule from once per day at 02:00 to once every hour.
- Cleanup now runs at minute 00 of every hour.
- On each run, messages older than the configured `Retention period (days)` are deleted.
- Existing `systemevents.receivedat` index is preserved and used for efficient age-based cleanup.
- Device cleanup behavior from v1.6.27 is preserved:
  - devices with no remaining messages can be deleted from Device inventory;
  - devices with no stored messages disappear from the Messages device filter.
