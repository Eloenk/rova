# Architectural & UI Modernization Record (`changes.md`)

This document records the design systems, authentication flows, and security threshold decisions implemented for the Rova Autonomous Agent platform.

---

## 🔐 1. Standalone Split Login Page (`/login`)
* **Left Side (50% Desktop Width)**:
  * **Bold Impact Typography**: `ROVA × ARC` headline (`64px` font size) with large subtitle description.
  * **Footer-Level Metrics**: Positioned `ARC TESTNET (5042002) // SUB-SECOND FINALITY` strictly at the very bottom (footer level) with a border separator.
* **Right Side (50% Desktop Width)**:
  * **ROVA Logo Header**: Positioned at top-left of the crisp white panel.
  * **Unified Web3 Connector**: Replaced standalone wallet list with a single primary `Connect Web3 Wallet (RainbowKit)` multi-wallet selector button.

---

## 🎨 2. Global Color Unification & Responsive Mobile Grid
* **Unified Global Palette**: Updated CSS color variables (`globals.css` / `index.css`) across the platform to match the landing page theme:
  * `--background`: `#0d1520` (Dark Navy Slate)
  * `--primary`: `#BFFF00` (Lime Accent)
  * `--accent`: `#25D366` (WhatsApp Mint Green)
* **Responsive Mobile Grid**: Added `.landing-grid` with `@media (max-width: 768px)` so grid cards stack in a single vertical column on mobile screens.

---

## 👛 3. Phantom Wallet-Style Header Popover Drawer
* **Header Wallet Pill**: Minimalist address button (`0x71C7...976F`).
* **Drawer Panel**: EVM address, 1-click clipboard copy, real-time balances for **USDC**, **EURC**, and **USYC**, plus `"+ Add Custodian Wallet"` modal.

---

## 🛡️ 4. WhatsApp Security Threshold System
* **User-Configurable Limit**: Web security setting defaulting to `$100.00 USDC`.
* **Instant Execution $\le$ Threshold**: Circle Agent Wallet handles transfers instantly.
* **Transfers $>$ Threshold**: Generates a 1-click web approval link on WhatsApp (`rova.app/confirm/tx_id`).
