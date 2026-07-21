# Rova Agent — Full Build (Arc "Programmable Money" Hackathon, Agentic Economy track)

## What this is

Two kinds of automation, one watcher, one custody model.

1. **Agent rules** — a single transfer with a rate or date trigger ("send 200
   USDC when the rate hits X, or by Friday"). Before firing, the agent shops:
   it pays three independent quote providers a fraction of a cent each via
   Nanopayments (x402) and executes at whichever quoted best.
2. **Standing intents** — an arbitrary Command Hub plan ("send 100 split
   between supplier and savings") saved to re-run on a schedule, or the
   moment an incoming payment is detected.

Both respect a real custody boundary: if the source is a Circle-managed
(email-onboarded) wallet, the Agent signs and fires with no human present.
If the source is the user's own connected wallet, Circle never holds that
key — the Agent detects the trigger, marks the rule `ready_to_execute`, and
waits for a one-tap approval, which signs and sends client-side via the
user's own wallet.

## Track fit: Agentic Economy

| Judging criterion | How this hits it |
|---|---|
| Agents with clear decision logic tied to real signals | Rate/date triggers, plus quote comparison logic before every spend |
| Autonomous spending, payments, or settlement flows | Agent rules + standing intents, both fire without a human clicking |
| **Use of Nanopayments for micro-transactions between agents or services** | `lib/nanopay.ts` — real x402 protocol negotiation (402 → pay → 200) against three quote-provider endpoints, using `@circle-fin/x402-batching` in real mode |
| USDC-denominated operations with demonstrable autonomy | Every transfer, fee, and quote payment is USDC on Arc |

## What's new in this pass

- **Rate-shopping via Nanopayments** (`lib/nanopay.ts`, `app/api/quotes/provider-{a,b,c}`) — three independently-drifting mock FX desks, each paywalled with a real x402-shaped 402 response. The agent pays all three (parallel), picks the best rate, and only then executes. Real mode uses Circle's actual `@circle-fin/x402-batching` SDK (`GatewayClient` buyer-side); mock mode fakes the same negotiation shape so it's demoable without live Gateway credentials. Note: the x402 buyer role needs a raw EOA private key to sign payment authorizations locally — Circle DCW's HSM-managed wallets can't do this themselves, so nanopayments use a small dedicated buyer key (`ROVA_X402_BUYER_PRIVATE_KEY`), separate from the Circle-managed wallets that hold the user's actual funds. This mirrors Circle's own reference implementation (`github.com/circlefin/arc-nanopayments`).

- **Standing intents** (`lib/agentStore.ts`, `app/api/agent/intents/*`) — Command Hub can now save a parsed plan to run on its own. Two trigger types:
  - `recurring` — daily/weekly/monthly, evaluated against `lastRunAt` on each tick
  - `on_receive` — watches the source wallet's USDC balance; fires when it jumps by at least a configured amount, matching against `lastKnownBalance` each tick. (Balance-based, since Rova doesn't currently have Circle webhook/notification infra wired up — a real webhook would be a stronger v2 than polling.)

- **Command Hub finally has an intent box.** It didn't before — `DashboardView.tsx` was stats-only; the only place an intent got typed was inside Send & Swap's structured form. Added a "Tell Rova what you want to do" box that plans via the existing (previously unused) `FlowPlanCard`, then offers "Run now" or "Make this automatic."

- **Email or wallet, threaded everywhere.** `lib/emailWallets.ts` resolves either to a spendable address — a raw `0x...` passes through, an email gets a Circle-managed wallet created on first use and reused after. Agent rules, standing intents, and the confirm flow all go through this, not just the manual Send & Swap page.

- **Self-custody vs managed, as a real distinction, not a label.** `CustodyMode` on both `AgentRule` and `StandingIntent`. Managed → Circle DCW signs server-side, fully unattended. Self-custody → `lib/selfCustodySend.ts` does a client-side native-value transfer via the user's own connected wallet (wagmi), only after they tap Approve on a `ready_to_execute` item. The agent still does its part either way — fee job, reputation entry, onchain log — attested by Rova's own managed wallet.

## Circle tools used

| Tool | Where |
|---|---|
| Developer-Controlled Wallets | settlement leg for managed-custody transfers; single-wallet creation for email onboarding |
| StableFX | swap leg when a rule/intent needs USDC↔EURC conversion |
| Nanopayments (x402 + Gateway) | rate-shopping — the core Agentic Economy hook |
| ERC-8004 (Identity/Reputation) | reputation entry per autonomous fire |
| ERC-8183 (Agentic Flow) | agent's self-charged execution fee |
| App Kit / CCTP | cross-chain leg, available via the shared `lib/flowExecutor.ts` path |

## Known simplifications (worth saying out loud, not hiding)

- Standing-intent on-receive detection is balance-polling, not a real webhook — fine for a hackathon tick cadence, a real webhook is the honest v2.
- Self-custody approval for standing intents currently signs only the plan's first split — multi-split self-custody in one tap needs either a batched call or per-split approval, noted as a next step rather than silently only doing part of the job.
- Rule/intent storage is in-memory (resets on redeploy) — same known tradeoff as the rest of the Agent feature, not new to this pass.

## Demo script addition

After the original rate-rule demo: show a Command Hub intent ("send 50 USDC
split between two addresses") planned, then "Make automatic" with a
recurring weekly trigger — cut to the Agent tab, point at "Standing
instructions." Then point at an execution's "Shopped 3 providers" line in
the log — that's the Nanopayments criterion, made visible, not just claimed.
