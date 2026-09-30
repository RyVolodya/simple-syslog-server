# Simple Syslog Server v1.6.27

## Device inventory cleanup

- Device inventory now exposes each device's current Syslog message count.
- A delete icon appears only for devices with zero messages in `systemevents`.
- Deletion is protected server-side: the backend refuses to delete a device if any messages still exist for its source IP.
- Deleting an unused device immediately refreshes Device inventory.
- The Messages device filter now lists only devices that currently have at least one stored Syslog message.
- Devices automatically disappear from the Messages filter after their last stored message is removed by retention/cleanup.
