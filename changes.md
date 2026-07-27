# Architectural & UI Modernization Record (`changes.md`)

This document records the design systems, authentication flows, and security threshold decisions implemented for the Rova Autonomous Agent platform.

---

## 🎨 1. Seamless Landing Page & Login Cleanups
* **Landing Page Technology Badges**: Removed the `borderTop` divider line above the technology badges list at the bottom of `LandingPage.tsx` so the entire page flows as one unified surface.
* **Landing Page Navigation Header**: Removed `borderBottom` underneath the top navigation bar.
* **Login Page Left Panel**: Removed the right vertical border (`borderRight`) and bottom footer top border (`borderTop`) on the dark monochrome left side.

---

## ⚡ 2. Responsive 4-Card Landing Grid
* **Desktop & Mid-Screen Layout**:
  * **Strict 1-Row Grid**: Enforced `grid-template-columns: repeat(4, 1fr)` across desktop, laptop, and mid-screens so all 4 cards fit in a single horizontal row without wrapping.
  * **Fluid Scaling**: Reduced card padding (`20px 16px`) and description font size (`13px`) for clean proportions.
* **Mobile Screen Layout (`max-width: 640px`)**:
  * **Strict 2-Row 3-Up 1-Down Grid**: Enforced `grid-template-columns: repeat(3, 1fr)` where Cards 1-3 fill Row 1, and Card 4 spans all 3 columns on Row 2 (`grid-column: span 3`).

---

## 🔐 3. Standalone Split Login Page (`/login`)
* **Left Side (50% Desktop Width)**:
  * **Bold Impact Typography**: `ROVA × ARC` headline (`64px` font size) with large subtitle description.
  * **Footer-Level Metrics**: Positioned `ARC TESTNET (5042002) // SUB-SECOND FINALITY` strictly at the very bottom (footer level) without border lines.
* **Right Side (50% Desktop Width)**:
  * **ROVA Logo Header**: Positioned at top-left of the crisp white panel.
  * **Unified Web3 Connector**: Single primary `Connect Web3 Wallet (RainbowKit)` multi-wallet selector button.

---

## 🎨 4. Global Color Unification
* **Unified Global Palette**: Updated CSS color variables (`globals.css` / `index.css`) across the platform to match the landing page theme:
  * `--background`: `#0d1520` (Dark Navy Slate)
  * `--primary`: `#BFFF00` (Lime Accent)
  * `--accent`: `#25D366` (WhatsApp Mint Green)

---

## 👛 5. Phantom Wallet-Style Header Popover Drawer
* **Header Wallet Pill**: Minimalist address button (`0x71C7...976F`).
* **Drawer Panel**: EVM address, 1-click clipboard copy, real-time balances for **USDC**, **EURC**, and **USYC**, plus `"+ Add Custodian Wallet"` modal.

---

## 🛡️ 6. WhatsApp Security Threshold System
* **User-Configurable Limit**: Web security setting defaulting to `$100.00 USDC`.
* **Instant Execution $\le$ Threshold**: Circle Agent Wallet handles transfers instantly.
* **Transfers $>$ Threshold**: Generates a 1-click web approval link on WhatsApp (`rova.app/confirm/tx_id`).
