# Rova Hackathon Implementation Roadmap

## Purpose

This document converts the project planning conversation and verified Arc Microgrants requirements into an implementation sequence that can be reviewed, tested, and shipped safely.

The program requires a working Arc Mainnet deployment and explicitly rejects testnet-only builds. The current release therefore permits a narrow mainnet application and non-custodial log contract while all custody, managed-wallet money movement, and autonomous execution remain disabled.

## Concern-to-workstream map

| Concern | Current position | Required outcome |
|---|---|---|
| Security findings | Execution is fail-closed, sensitive APIs are authenticated, durable ownership is introduced, unsafe deployment paths are retired, and local web/Go validation passes | Apply the database migration, rotate actual exposed credentials, pass external acceptance, and obtain independent review |
| Arc mainnet deployment | App configuration uses official chain `5042` values and the guarded CLI allows only `RovaExecutionLog` | Owner deploys, verifies source/bytecode, publishes addresses, and completes mainnet acceptance with all money-moving flags disabled |
| Agent policy controls | New web automation is paused; engine execution requires separate manual and autonomous gates | Introduce one versioned policy and execution-plan schema shared by the web app and Go engine |
| Yield allocation | No reviewed production yield venue is integrated | Select a supported venue, model custody and withdrawal risk, build an adapter, and test deposits and redemptions end to end |
| OAuth and Circle Wallets | Email/session and wallet flows exist but are not yet a complete production identity lifecycle | Select the identity model, bind one verified user to permitted wallets, and document recovery and account-collision behavior |
| Shareable jobs and receipts | Browser-local history is convenience state, not evidence | Store immutable server-side job states and receipts, anchor finalized transactions to ArcScan, and issue revocable privacy-safe share links |
| Monitoring and auditability | Some logs and execution records exist, but there is no complete operational view | Add structured events, correlation IDs, metrics, alerts, retries, reconciliation, and an operator runbook |
| Web and WhatsApp reliability | Known flows are incomplete and execution is intentionally gated | Define and pass an acceptance matrix for login, linking, quoting, confirmation, execution, failure, retry, and receipt delivery |
| Docs, UI, demo, submission | Mainnet deployment and public evidence remain owner-controlled external tasks | Publish truthful project docs, record the accepted mainnet slice, and submit only after signed-out acceptance |

## Delivery sequence

### Phase 0: Merge and operate the security foundation

1. Review and merge the web and Go security pull requests together.
2. Apply `schema.sql` to the owner-selected Supabase project and verify row-level security with separate users.
3. Rotate the exposed historical deployer account and any copied API, session, webhook, or database credentials.
4. Configure the owner-controlled Arc Mainnet environment with every money-moving execution flag set to `false`.
5. Re-run the declared Go 1.25 toolchain checks from a clean checkout before deploying the engine; local `go test ./...` and `go vet ./...` currently pass.

**Exit gate:** Both repositories build from clean checkouts, the migration is verified, secrets are rotated, and no execution path can run without an explicit server-side gate.

### Phase 1: Define identity, custody, and authorization

1. Decide whether users control Circle wallets directly or delegate narrowly scoped actions to developer-controlled wallets.
2. Select the OAuth provider and define account linking, session rotation, logout, recovery, duplicate-email, and wallet-collision rules.
3. Persist the verified relationship between the Rova user, Circle wallet ID, on-chain address, and permitted execution modes.
4. Require step-up confirmation for every manual transfer and for creating, changing, or resuming an autonomous policy.

**Exit gate:** A test proves that one user cannot view, link, authorize, or execute from another user's wallet.

### Phase 2: Build one policy and execution-plan model

Create one versioned schema consumed by both repositories. At minimum it must include:

- owner and source wallet identifiers;
- action, asset, amount ceiling, recipient or venue allowlist, and destination chain;
- frequency, total budget, expiry, cancellation state, and approval mode;
- quote constraints, maximum slippage, and minimum received amount;
- idempotency key, policy version, execution attempt, and correlation ID;
- authorization evidence and immutable receipt references.

The web app should create and review policies. One engine scheduler should claim jobs with database-backed locking. AI output may propose a plan, but deterministic validation must approve the exact persisted plan before execution.

**Exit gate:** Replay, duplicate schedulers, expired policies, over-limit amounts, changed recipients, and stale quotes all fail closed in integration tests.

### Phase 3: Deliver durable jobs, receipts, and monitoring

1. Model each job as a state machine such as `draft`, `awaiting_approval`, `queued`, `submitted`, `confirmed`, `failed`, `canceled`, or `expired`.
2. Persist every transition and provider/on-chain identifier; reconcile submitted jobs until terminal state.
3. Generate unguessable, revocable, expiring share links that expose no phone number, email, wallet inventory, or internal provider secrets.
4. Add structured logs and metrics for authentication failures, queue age, retries, duplicate suppression, provider errors, and confirmation latency.
5. Alert operators without automatically converting ambiguous failures into retries that may move money twice.

