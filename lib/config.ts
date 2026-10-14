// Rova — Arc & Circle Configuration
//
// Sources:
//   https://docs.arc.io/arc/references/connect-to-arc
//   https://docs.arc.io/arc/references/contract-addresses
//   https://developers.circle.com/cctp/references/contract-addresses.md
//   https://developers.circle.com/stablefx.md
//   https://developers.circle.com/gateway.md

import { publicEnv } from './env/public';

// ── Arc Mainnet Network ────────────────────────────────────────────────────────
export const ARC_NETWORK = {
  name:      'Arc Mainnet',
  chainId:   5042,
  chainIdHex:'0x13B2',
  rpc:       publicEnv.arcRpcUrl,
  rpcFallbacks: [
    'https://rpc.blockdaemon.mainnet.arc.io',
    'https://rpc.drpc.mainnet.arc.io',
    'https://rpc.quicknode.mainnet.arc.io',
  ],
  ws:        'wss://rpc.mainnet.arc.io',
  explorer:  'https://explorer.arc.io',
  currency:  'USDC',
  // Circle's current Wallets SDK exposes Arc mainnet through a generic EVM EOA.
  circleWalletBlockchain: 'EVM' as const,
} as const;

// ── Stablecoins on Arc ─────────────────────────────────────────────────────────
export const TOKENS = {
  USDC: {
    address:  '0x3600000000000000000000000000000000000000' as `0x${string}`,
    decimals:  6,   // ERC-20 interface uses 6 decimals
    symbol:   'USDC',
    name:     'USD Coin',
    isNative:  true, // USDC is the native gas token on Arc
  },
  EURC: {
    address:  '0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1' as `0x${string}`,
    decimals:  6,
    symbol:   'EURC',
    name:     'Euro Coin',
    isNative:  false,
  },
} as const;

// ── CCTP V2 — Cross-Chain Transfer Protocol ────────────────────────────────────
// Arc is CCTP Domain 26. Use V2 — V1 is legacy.
// Bridge Kit (@circle-fin/bridge-kit) wraps this for frontend use.
export const CCTP = {
  domain:               26,
  TokenMessengerV2:     '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d' as `0x${string}`,
  MessageTransmitterV2: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64' as `0x${string}`,
  TokenMinterV2:        '0xfd78EE919681417d192449715b2594ab58f5D002' as `0x${string}`,
  // Fast transfer: ~8-20 seconds. Standard: 15-19 min (source chain finality)
  irisApi: 'https://iris-api.circle.com/v2/messages',
} as const;

// ── Circle Gateway ─────────────────────────────────────────────────────────────
// Gateway routing metadata. Availability is verified at quote time.
export const GATEWAY = {
  // Same address on ALL supported chains
  walletAddress: '0x77777777Dcc4d5A8B6E418Fd04D8997ef11000eE' as `0x${string}`,
  description:   'Unified USDC routing across supported chains',
  docs:          'https://developers.circle.com/gateway.md',
} as const;

// ── ERC-8004 AI Agent Registry ─────────────────────────────────────────────────
// Arc's native standard for AI agent onchain identity, reputation, and credentials.
// Docs: https://docs.arc.io/arc/tutorials/register-your-first-ai-agent
export const ERC8004 = {
  IdentityRegistry:   '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432' as `0x${string}`,
  ReputationRegistry: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63' as `0x${string}`,
  ValidationRegistry: '0x8004Cc8439f36fd5F9F049D9fF86523Df6dAAB58' as `0x${string}`,
  standard:          'ERC-8004',
} as const;

// ── Rova Execution Log ─────────────────────────────────────────────────────────
// Rova's own contract — NOT shared Circle/Arc infra. Deployed via Remix, see
// contracts/RovaExecutionLog.sol and DEPLOY_CONTRACT.md for instructions.
// Address comes from env because it's set once at deploy time, not baked into
// the repo (so a fresh deploy doesn't require an app code change).
export const ROVA_EXECUTION_LOG = {
  address: publicEnv.executionLogAddress as `0x${string}`,
  abiFunctionSignature: 'logExecution(bytes32,address,uint256,uint256,string)',
} as const;

// ── Gas ─────────────────────────────────────────────────────────────────────────
// Arc uses USDC as the native gas token.
// Stable, dollar-denominated, predictable — ~$0.006 per transaction.
export const GAS = {
  costPerTxUsdc: 0.006,
  currency:      'USDC',
  feeLevel:      'MEDIUM' as const,
} as const;

// ── StableFX ────────────────────────────────────────────────────────────────────
// Institutional-grade FX engine on Arc. USDC ↔ EURC with smart contract escrow.
// RFQ model: request quote → accept → onchain settlement on Arc (<1s finality).
// Requires Circle partnership for API key. Contact sales@circle.com.
export const STABLEFX = {
  docs:        'https://developers.circle.com/stablefx.md',
  pairs:       ['USDC/EURC', 'EURC/USDC'],
  settlement:  'Arc smart contract escrow (PvP — both sides settle or neither does)',
  finality:    'Sub-second on Arc',
  permissioned: true,
} as const;

// ── Explorer URL helpers ────────────────────────────────────────────────────────
export const arcScan = {
  tx:      (hash: string)    => `${ARC_NETWORK.explorer}/tx/${hash}`,
  address: (addr: string)    => `${ARC_NETWORK.explorer}/address/${addr}`,
  token:   (addr: string)    => `${ARC_NETWORK.explorer}/token/${addr}`,
  nft:     (tokenId: string) => `${ARC_NETWORK.explorer}/token/${ERC8004.IdentityRegistry}/instance/${tokenId}`,
} as const;

export const AGENT_METADATA = {
  name:        'Rova Capital Flow Engine',
  description: 'Policy-gated capital planning agent deployed on Arc Mainnet.',
  agent_type:  'capital_flow',
  capabilities: [
    'intent_parsing',
    'usdc_routing',
    'cctp_route_planning',
    'stablefx_fx',
    'erc8004_identity',
    'erc8004_validation'
  ],
  version:     '1.1.0',
  network:     'ARC',
  powered_by:  'AI planning + Arc SDK + Circle App Kit',
} as const;

// ── App Kit Config ─────────────────────────────────────────────────────────────
export const APP_KIT_CONFIG = {
  chains: {
    ARC: 'Arc',
    ETH: 'Ethereum',
    SOL: 'Solana'
  },
  defaultSlippage: 0.5, // 0.5%
};
