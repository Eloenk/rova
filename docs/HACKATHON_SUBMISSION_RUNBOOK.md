# Hackathon Submission Runbook

## Release decision

Submit Rova only as a policy-gated Arc testnet prototype. Do not describe this branch as mainnet-ready, production custody, autonomous money movement, reviewed yield, or completed bridge settlement.

The critical path is a narrow vertical slice: authenticate a fresh user, bind the correct managed wallet, create a deterministic one-time USDC transfer plan, prove fail-closed behavior, optionally execute one owner-approved bounded testnet transfer, and show its durable receipt. Swap execution is gated; bridge plans are informational; new automation and yield are unavailable.

## Evidence already established locally

- Web lint, TypeScript checking, 10 policy tests, and the Next.js production build pass.
- Go `go test ./...` and `go vet ./...` pass with Go 1.25.
- Current tracked web files pass a redacted credential-pattern scan.
- Manual plans are owner-bound, short-lived, approval-code protected, atomically claimed, and one-time use.
- The Go watcher uses owner/source-wallet checks and service-role atomic database claims, and remains disabled unless both execution gates are enabled.
- Contract deployment and agent registration require explicit allow flags and exact per-operation confirmation strings.

These checks prove local code behavior only. They do not prove that a remote database migration, hosting configuration, public deployment, WhatsApp account, Circle account, or blockchain transaction is working.

## Current release blockers

1. The previously advertised Vercel application and `/docs` URLs returned HTTP 404 during the October 14, 2026 link check.
2. The complete `schema.sql` migration has not been proven against the owner's selected non-production Supabase project in this branch.
3. Secret rotation is an owner-controlled hosting task and has not been proven from repository state.
4. WhatsApp linking and confirmation must be tested by the owner or designated tester using their own account; credentials and QR state must not be shared.
5. No fresh bounded Circle/Arc transfer receipt has been produced for this release candidate.
6. `npm audit --omit=dev` reports 37 production advisories: 0 critical, 15 high, 14 moderate, and 8 low. The remaining findings are primarily in the Circle App Kit/developer-wallet transitive graph, so this branch is not approved for mainnet or unbounded custody.

## Required submission sequence

1. Review and merge the web and Go pull requests together.
2. Deploy both merged commits to an isolated testnet environment; do not reuse production or mainnet credentials.
3. Inject unique secrets through the hosting dashboards or secret manager. Never copy another user's local environment file.
4. Apply the complete web `schema.sql` to the selected non-production Supabase project.
5. Keep `ROVA_EXECUTION_ENABLED=false`, `ROVA_WHATSAPP_EXECUTION_ENABLED=false`, and `ROVA_AUTONOMOUS_EXECUTION_ENABLED=false` during baseline acceptance.
6. Run every required row in `docs/TESTNET_ACCEPTANCE_MATRIX.md` with two fresh user identities.
7. If the owner approves one testnet transfer, set only `ROVA_EXECUTION_ENABLED=true`, use the smallest practical amount and a known recipient, capture the plan ID and Arc explorer receipt, then immediately return the flag to `false`.
8. Let the owner test WhatsApp linking and confirmation on their own device. Record pass/fail evidence without screenshots containing phone numbers, tokens, QR data, or message codes.
9. Record a short demo that shows the exact accepted scope and the disabled states; do not edit around failures or imply mainnet use.
10. Recheck every public URL in a signed-out browser, then submit the live app, both public repositories, this runbook, and the demo.

## Clean-checkout validation

Run from the web repository:

```text
npm ci --ignore-scripts
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

Run from the Go repository with Go 1.25:

```text
go test ./...
go vet ./...
go build ./...
```

## Demo order

1. State that this is Arc testnet and execution is disabled by default.
2. Sign in with a fresh email and show the session-bound managed wallet.
3. Show rejection of a transfer without an explicit recipient address.
4. Prepare a bounded USDC transfer to a known testnet recipient and show the one-time approval step.
5. With execution disabled, show the fail-closed response.
6. Show that bridge planning is informational and that automation creation/reactivation is paused.
7. Show the owner-tested WhatsApp linking result without exposing account data.
8. If separately approved, show one bounded transfer and its Arc explorer receipt; otherwise explicitly say that no live transaction was authorized.
9. Close with the roadmap: shared policy schema, reconciliation, monitoring, independent review, then mainnet consideration.

## Stop conditions

Do not execute funds or submit a "live" claim if any of these occur:

- the database migration or RLS checks are incomplete;
- wallet ownership differs from the authenticated session;
- a required secret was copied through chat, an issue, a pull request, or source control;
- a plan can be replayed, reactivated, or executed after expiry;
- the provider response is ambiguous and no reconciliation record exists;
- the public app, docs, repositories, demo, or explorer receipt cannot be opened signed out;
- any execution flag remains enabled after the bounded rehearsal.