**Exit gate:** A reviewer can trace one approved action from user authorization through Circle submission to an ArcScan-confirmed receipt without relying on browser storage.

### Phase 4: Integrate yield through a reviewed adapter

1. Identify the exact Arc mainnet venue, contracts, assets, fees, liquidity, withdrawal behavior, and trust assumptions.
2. Record independent review status and define per-user and global exposure limits.
3. Implement quote, deposit, position, redeem, and emergency-disable operations behind a venue adapter.
4. Distinguish quoted APY from realized return and display principal risk, lockups, fees, and failed-redemption states.
5. Rehearse deposit and full withdrawal only in the venue's supported non-production staging environment.

**Exit gate:** Principal can be reconciled and withdrawn under normal and failure scenarios; no owner-set exchange rate or unrestricted owner withdrawal is involved.

### Phase 5: Ship the narrow Arc mainnet release

1. Obtain canonical Arc chain, RPC, explorer, token, and protocol addresses from primary sources and place them in a reviewed network manifest.
2. Deploy only the non-custodial `RovaExecutionLog` from a dedicated controlled deployer during an approved change window.
3. Verify source and bytecode, publish addresses, and optionally write one clearly labelled non-financial smoke record.
4. Deploy the web and Go services from owner-controlled hosting with all money-moving flags disabled.
5. Keep managed-wallet, WhatsApp money movement, and autonomous execution disabled until a later independently reviewed release.

**Exit gate:** The owner verifies chain `5042`, the exact artifact, deployer, contract address, public links, disabled execution posture, and rollback plan before submission.

### Phase 6: Finish the hackathon package

1. Run the web and WhatsApp acceptance matrix against the release candidate.
2. Update UI copy, README, project docs, and diagrams to match only verified behavior.
3. Record a short reproducible mainnet demo covering login, wallet binding, policy review, disabled money movement, and the verified log-contract receipt.
4. Publish the repositories, verified contract addresses, live application, project documentation, and demo link.
5. Complete the submission early enough for an independent link and fresh-account check.

**Exit gate:** A new reviewer can follow the public instructions and verify the demonstrated transaction without private assistance.

For the current release sequence, use `docs/HACKATHON_SUBMISSION_RUNBOOK.md` and record results in `docs/MAINNET_ACCEPTANCE_MATRIX.md`.

## Recommended pull-request sequence

1. **Security foundation:** Current web and engine hardening, database ownership migration, fail-closed execution, and deployment controls.
2. **Test harness and CI:** Go toolchain validation, focused integration environments, and cross-repository contract tests.
3. **Identity and custody:** OAuth decision, Circle wallet lifecycle, account recovery, and authorization records.
4. **Shared policy schema:** Versioned plans, deterministic validation, idempotency, locking, and cancellation.
5. **Receipts and operations:** Job state machine, share links, reconciliation, metrics, alerts, and runbooks.
6. **Yield adapter:** One reviewed venue with explicit limits and complete redemption tests.
7. **Mainnet candidate:** Audited network manifest, controlled deployment, smoke test, and public verification.
8. **Submission polish:** UI truth pass, project docs, demo, and submission checklist.

Each pull request should be independently reviewable, keep execution disabled unless its acceptance gate explicitly requires a bounded test, and include rollback notes for data or infrastructure changes.

## Owner confirmations

The repositories define Arc Mainnet chain `5042`, official infrastructure addresses, an EVM wallet model, email OTP flow, supported AI providers, Vercel-oriented web deployment, PM2-oriented engine runtime, and owner-side WhatsApp QR pairing. Engineering should validate those choices rather than asking the owner to rediscover technical configuration.

Engineering will reuse an existing owner-selected Supabase project when configured or prepare a fresh isolated project and apply `schema.sql`. The owner does not share a WhatsApp account; the owner or designated tester runs the final checklist using their existing linked account.

The owner only needs to confirm information that cannot be established from the repositories:

- whether any deployed contracts, funds, token approvals, commercial partnerships, or yield commitments exist outside the repositories;
- who may approve the guarded mainnet log-contract broadcast and final submission.

If no external deployments or commitments exist, the repository remains the source of truth. Secrets stay in the relevant hosting dashboard or secret manager and must never be sent through issues, pull requests, chat transcripts, or repository files.

## Definition of ready for fund-moving mainnet features

Rova is ready to request authorization for custody or transaction execution only when all of the following are true:

- clean-checkout builds and tests pass for both repositories;
- identity, wallet ownership, policy authorization, and idempotency are covered by integration tests;
- the exact contracts and third-party protocols have independent review evidence;
- database migrations, backup, recovery, reconciliation, monitoring, and incident procedures are exercised;
- all configured addresses and deployed bytecode are independently verified;
- the UI and documentation make no claims beyond observed behavior;
- the owner reviews the final deployment manifest and explicitly authorizes broadcast.
