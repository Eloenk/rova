# Security and Operating Gates

## Current release posture

Rova's Arc Microgrants release is a narrow mainnet deployment with all money-moving paths disabled. It is not authorization for production custody, autonomous execution, yield, staking, savings deposits, executable bridging, or managed-wallet transfers.

`ROVA_EXECUTION_ENABLED`, `ROVA_WHATSAPP_EXECUTION_ENABLED`, and `ROVA_AUTONOMOUS_EXECUTION_ENABLED` must remain `false` for this submission. The current web release does not create executable managed-wallet plans, and the Circle SDK path fails closed for Arc mainnet contract execution.

Unattended engine execution requires both `ROVA_EXECUTION_ENABLED=true` and `ROVA_AUTONOMOUS_EXECUTION_ENABLED=true`. The web application does not create new automated rules or standing intents, and its scheduler endpoint is permanently disabled until the shared custody-policy work below is complete.

## Database migration

Before serving the application or engine, apply the complete `schema.sql` in the Supabase SQL editor. The migration adds ownership columns, disables legacy ownerless rules and intents, enables row-level security on every sensitive table, removes unproven execution fees, and installs service-role-only atomic claim functions.

The claim functions move one active record to `ready_to_execute` only when its owner and managed Circle source wallet match the corresponding `users` row. The engine executes the exact row returned by that claim, persists the real transaction receipt before finalizing or re-arming the policy, and returns no executable work when Supabase is unavailable. Realtime messages only request a fresh database-backed evaluation; they cannot execute funds directly.

The Go engine and Next.js server use the secret key only from their private runtime environments. Application modules read environment values through the typed config boundaries in `lib/env/`; end users never share the deployment environment. Do not place the key in `.env.example`, `NEXT_PUBLIC_*`, source control, client bundles, logs, or chat transcripts.

## Deployment and contracts

`deploy/deploy.ts` deploys only the non-custodial `RovaExecutionLog`. It requires all of the following:

- `ROVA_ALLOW_CONTRACT_DEPLOY=true`
- a dedicated `ROVA_DEPLOYER_PRIVATE_KEY`
- `ARC_CHAIN_ID` matching the selected RPC endpoint
- `ROVA_DEPLOY_CONFIRMATION=DEPLOY:<contract>:<chainId>`

`RovaSavingsVault` and the historical `RovaSwapRouter` are excluded from the mainnet deployment allowlist. Any prior approvals or funds associated with old deployments must be reviewed and removed by their current operator.

The previously embedded fallback deployment key is considered exposed. Do not use it. Rotate any account derived from it and move any remaining funds before future deployment work.

## Required path to money-moving mainnet features

1. Add durable provider request identifiers and an operator reconciliation workflow for every transaction-submission uncertainty window.
2. Define one persisted plan schema shared by the web app and engine, including explicit user authorization, ceiling, expiry, cancellation, and execution receipt.
3. Add integration tests for authentication, Supabase RLS, WhatsApp confirmation expiry, engine authorization, Circle transaction creation, and duplicate-scheduler prevention.
4. Obtain an independent smart-contract and application security review and remediate every release-blocking finding.
5. Use a dedicated multisig/deployer and a controlled deployment change window. Obtain a human authorization immediately before broadcast; never treat local tests as authorization.
6. Verify deployed bytecode, configured contract addresses, monitoring, alerting, backup/recovery, and public documentation before enabling any execution flag.

## Microgrant demo

Use the owner-deployed Arc Mainnet application with all execution flags disabled. Demonstrate login, mainnet wallet/balance reads, policy validation, plan review, WhatsApp linking, disabled execution states, the verified `RovaExecutionLog` address, and an optional non-financial log-only smoke receipt.

Treat ArcScan transaction records and server-side execution records as evidence. Any policy left in `ready_to_execute` after an error is paused for reconciliation and must not be blindly re-armed or retried.
