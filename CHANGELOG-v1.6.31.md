# Simple Syslog Server v1.6.31

## Full device purge

- Added a permanent `Delete` action for every device in Settings → Device inventory.
- Deleting a device now removes all Syslog messages belonging to its source IP and then removes the device record in one PostgreSQL transaction.
- Added a confirmation/status modal showing the selected device, source IP and stored message count.
- During deletion the modal shows an active progress state and prevents accidental closing.
- On success the modal reports the exact number of deleted Syslog messages.
- On failure the transaction is rolled back and the modal shows the backend error with a retry option.
- The Messages device filter is forced to refresh after leaving Settings so deleted devices do not remain in the filter cache.
- If a deleted source sends Syslog again later, it will be discovered again automatically as a new device inventory entry.
