# Testnet Acceptance Matrix

Record the date, tester, release commit, and evidence link for each row. Never record passwords, API keys, session cookies, OTP values, phone numbers, QR payloads, entity secrets, or private keys.

| Area | Required test | Expected result |
|---|---|---|
| Public deployment | Open `/`, `/login`, `/dashboard`, `/send`, `/agent`, `/history`, and `/docs` while signed out | Public pages load as designed; protected data is not exposed; no route is a 404 |
| Authentication | Request and verify an email OTP for a fresh user | OTP expires, cannot be replayed, and creates only that user's session |
| Session lifecycle | Refresh, log out, and reuse the old session cookie | Rotation succeeds; logout invalidates the old session |
| User isolation | Sign in as two different users and inspect wallet, plans, rules, intents, and receipts | Neither user can read or mutate the other's records |
| Recipient binding | Ask to send USDC without an address, then with an explicit valid Arc testnet address | Missing address is rejected; the exact supplied address is preserved |
| Unsupported capability | Request yield, staking, USYC, ERC-8183, or new automation | API returns `CAPABILITY_UNAVAILABLE`; no executable plan is stored |
| Bridge scope | Prepare a bridge route | Plan is review-only and has no executable plan ID |
| Manual gate | Attempt execution while `ROVA_EXECUTION_ENABLED=false` | Request fails closed before transaction submission |
| Approval code | Use missing, malformed, wrong, expired, then valid one-time approval codes | Invalid attempts fail; a valid code can claim only its matching owner-bound plan once |
| Replay control | Reuse a consumed plan ID and approval code | Replay fails without another provider submission |
| Amount ceiling | Prepare and execute above `ROVA_MAX_MANUAL_AMOUNT_USDC` | Deterministic policy rejects it |
| Automation creation | POST a new rule or standing intent | Server returns paused/unavailable |
| Automation reactivation | PATCH a cancelled rule or intent to `active` | Server rejects reactivation; cancellation remains allowed |
| Engine outage | Remove Supabase access or stop the database during evaluation | Engine returns no executable work and does not use realtime payloads as authority |
| Duplicate workers | Run two engine workers against one eligible policy | Exactly one worker receives the atomic claim |
| Receipt integrity | Complete an approved bounded transfer | Database receipt and Arc explorer hash identify the same transaction and owner plan |
| Ambiguous failure | Interrupt after provider submission but before final persistence | Plan is not blindly retried; operator reconciliation is required |
| WhatsApp linking | Owner follows the link flow on their own device | The intended phone account links to the intended Rova user without sharing credentials |
| WhatsApp confirmation | Request a bounded action, let one code expire, then use a fresh code | Expired/replayed code fails; fresh code applies only to the matching request |
| Disabled WhatsApp execution | Keep `ROVA_WHATSAPP_EXECUTION_ENABLED=false` and request money movement | Request fails closed without transaction submission |
| Secret hygiene | Inspect hosting variables, client bundle, logs, screenshots, and repository diff | No server secret or private key appears in public/client-visible output |
| Public links | Open app, docs, repositories, demo, and any explorer receipt signed out | Every submitted link resolves and matches the demonstrated release |

## Required evidence bundle

- web and Go commit SHAs;
- clean validation command output;
- database migration timestamp and RLS test result;
- hosting deployment identifier with all execution flags recorded as disabled;
- redacted acceptance matrix signed by the testers;
- optional bounded transaction hash and matching database receipt;
- final demo URL and signed-out link-check result.
