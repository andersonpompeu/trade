# Security Specification for Trader Dashboard

## 1. Data Invariants
- A user can only access (read/write) their own `/users/{userId}` configuration document.
- Trades can only be written to `/users/{userId}/trades/{tradeId}` if the creator of the trade matches the authenticated `userId`.
- Document IDs must conform to a strict alphanumeric pattern (`isValidId`).
- Core fields such as `userId` must be immutable after creation.
- Fields representing trade type can only be `'win'` or `'loss'`.
- Timestamps must correspond to the server's execution request time.

## 2. The "Dirty Dozen" Payloads (Red Team Attack Scenarios)
1. **Identity Spoofing**: User A attempts to create a config at `/users/userB` with User A's uid.
2. **Cross-user Reading**: User A attempts to list/get `/users/userB/trades`.
3. **Malicious ID Injection**: User A attempts to write a trade with a huge 2KB ID string containing injection chars.
4. **Invalid Type for Capital**: User A attempts to set `capital` to a boolean `true` on `/users/{userId}`.
5. **Negative Values**: Setting a negative `capital` or target.
6. **Ghost fields**: Attacking with `isAdmin: true` injection in UserConfig.
7. **Client Timestamp Spoof**: Sending custom outdated `createdAt` to bypass temporal checks.
8. **Invalid Trade Type**: Writing `type: "cancelled"` or other non-enum values.
9. **Zero-value poisoning**: Injecting non-numeric/null values to break calculations.
10. **Trade ownership theft**: User A attempts to write a trade to `/users/userA/trades/trade1` but sets `userId: "userB"`.
11. **Orphaned trade write**: Writing a trade under a user ID that does not exist or matches another user.
12. **Bypassing validation helpers**: Attempting to update without using `isValidUserConfig` or `isValidTrade` schemas.

## 3. Test Runner
Below is the draft structure of tests (`firestore.rules.test.ts` or verified rules validation) ensuring security gates deny all unauthorized actions.
