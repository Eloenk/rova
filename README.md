# ⚡ Rova — AI-Powered Capital Flow Engine on Arc

> **Policy-Gated Capital Planning and Testnet Settlement on Arc** — Built Africa-first, for the world.

Rova prepares and validates natural-language stablecoin transfer, swap, and bridge plans on Arc Testnet. It combines email onboarding through Circle Programmable Wallets, native Web3 wallet connections, one-time execution plans, a deterministic conversational fast-path, and WhatsApp account linking.

> [!IMPORTANT]
> Rova is currently a testnet prototype. Custody actions and autonomous execution are disabled by default, and this repository state does not authorize a mainnet deployment. Review [`SECURITY_OPERATIONS.md`](SECURITY_OPERATIONS.md) and the [`hackathon implementation roadmap`](docs/HACKATHON_IMPLEMENTATION_ROADMAP.md) before operating or extending the system.

---

## 🌟 Key Features

- 💬 **Conversational AI Agent (Claude 3.7 Sonnet + Fast-Path)**
  - Zero-latency failsafe response for common greetings ("hi", "who are you", "what can you do").
  - Deterministic action guardrails that automatically restrict execution controls for non-financial queries.
- 💸 **Natural Language Transfers & Swaps**
  - **Send USDC**: To any EVM address or email recipient.
  - **Atomic FX Swaps**: USDC ↔ EURC via Circle StableFX with smart contract escrow.
  - **Cross-Chain CCTP V2 Bridging**: Transfer USDC seamlessly between Sepolia, Base, Polygon, and Arc.
- 🤖 **Policy Watcher Foundation**
  - Create trigger-based rules (e.g., *"If USDC rate > $1.02, swap 100 USDC to EURC"*).
  - New policy creation is paused; the Go watcher remains fail-closed and requires owner-bound database claims plus separate execution gates.
- 📱 **Native WhatsApp AI Integration**
  - Deep-link verification modal for one-tap WhatsApp wallet linking.
  - Direct conversational banking via WhatsApp powered by `whatsmeow` & Go backend engine.
- 👛 **Dynamic Multi-Token Drawer**
  - Phantom-inspired popover drawer rendering supported Arc testnet balances.
  - Real-time wallet address resolution supporting both Web3 injected wallets and Circle Managed Wallets.
- 🔒 **Guarded Savings Vault Prototype**
  - Testnet vault contracts and guarded deposit/redemption paths exist; no production yield venue or return is claimed.
  - Dual strategy engine configurable via `config.yaml`: **Smart Contract Timelock Vault** (`RovaSavingsVault.sol`) or **Circle Sub-Wallet SCA**.
- 📜 **On-Chain Audit Ledger**
  - Full activity log linked to `RovaExecutionLog.sol` smart contract with Arc Transaction Memos.

---

## 🔒 Smart Contract Security Model (`RovaSavingsVault.sol`)

Token access and security on `RovaSavingsVault.sol` are enforced through 4 distinct protocol layers:

1. **Deposit Security (`depositSavings`)**: Transfers stablecoins into the vault contract using `IERC20.transferFrom`.
2. **Strict Redemption Authorization (`redeemSavings`)**: Enforces `require(dep.user == msg.sender)` and `require(block.timestamp >= dep.lockUntil)`. Only the original depositor can redeem funds after timelock maturity; unauthorized third parties and contract admins cannot access user funds.
3. **Emergency Circuit Breaker (`emergencyRelease`)**: Protected by `onlyOwner` and `whenPaused`. During emergency pauses, funds can only be returned **strictly back to the original depositor (`dep.user`)**.
4. **Exploit Protection**: OpenZeppelin standard `ReentrancyGuard` (`nonReentrant` modifier) protects against reentrancy attacks during execution.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Blockchain** | Arc Testnet (Chain ID `5042002`, Circle native USDC gas L1) |
| **Smart Contracts** | `RovaExecutionLog.sol`, `RovaSavingsVault.sol`, ERC-8004 Identity/Reputation |
| **Wallets** | Circle Programmable Wallets (Email OTP via Resend) + Wagmi / RainbowKit (Web3) |
| **AI Router** | Anthropic Claude 3.7 Sonnet + Failsafe Intent Parser |
| **Cross-Chain & FX** | Circle CCTP V2, Circle Gateway, StableFX Escrow |
| **Backend Daemon** | `rova-agent-go` (Go 1.22+, `go-ethereum`, `whatsmeow`) |
| **Frontend Framework** | Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, Framer Motion |

---

## 📱 Application Routes

| Route | Name | Description |
|---|---|---|
| `/` | **Landing Page** | Platform overview, features, and quick entry |
| `/login` | **Authentication** | Email OTP via Resend & Web3 Wallet login |
| `/dashboard` | **Command Hub** | Main AI chat prompt, stats, standing rules summary, quick action pills |
| `/send` | **Send & Swap** | Full manual interface for transfers, cross-chain bridging, and FX swaps |
| `/agent` | **Agent Watchers** | Review or cancel stored policies and inspect durable engine receipts |
| `/history` | **Ledger Activity** | Detailed transaction table with ArcScan links and Arc Memos |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher

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

## 🌐 Ecosystem & Live Links

- **Live App**: [rovaagent.vercel.app](https://rovaagent.vercel.app)
- **Arc Testnet Explorer**: [testnet.arcscan.app](https://testnet.arcscan.app)
- **Arc Documentation**: [docs.arc.network](https://docs.arc.network)
- **Rova Project Docs**: [`/docs`](https://rovaagent.vercel.app/docs)
- **Hackathon Implementation Roadmap**: [`docs/HACKATHON_IMPLEMENTATION_ROADMAP.md`](docs/HACKATHON_IMPLEMENTATION_ROADMAP.md)
- **Security and operational gates**: [`SECURITY_OPERATIONS.md`](SECURITY_OPERATIONS.md)
