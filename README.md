# Rova

**AI-powered money movement on Arc** — built Africa-first, for the world.

Rova lets anyone send, bridge, and swap stablecoins on Arc using plain English. No seed phrases required — sign up with your email via Circle Programmable Wallets, or connect your existing Web3 wallet.

## What Rova does

- **Send USDC** — to any wallet address or email address
- **Bridge** — cross-chain via CCTP V2 (Ethereum, Base, Polygon, and more → Arc)
- **Swap** — USDC ↔ EURC with StableFX
- **Ledger** — full transaction history with Arc Transaction Memos attached

## Tech stack

- **Blockchain**: Arc Testnet (Circle's stablecoin-native L1)
- **Wallets**: Circle Programmable Wallets (email) + Web3 wallet connect
- **AI**: Claude 3.7 Sonnet (natural language intent routing)
- **Cross-chain**: Circle CCTP V2
- **FX**: StableFX
- **Data**: Goldsky (real-time onchain indexing)
- **Identity**: ERC-8004
- **Frontend**: Next.js 14, TailwindCSS, Framer Motion, TypeScript

## Pages

| Page | Path | Description |
|------|------|-------------|
| Landing | `/` | App homepage |
| Command Hub | `/dashboard` | Overview, stats, quick actions |
| Send & Swap | `/send` | Send, bridge, or swap USDC |
| Ledger | `/history` | Transaction history with memos |

## Getting started

```bash
npm install
cp .env.example .env.local
# Add your API keys to .env.local
npm run dev
```

## Built on Arc

Rova is part of the Arc ecosystem — a stablecoin-native Layer-1 blockchain by Circle, designed for the programmable economy.

Live at: [rovaagent.vercel.app](https://rovaagent.vercel.app)
