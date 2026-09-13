# Simple Syslog Server v1.6.32

## User access management

- Added an **Edit** button before **Delete** for user accounts.
- Administrators can edit a user's username, password, and role (Administrator/Operator).
- Operators can access Settings only for their own User access section and can change only their own password.
- Operator password changes require the current password.
- Added a **Close** button to exit Edit without saving changes.
- Removed the permanently visible Administrator username / New password / Edit form from User access.
- User fields are now shown only while creating or editing an account.
- Delete remains Administrator-only and cannot be used on the currently signed-in account.
- Added protection against removing/demoting the last Administrator account.
