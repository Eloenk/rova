# Rova Hackathon Implementation Roadmap

## Purpose

This document converts the project planning conversation into an implementation sequence that can be reviewed, tested, and shipped safely. The conversation is useful product context, but it is not an executable specification and does not authorize a mainnet deployment.

The current pull requests establish the security foundation. Rova remains a testnet prototype with all custody and autonomous execution disabled by default. Mainnet, production custody, and hackathon submission claims must wait for the acceptance gates in this roadmap.

## Concern-to-workstream map

| Concern | Current position | Required outcome |
|---|---|---|
| Security findings | Execution is fail-closed, sensitive APIs are authenticated, durable ownership is introduced, and unsafe deployment paths are retired | Apply the database migration, rotate exposed credentials, run the missing Go test suite, and obtain independent review |
| Arc mainnet migration | Testnet-only; no mainnet deployment is authorized | Maintain a reviewed network manifest, rehearse on a fresh testnet environment, deploy with a dedicated multisig/deployer, verify bytecode, and publish addresses |
| Agent policy controls | New web automation is paused; engine execution requires separate manual and autonomous gates | Introduce one versioned policy and execution-plan schema shared by the web app and Go engine |
| Yield allocation | No reviewed production yield venue is integrated | Select a supported venue, model custody and withdrawal risk, build an adapter, and test deposits and redemptions end to end |
| OAuth and Circle Wallets | Email/session and wallet flows exist but are not yet a complete production identity lifecycle | Select the identity model, bind one verified user to permitted wallets, and document recovery and account-collision behavior |
| Shareable jobs and receipts | Browser-local history is convenience state, not evidence | Store immutable server-side job states and receipts, anchor finalized transactions to ArcScan, and issue revocable privacy-safe share links |
| Monitoring and auditability | Some logs and execution records exist, but there is no complete operational view | Add structured events, correlation IDs, metrics, alerts, retries, reconciliation, and an operator runbook |
| Web and WhatsApp reliability | Known flows are incomplete and execution is intentionally gated | Define and pass an acceptance matrix for login, linking, quoting, confirmation, execution, failure, retry, and receipt delivery |
| Docs, UI, demo, submission | README claims outpace the currently enabled release posture | Keep capability labels truthful, publish project docs, record a reproducible testnet demo, and assemble the submission only after acceptance |

## Delivery sequence

### Phase 0: Merge and operate the security foundation

1. Review and merge the web and Go security pull requests together.
2. Apply `schema.sql` to a non-production Supabase project and verify row-level security with separate users.
3. Rotate the exposed historical deployer account and any copied API, session, webhook, or database credentials.
4. Configure separate development and testnet environments with every execution flag set to `false` by default.
5. Install the declared Go toolchain and run formatting, static analysis, unit tests, and a build before deploying the engine.

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
5. Rehearse deposit and full withdrawal on testnet or the venue's supported staging environment.

**Exit gate:** Principal can be reconciled and withdrawn under normal and failure scenarios; no owner-set exchange rate or unrestricted owner withdrawal is involved.

### Phase 5: Prepare an Arc mainnet release candidate

1. Obtain canonical Arc chain, RPC, explorer, token, and protocol addresses from primary sources and place them in a reviewed network manifest.
2. Complete an independent application and smart-contract security review.
3. Deploy from a dedicated multisig or controlled deployer during an approved change window.
4. Verify source and bytecode, publish addresses, seed monitoring, and execute a bounded smoke transaction.
5. Keep autonomous execution disabled until manual production acceptance and reconciliation pass.

**Exit gate:** The owner gives explicit broadcast authorization after reviewing the exact artifacts, addresses, limits, and rollback plan.

### Phase 6: Finish the hackathon package

1. Run the web and WhatsApp acceptance matrix against the release candidate.
2. Update UI copy, README, project docs, and diagrams to match only verified behavior.
3. Record a short reproducible demo covering login, wallet binding, policy review, bounded execution, receipt sharing, and monitoring.
4. Publish the repositories, verified contract addresses, live application, project documentation, and demo link.
5. Complete the submission early enough for an independent link and fresh-account check.

**Exit gate:** A new reviewer can follow the public instructions and verify the demonstrated transaction without private assistance.

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

## Owner decisions and access needed

Before implementation moves beyond the foundation, the project owner needs to provide or confirm:

- the current hosting projects and which repository/revision each service deploys;
- the Supabase project and a safe non-production migration target;
- the Circle environment, custody model, wallet set, and intended OAuth provider;
- the WhatsApp account/runtime and expected linking flow;
- every historical contract address and whether it still holds funds or approvals;
- the intended Arc mainnet yield venue and any partner commitments;
- the current hackathon or grant rules, deadline, and required public artifacts;
- who can authorize testnet rehearsals and eventual mainnet broadcasts.

Secrets must be transferred through the hosting provider or a secret manager, never through issues, pull requests, chat transcripts, or repository files.

## Definition of ready for mainnet

Rova is ready to request final mainnet authorization only when all of the following are true:

- clean-checkout builds and tests pass for both repositories;
- identity, wallet ownership, policy authorization, and idempotency are covered by integration tests;
- the exact contracts and third-party protocols have independent review evidence;
- database migrations, backup, recovery, reconciliation, monitoring, and incident procedures are exercised;
- all configured addresses and deployed bytecode are independently verified;
- the UI and documentation make no claims beyond observed behavior;
- the owner reviews the final deployment manifest and explicitly authorizes broadcast.

