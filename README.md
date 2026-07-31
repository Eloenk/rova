# ⚡ Rova — AI-Powered Capital Flow Engine on Arc

> **Autonomous Money Movement & Agentic Capital Allocation on Arc Testnet** — Built Africa-first, for the world.

Rova enables users and autonomous AI agents to send, bridge, swap, and execute recurring flow rules for stablecoins on Arc using natural language. Featuring zero-friction email onboarding via Circle Programmable Wallets, native Web3 wallet connections, a deterministic conversational agent fast-path, and deep-linked WhatsApp bot integration.

---

## 🌟 Key Features

- 💬 **Conversational AI Agent (Claude 3.7 Sonnet + Fast-Path)**
  - Zero-latency failsafe response for common greetings ("hi", "who are you", "what can you do").
  - Deterministic action guardrails that automatically restrict execution controls for non-financial queries.
- 💸 **Natural Language Transfers & Swaps**
  - **Send USDC**: To any EVM address or email recipient.
  - **Atomic FX Swaps**: USDC ↔ EURC via Circle StableFX with smart contract escrow.
  - **Cross-Chain CCTP V2 Bridging**: Transfer USDC seamlessly between Sepolia, Base, Polygon, and Arc.
- 🤖 **Autonomous Standing Instructions & Watchers**
  - Create trigger-based rules (e.g., *"If USDC rate > $1.02, swap 100 USDC to EURC"*).
  - Background daemon monitors market state and executes rules automatically on Arc.
- 📱 **Native WhatsApp AI Integration**
  - Deep-link verification modal for one-tap WhatsApp wallet linking.
  - Direct conversational banking via WhatsApp powered by `whatsmeow` & Go backend engine.
- 👛 **Dynamic Multi-Token Drawer**
  - Phantom-inspired popover drawer rendering live onchain balances for USDC, EURC, and USYC.
  - Real-time wallet address resolution supporting both Web3 injected wallets and Circle Managed Wallets.
- 🔒 **Autonomous Savings Vault System**
  - Allocate a percentage of incoming funds into isolated storage protected from routine operational flows.
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
| **Smart Contracts** | `RovaExecutionLog.sol`, ERC-8004 Identity/Reputation, ERC-8183 Flow Standard |
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
| `/agent` | **Agent Watchers** | Manage active autonomous rules, triggers, and execution history |
| `/history` | **Ledger Activity** | Detailed transaction table with ArcScan links and Arc Memos |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher

### 2. Environment Setup

Create `.env.local` in the project root:

```env
# Network RPC & Chain
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_CHAIN_ID=5042002

# Smart Contract
NEXT_PUBLIC_ROVA_EXECUTION_LOG_ADDRESS=0x58d1e3e11C7a93cb26C371B115f2710aF68d427a

# AI & Email Services
ANTHROPIC_API_KEY=your_anthropic_api_key
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL="Rova Security <auth@yourdomain.com>"

# Circle SDK & Supabase
NEXT_PUBLIC_CIRCLE_APP_ID=your_circle_app_id
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

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
