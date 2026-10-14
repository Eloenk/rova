# Arc Microgrants Submission Runbook

## Verified program requirements

The Arc Microgrants page requires a live working deployment on Arc Mainnet, a public source repository, a short project description, and a public builder profile. Testnet-only builds are explicitly ineligible. The published deadline is October 14, 2026 at 23:59 ET, which is October 15, 2026 at 03:59 UTC and 05:59 SAST.

## Release decision

Submit Rova only after the owner deploys and verifies the merged release on Arc Mainnet. The accepted scope is deliberately narrow:

- the public application identifies Arc Mainnet chain `5042` and reads official mainnet USDC/EURC state;
- authenticated users can create deterministic, owner-bound plans;
- managed-wallet, WhatsApp money movement, autonomous execution, executable bridging, yield, staking, ERC-8183, and the savings vault remain disabled;
- the owner may deploy only the non-custodial `RovaExecutionLog` contract through the guarded deployment CLI;
- one clearly labelled log-only smoke call may prove the custom contract is live without moving or custodying funds.

Do not deploy `RovaSavingsVault` or `RovaSwapRouter` for this submission. Do not describe disabled planning paths as executed transactions.

## Evidence already established locally

- A clean npm install, web lint, TypeScript checking, policy tests, contract compilation, Next.js production build, and production dependency audit pass before owner deployment.
- Go test, vet, and build pass before owner deployment.
- The optional compatibility sidecar passes syntax checks and its production dependency audit reports zero vulnerabilities.
- The official Arc RPC reports chain ID `5042` and deployed bytecode at the configured USDC, EURC, and ERC-8004 Identity addresses.
- Current tracked files pass a redacted credential-pattern scan.
- Sessions, records, and plans are owner-bound and execution fails closed.
- Operational deployment and registration scripts require allow flags, exact chain-bound confirmation strings, and one-shot owner-controlled secrets.

Local checks do not prove the hosted database, owner accounts, mainnet contract, public application, or submitted links.

## Required release sequence

1. Review and merge the web and Go pull requests together.
2. Rotate the historical deployer account and every credential whose value was genuinely exposed.
3. Deploy the merged web and engine commits from hosting projects controlled by the owner.
4. Configure unique mainnet secrets through the hosting dashboards; never upload or share a local `.env` file.
5. Apply the complete `schema.sql` to the selected Supabase project and run owner-isolation/RLS checks.
6. Keep `ROVA_EXECUTION_ENABLED=false`, `ROVA_WHATSAPP_EXECUTION_ENABLED=false`, and `ROVA_AUTONOMOUS_EXECUTION_ENABLED=false`.
7. Run every required row in `docs/MAINNET_ACCEPTANCE_MATRIX.md` with two fresh user identities.
8. Deploy only `RovaExecutionLog` using `DEPLOY_CONTRACT.md`, verify the chain, receipt, source, and bytecode, then configure its public address.
9. If approved by the owner, submit one non-financial log-only smoke call. Do not approve tokens or transfer/custody funds.
10. Let the owner test WhatsApp linking on their own device while money movement remains disabled.
11. Record a short mainnet demo showing the live app, chain `5042`, verified contract, fail-closed money movement, and public explorer evidence.
12. Open every submission link while signed out, then submit the app, repositories, description, builder profile, demo, and mainnet explorer evidence on DoraHacks.

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

1. Show the public URL and Arc Mainnet label.
2. Show chain ID `5042` and the owner-deployed `RovaExecutionLog` on the Arc explorer.
3. Sign in with a fresh user and show the session-bound mainnet wallet and live balance reads.
4. Prepare a bounded plan and show recipient binding and policy validation.
5. Show that the API does not create an executable managed-wallet plan and that execution endpoints fail closed.
6. Show bridge, automation, yield, staking, and WhatsApp money movement as unavailable or informational.
7. Show the owner-tested WhatsApp link without revealing personal data.
8. Show the optional log-only mainnet smoke receipt, if completed.
9. Close with the roadmap for reviewed custody and execution work after the microgrant submission.

## Stop conditions

Do not submit or broadcast if:

- any configured endpoint reports a chain other than `5042`;
- the database migration or user-isolation checks fail;
- a secret appears in source, logs, screenshots, chat, or client output;
- the deploy command selects a custody or swap contract;
- the deployed bytecode cannot be reconciled with the reviewed artifact;
- any money-moving execution flag is enabled;
- the public app, repository, builder profile, demo, contract, or explorer evidence cannot be opened signed out.
