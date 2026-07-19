# Rova Agent — Autonomous Execution (Arc "Programmable Money" Hackathon)

## What this adds

A new **Agent** tab where a user arms a rule once — a target StableFX rate, or a
hard deadline — and Rova executes the transfer autonomously, with no further
clicks. This sits alongside the existing manual Send & Swap flow; it doesn't
replace it.

## Track fit: Agentic Commerce

- **Autonomous trigger, not a chatbot.** The agent watches a live rate feed
  (`lib/rates.ts`) every few seconds via `/api/agent/tick` and fires the moment
  a condition is met — no user in the loop at execution time.
- **The agent charges its own fee.** Every autonomous execution creates,
  funds, and completes a small ERC-8183 job (`lib/agentExecutor.ts`) — a real
  agent-to-agent-style micropayment for the work the agent just did, using the
  same job/escrow primitive Rova already had wired up for manual flows
  (`lib/circle.ts`).
- **The agent builds a reputation.** Each autonomous fire also writes an
  ERC-8004 reputation entry, so the agent accumulates an onchain track record
  specifically for unattended execution — separate from manually-approved
  transfers.
- **Safety margin, not just a trigger.** Before committing, the tick route
  re-checks the rate against a tolerance band (`app/api/agent/tick/route.ts`)
  and aborts/re-arms rather than executing at a worse price than intended —
  the kind of failure-mode handling that separates a demo from something that
  reads as production-minded.

## Circle tools used (existing + extended)

| Tool | Where |
|---|---|
| Developer-Controlled Wallets | `lib/circle.ts` — unchanged, reused for the settlement leg |
| StableFX | swap leg when the rule requires USDC↔EURC conversion |
| ERC-8004 (Identity/Reputation) | new reputation entry per autonomous fire |
| ERC-8183 (Agentic Flow) | new: agent's self-charged execution fee, create→fund→complete in one tick |
| App Kit / CCTP | untouched — available for a cross-chain variant of the same rule engine |

## Files added

```
lib/rates.ts                        — simulated live StableFX indicative rate feed
lib/agentStore.ts                   — in-memory rule + execution log store
lib/agentExecutor.ts                — fires a rule: swap/send + ERC-8183 fee + ERC-8004 reputation
app/api/agent/rate/route.ts         — GET current rates (ticker)
app/api/agent/rules/route.ts        — GET/POST rules
app/api/agent/rules/[id]/route.ts   — PATCH/DELETE a rule
app/api/agent/tick/route.ts         — the watcher: checks + fires matched rules
components/AgentView.tsx            — the Agent tab UI
app/agent/page.tsx                  — route wrapper
vercel.json                         — cron hitting /api/agent/tick every minute,
                                       so the agent still fires with no browser open
```

## Also fixed (pre-existing, unrelated to this feature)

The zip didn't build before this: `hooks/useRova.ts` and `hooks/erc8183Store.ts`
were imported everywhere but never existed as files — a leftover from the
FlowFi→Rova rename (the function was renamed to `useRova` *inside*
`hooks/useFlowFi.ts`, but the file itself wasn't renamed, and
`hooks/erc8183Store.ts` was referenced by `app/providers.tsx` but never
created). Fixed with a re-export shim and a proper wallet-scoped job store
mirroring the existing `flowHistoryStore.tsx` pattern. Full `tsc --noEmit` and
`next build` both pass clean now (verified in this environment with the
Google Fonts network call stubbed out, since this sandbox can't reach
fonts.googleapis.com — that part will resolve normally on Vercel or any
machine with internet access).

## Demo script (3 minutes)

1. Open **Agent** tab — show the live USDC/EURC rate ticker.
2. Arm a rule: "200 USDC → sister in Nairobi, when rate ≥ [just above current]."
3. Wait ~10–15s (or nudge the rate via `nudgeRateToward` for a guaranteed
   on-stage fire) — the rule fires automatically.
4. Point at the execution log: transfer tx (ArcScan link), the ERC-8183 fee
   job, the ERC-8004 reputation entry — three onchain artifacts from one
   autonomous decision.
5. Close on the remittance framing: this is the tedious rate-watching a person
   sending money home shouldn't have to do themselves.

## Suggested next steps (if there's time before submission)

- Wire `lib/rates.ts` to real StableFX RFQ pricing once partnership access is
  live — the trigger/tolerance logic doesn't change, only the data source.
- Recurring rules (currently single-fire only, by design — see the
  architecture notes for why that's the right v1 scope).
- **Completed:** Move rule and execution storage to a persistent store. Rova now integrates Supabase database with in-memory fallback.
