# ⚡ Rova — AI-Powered Capital Flow Engine on Arc

> **Policy-Gated Capital Planning and Mainnet Verification on Arc** — Built Africa-first, for the world.

Rova prepares and validates natural-language stablecoin transfer, swap, and bridge plans against Arc Mainnet. It combines application email authentication, mainnet EVM wallets, deterministic policy validation, live balance reads, and owner-tested WhatsApp account linking.

> [!IMPORTANT]
> This release authorizes only a narrow Arc Mainnet deployment with fund-moving execution disabled. The guarded CLI may deploy the non-custodial `RovaExecutionLog`; it does not authorize the savings vault, swap router, managed-wallet transfers, executable bridging, yield, staking, or autonomous execution. Review [`SECURITY_OPERATIONS.md`](SECURITY_OPERATIONS.md) and the [`submission runbook`](docs/HACKATHON_SUBMISSION_RUNBOOK.md) before deployment.

---

## 🌟 Key Features

- 💬 **Conversational Planning Agent**
  - Deterministic fast-path responses for common greetings and simple supported intents.
  - Deterministic action guardrails that automatically restrict execution controls for non-financial queries.
- 💸 **Natural Language Transfers & Swaps**
  - **Send USDC**: Explicit Arc Mainnet EVM recipients can be validated in owner-bound plans; managed-wallet submission is disabled.
  - **FX Swaps**: USDC/EURC plans are review-only in this release.
  - **Cross-Chain Routes**: CCTP and Gateway plans are review-only until destination binding is implemented and accepted.
- 🤖 **Policy Watcher Foundation**
  - Create trigger-based rules (e.g., *"If USDC rate > $1.02, swap 100 USDC to EURC"*).
  - New policy creation is paused; the Go watcher remains fail-closed and requires owner-bound database claims plus separate execution gates.
- 📱 **Native WhatsApp AI Integration**
  - Deep-link verification flow for owner-tested WhatsApp account linking.
  - WhatsApp money movement is separately gated and requires a short-lived confirmation code.
- 👛 **Dynamic Multi-Token Drawer**
  - Phantom-inspired popover drawer rendering Arc Mainnet balances.
  - Real-time wallet address resolution supporting both Web3 injected wallets and Circle Managed Wallets.
- 🔒 **Retired Custody Prototype**
  - `RovaSavingsVault.sol` remains historical source only and is excluded from the mainnet deployment allowlist.
  - No production yield venue, savings custody, deposit, redemption, or return is offered by this release.
- 📜 **On-Chain Audit Ledger**
  - Durable server receipts and Arc explorer links are primary evidence; optional `RovaExecutionLog.sol` writes are secondary evidence.

---

## 🔒 Smart Contract Security Model (`RovaSavingsVault.sol`)

`RovaSavingsVault.sol` is an unaudited historical prototype and is not deployable through the release tooling. Its source contains:

1. **Deposit Security (`depositSavings`)**: Transfers stablecoins into the vault contract using `IERC20.transferFrom`.
2. **Strict Redemption Authorization (`redeemSavings`)**: Enforces `require(dep.user == msg.sender)` and `require(block.timestamp >= dep.lockUntil)`. Only the original depositor can redeem funds after timelock maturity; unauthorized third parties and contract admins cannot access user funds.
3. **Emergency Circuit Breaker (`emergencyRelease`)**: Protected by `onlyOwner` and `whenPaused`. During emergency pauses, funds can only be returned **strictly back to the original depositor (`dep.user`)**.
4. **Reentrancy Control**: A local `nonReentrant` guard protects deposit, redemption, and emergency release. The contract does not import audited OpenZeppelin packages and is not approved for mainnet custody.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Blockchain** | Arc Mainnet (Chain ID `5042`, native USDC gas L1) |
| **Smart Contracts** | Deployable: `RovaExecutionLog.sol`; referenced infrastructure: ERC-8004; retired: `RovaSavingsVault.sol`, `RovaSwapRouter.sol` |
| **Wallets** | Circle developer-controlled wallets with application email OTP via Resend |
| **AI Router** | Gemini, Anthropic, or NVIDIA provider plus deterministic validation |
| **Cross-Chain & FX** | Circle App Kit planning/quoting; bridge execution is paused |
| **Backend Daemon** | `rova-agent-go` (Go 1.25, `go-ethereum`, `whatsmeow`) |
| **Frontend Framework** | Next.js 15 App Router, React 18, TypeScript, Tailwind CSS |

---

## 📱 Application Routes

| Route | Name | Description |
|---|---|---|
| `/` | **Landing Page** | Platform overview, features, and quick entry |
| `/login` | **Authentication** | Email OTP via Resend & Web3 Wallet login |
| `/dashboard` | **Command Hub** | Main AI chat prompt, stats, standing rules summary, quick action pills |
| `/send` | **Send & Route** | One-time transfer/swap review and informational bridge planning |
| `/agent` | **Agent Watchers** | Review or cancel stored policies and inspect durable engine receipts |
| `/history` | **Ledger Activity** | Detailed transaction table with ArcScan links and Arc Memos |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v22.x` or higher
- **npm**: version bundled with the selected Node.js 22 release

### 2. Runtime Configuration

Application code reads configuration only through `lib/env/server.ts` and `lib/env/public.ts`. End users do not create or share an `.env` file. Each deployment injects its own server secrets through the hosting platform's secret manager; `.env.local` is only an ignored local-development convenience.

Copy `.env.example` to `.env.local` for local development and fill only the services being exercised. Never place real credentials in `.env.example`, source files, pull requests, logs, screenshots, or chat. Only non-secret browser values may use the `NEXT_PUBLIC_*` prefix.

Apply the complete `schema.sql` using the Supabase SQL editor before starting either repository. In addition to tables and RLS, it installs service-role-only atomic claim functions used by the Go engine. `SUPABASE_SECRET_KEY` is server-only and must never be prefixed with `NEXT_PUBLIC_`.

### 3. Installation & Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Ecosystem & Release Links

- **Deployment status**: no working public application was verified on October 14, 2026; deploy and recheck before submission
- **Arc Mainnet Explorer**: [explorer.arc.io](https://explorer.arc.io)
- **Arc Documentation**: [docs.arc.io](https://docs.arc.io)
- **Rova Project Docs**: the application-local `/docs` route after deployment
- **Hackathon Implementation Roadmap**: [`docs/HACKATHON_IMPLEMENTATION_ROADMAP.md`](docs/HACKATHON_IMPLEMENTATION_ROADMAP.md)
- **Submission Runbook**: [`docs/HACKATHON_SUBMISSION_RUNBOOK.md`](docs/HACKATHON_SUBMISSION_RUNBOOK.md)
- **Mainnet Acceptance Matrix**: [`docs/MAINNET_ACCEPTANCE_MATRIX.md`](docs/MAINNET_ACCEPTANCE_MATRIX.md)
- **Configuration and Secrets**: [`docs/CONFIGURATION_AND_SECRET_HANDLING.md`](docs/CONFIGURATION_AND_SECRET_HANDLING.md)
- **Security and operational gates**: [`SECURITY_OPERATIONS.md`](SECURITY_OPERATIONS.md)
