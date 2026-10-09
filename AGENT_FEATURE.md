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
| Autonomous spending, payments, or settlement flows | Paused pending a shared Circle-custody engine policy and independent security review |
| **Use of Nanopayments for micro-transactions between agents or services** | `lib/nanopay.ts` — real x402 protocol negotiation (402 → pay → 200) against three quote-provider endpoints, using `@circle-fin/x402-batching` in real mode |
| USDC-denominated operations with demonstrable autonomy | Every transfer, fee, and quote payment is USDC on Arc |

## What's new in this pass

- **Rate-shopping via Nanopayments** (`lib/nanopay.ts`, `app/api/quotes/provider-{a,b,c}`) — three independently-drifting mock FX desks, each paywalled with a real x402-shaped 402 response. The agent pays all three (parallel), picks the best rate, and only then executes. Real mode uses Circle's actual `@circle-fin/x402-batching` SDK (`GatewayClient` buyer-side); mock mode fakes the same negotiation shape so it's demoable without live Gateway credentials. Note: the x402 buyer role needs a raw EOA private key to sign payment authorizations locally — Circle DCW's HSM-managed wallets can't do this themselves, so nanopayments use a small dedicated buyer key (`ROVA_X402_BUYER_PRIVATE_KEY`), separate from the Circle-managed wallets that hold the user's actual funds. This mirrors Circle's own reference implementation (`github.com/circlefin/arc-nanopayments`).

- **Standing intents** (`lib/agentStore.ts`, `app/api/agent/intents/*`) — persisted records are available for review and cancellation. Creating or executing an unattended intent is paused until the web plan schema and the engine's Circle custody model use one reviewed policy contract.

- **Command Hub finally has an intent box.** It didn't before — `DashboardView.tsx` was stats-only; the only place an intent got typed was inside Send & Swap's structured form. Added a "Tell Rova what you want to do" box that plans via the existing (previously unused) `FlowPlanCard`, then offers "Run now" or "Make this automatic."

- **Email or wallet, threaded everywhere.** `lib/emailWallets.ts` resolves either to a spendable address — a raw `0x...` passes through, an email gets a Circle-managed wallet created on first use and reused after. Agent rules, standing intents, and the confirm flow all go through this, not just the manual Send & Swap page.

- **Self-custody vs managed, as a real distinction, not a label.** `CustodyMode` remains part of the persisted model. New unattended flows are paused until managed-wallet ownership, amount policy, and user confirmation semantics have a shared implementation across the web app and engine.

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

- Unattended rules and standing intents are intentionally paused. Do not re-enable them until the engine executes from the authenticated user's Circle wallet, the persisted plan schema is shared, and the full lifecycle has an independent review.
- Self-custody approval is unavailable until wallet-signature linking is implemented end to end.
- Rule, intent, and execution history use server-only Supabase access with row-level security enabled. Apply `schema.sql` before enabling the app.

## Demo script addition

Show a manual plan and its policy preview, then explain that unattended execution remains deliberately paused pending the shared-custody review. Do not present simulated or disabled automation as a live execution capability.
