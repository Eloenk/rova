# Architectural & UI Modernization Record (`changes.md`)

This document records the design systems, authentication flows, and security threshold decisions implemented for the Rova Autonomous Agent platform.

---

## 🎨 1. Plain-English Landing Page Grid
* **Removed All Technical Developer Jargon**: Stripped developer phrases like "goroutines", "whatsmeow daemon", "CCTP V2", and "DEX liquidity providers" from user-facing landing cards.
* **Economic Value Copy**:
  1. **WhatsApp Banking Agent**: Chat directly on WhatsApp to send money, set target rate alerts, and manage stablecoins.
  2. **Instant Frictionless Accounts**: Sign in with phone number or email for an automatic secure wallet, or link an external wallet.
  3. **Smart Security Guard**: Custom transfer thresholds for automated micro-payments and 1-click web approvals for larger amounts.
  4. **Sub-Second Global Remittances**: Sub-second international money transfers for ~$0.006 gas fee.
  5. **Zero-Slippage FX Swaps**: Institutional rate currency swaps between USD, EUR, and yield-bearing stablecoins.
  6. **Automated Rate Watchers**: 24/7 market monitoring that executes transfers automatically when target FX rates are hit.
* **Ecosystem Badges**: Updated footer badges to clear user concepts: `['Arc Network', 'Circle Wallets', 'WhatsApp Banking', 'StableFX Engine', 'Yield USYC', 'Sub-Second Transfers']`.

---

## 🔐 2. Standalone Desktop 50/50 Split Login (`/login`)
* **Isolated Full-Screen Route**: `/login` renders as an independent, standalone page without dashboard sidebar or topbar header wrappers.
* **Arc Metrics Showcase**: Displays sub-second finality (< 250ms), native USDC gas overhead (~$0.006), and live security guard status.

---

## 👛 3. Phantom Wallet-Style Header Popover Drawer
* **Header Wallet Pill**: Minimalist address button (`0x71C7...976F`).
* **Drawer Panel**: EVM address, 1-click clipboard copy, real-time balances for **USDC**, **EURC**, and **USYC**, plus `"+ Add Custodian Wallet"` modal.

---

## 🛡️ 4. WhatsApp Security Threshold System
* **User-Configurable Limit**: Web security setting defaulting to `$100.00 USDC`.
* **Instant Execution $\le$ Threshold**: Circle Agent Wallet handles transfers instantly.
* **Transfers $>$ Threshold**: Generates a 1-click web approval link on WhatsApp (`rova.app/confirm/tx_id`).
