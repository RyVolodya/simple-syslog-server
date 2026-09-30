# Simple Syslog Server v1.6.29

## Messages severity cards

- Added Alert (severity 1) and Emergency (severity 0) cards.
- Combined Informational (severity 6) and Notice (severity 5) into `Informational/Notice`.
- `Informational/Notice` shows the combined 24-hour count and opens both severities when clicked.
- All six cards show counts for the last 24 hours.
- Clicking each card displays the corresponding messages from the last 24 hours.
- All six cards are arranged in one row on desktop; responsive behavior is retained on smaller screens.
- Backend filtering now supports multiple severities in one request.
