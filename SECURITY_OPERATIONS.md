# Security and Operating Gates

## Current release posture

Rova remains a testnet project. No mainnet deployment, contract deployment, autonomous execution, or production release is authorized by this repository state.

Manual custody actions are disabled by default. They require `ROVA_EXECUTION_ENABLED=true` in a server-only environment after an approved testnet rehearsal. WhatsApp also requires `ROVA_WHATSAPP_EXECUTION_ENABLED=true`; every WhatsApp money movement requires a five-minute confirmation code.

Unattended engine execution requires both `ROVA_EXECUTION_ENABLED=true` and `ROVA_AUTONOMOUS_EXECUTION_ENABLED=true`. The web application does not create new automated rules or standing intents, and its scheduler endpoint is permanently disabled until the shared custody-policy work below is complete.

## Database migration

Before serving the application or engine, apply the complete `schema.sql` in the Supabase SQL editor. The migration adds ownership columns, disables legacy ownerless rules and intents, enables row-level security on every sensitive table, removes unproven execution fees, and installs service-role-only atomic claim functions.

The claim functions move one active record to `ready_to_execute` only when its owner and managed Circle source wallet match the corresponding `users` row. The engine executes the exact row returned by that claim, persists the real transaction receipt before finalizing or re-arming the policy, and returns no executable work when Supabase is unavailable. Realtime messages only request a fresh database-backed evaluation; they cannot execute funds directly.

The Go engine and Next.js server use the secret key only from their private runtime environments. Application modules read environment values through the typed config boundaries in `lib/env/`; end users never share the deployment environment. Do not place the key in `.env.example`, `NEXT_PUBLIC_*`, source control, client bundles, logs, or chat transcripts.

## Deployment and contracts

`deploy/deploy.ts` deploys only `RovaSavingsVault` or `RovaExecutionLog`. It requires all of the following:

- `ROVA_ALLOW_CONTRACT_DEPLOY=true`
- a dedicated `ROVA_DEPLOYER_PRIVATE_KEY`
- `ARC_CHAIN_ID` matching the selected RPC endpoint
- `ROVA_DEPLOY_CONFIRMATION=DEPLOY:<contract>:<chainId>`

The historical `RovaSwapRouter` model is retired. Its rate-setting and owner-withdraw powers made it unsuitable for custody. New source deployments always revert; production swaps must use an independently reviewed external liquidity path. Any previously deployed router must be treated as unsafe, removed from application configuration, and have approvals/funds revoked or withdrawn by its current operator.

The previously embedded fallback deployment key is considered exposed. Do not use it. Rotate any account derived from it and move any remaining funds before future deployment work.

## Required path to mainnet

1. Add durable Circle request identifiers and an operator reconciliation workflow for the remaining transaction-submission uncertainty window; owner-wallet claims and exact policy snapshots are enforced for the current testnet engine.
2. Define one persisted plan schema shared by the web app and engine, including explicit user authorization, ceiling, expiry, cancellation, and execution receipt.
3. Add integration tests for authentication, Supabase RLS, WhatsApp confirmation expiry, engine authorization, Circle transaction creation, and duplicate-scheduler prevention.
4. Obtain an independent smart-contract and application security review; remediate findings and rehearse the full lifecycle on a fresh testnet account.
5. Use a dedicated multisig/deployer and a controlled deployment change window. Obtain a human authorization immediately before broadcast; never treat local tests as authorization.
6. Verify deployed bytecode, configured contract addresses, monitoring, alerting, backup/recovery, and public documentation before enabling any execution flag.

## Hackathon-safe demo

Use a testnet-only environment with `ROVA_EXECUTION_ENABLED=false`. Demonstrate login, policy validation, plan review, WhatsApp linking, rule history, and disabled automation messages. If a testnet transaction is approved for a demo, enable only the minimum required flag for one bounded rehearsal, then disable it again and preserve the receipt.

Treat ArcScan transaction records and server-side execution records as evidence. Any policy left in `ready_to_execute` after an error is paused for reconciliation and must not be blindly re-armed or retried.
