// Rova — Arc & Circle Configuration
//
// Sources:
//   https://docs.arc.network/arc/references/connect-to-arc
//   https://docs.arc.network/arc/references/contract-addresses
//   https://developers.circle.com/cctp/references/contract-addresses.md
//   https://developers.circle.com/stablefx.md
//   https://developers.circle.com/gateway.md

// ── Arc Testnet Network ────────────────────────────────────────────────────────
export const ARC_TESTNET = {
  name:      'Arc Testnet',
  chainId:   5042002,
  chainIdHex:'0x4CC212',
  rpc:       'https://rpc.testnet.arc.network',
  rpcFallbacks: [
    'https://rpc.blockdaemon.testnet.arc.network',
    'https://rpc.quicknode.testnet.arc.network',
  ],
  ws:        'wss://rpc.testnet.arc.network',
  explorer:  'https://testnet.arcscan.app',
  faucet:    'https://faucet.circle.com',
  currency:  'USDC',
  // Circle SDK blockchain identifier
  circleBlockchain: 'ARC-TESTNET' as const,
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
    address:  '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a' as `0x${string}`,
    decimals:  6,
    symbol:   'EURC',
    name:     'Euro Coin',
    isNative:  false,
  },
  USYC: {
    address:      '0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C' as `0x${string}`,
    teller:       '0x9fdF14c5B14173D74C08Af27AebFf39240dC105A' as `0x${string}`,
    entitlements: '0xcc205224862c7641930c87679e98999d23c26113' as `0x${string}`,
    decimals:  6,
    symbol:   'USYC',
    name:     'US Treasury Yield Coin',
    permissioned: true, // Requires allowlisting from Circle Support
  },
} as const;

// ── CCTP V2 — Cross-Chain Transfer Protocol ────────────────────────────────────
// Arc is CCTP Domain 26. Use V2 — V1 is legacy.
// Bridge Kit (@circle-fin/bridge-kit) wraps this for frontend use.
export const CCTP = {
  domain:               26,
  TokenMessengerV2:     '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA' as `0x${string}`,
  MessageTransmitterV2: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275' as `0x${string}`,
  TokenMinterV2:        '0xb43db544E2c27092c107639Ad201b3dEfAbcF192' as `0x${string}`,
  // Fast transfer: ~8-20 seconds. Standard: 15-19 min (source chain finality)
  irisApi: 'https://iris-api-sandbox.circle.com/v2/messages',
} as const;

// ── Circle Gateway ─────────────────────────────────────────────────────────────
// Unified USDC balance across chains. Transfers in <500ms.
// No sign-up needed — fully permissionless.
export const GATEWAY = {
  // Same address on ALL supported chains
  walletAddress: '0x0077777d7EBA4688BDeF3E311b846F25870A19B9' as `0x${string}`,
  description:   'Unified USDC balance accessible from any supported chain (<500ms)',
  docs:          'https://developers.circle.com/gateway.md',
} as const;

// ── ERC-8004 AI Agent Registry ─────────────────────────────────────────────────
// Arc's native standard for AI agent onchain identity, reputation, and credentials.
// Docs: https://docs.arc.network/arc/tutorials/register-your-first-ai-agent
export const ERC8004 = {
  IdentityRegistry:   '0x8004A818BFB912233c491871b3d84c89A494BD9e' as `0x${string}`,
  ReputationRegistry: '0x8004B663056A597Dffe9eCcC1965A193B7388713' as `0x${string}`,
  ValidationRegistry: '0x8004Cb1BF31DAf7788923b405b754f57acEB4272' as `0x${string}`,
  standard:          'ERC-8004',
} as const;

// ── ERC-8183 Agentic Flow ──────────────────────────────────────────────────────
export const ERC8183 = {
  address: '0x0747EEf0706327138c69792bF28Cd525089e4583' as `0x${string}`,
} as const;

// ── Rova Execution Log ─────────────────────────────────────────────────────────
// Rova's own contract — NOT shared Circle/Arc infra. Deployed via Remix, see
// contracts/RovaExecutionLog.sol and DEPLOY_CONTRACT.md for instructions.
// Address comes from env because it's set once at deploy time, not baked into
// the repo (so a fresh deploy doesn't require an app code change).
export const ROVA_EXECUTION_LOG = {
  address: (process.env.NEXT_PUBLIC_ROVA_EXECUTION_LOG_ADDRESS || '0x58d1e3e11C7a93cb26C371B115f2710aF68d427a') as `0x${string}`,
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
  tx:      (hash: string)    => `${ARC_TESTNET.explorer}/tx/${hash}`,
  address: (addr: string)    => `${ARC_TESTNET.explorer}/address/${addr}`,
  token:   (addr: string)    => `${ARC_TESTNET.explorer}/token/${addr}`,
  nft:     (tokenId: string) => `${ARC_TESTNET.explorer}/token/${ERC8004.IdentityRegistry}/instance/${tokenId}`,
} as const;

export const AGENT_METADATA = {
  name:        'Rova Capital Flow Engine',
  description: 'Autonomous capital allocation agent on Arc. Native support for ERC-8004 identity and ERC-8183 economic flows.',
  agent_type:  'capital_flow',
  capabilities: [
    'intent_parsing',
    'usdc_routing',
    'cctp_bridging',
    'gateway_transfers',
    'stablefx_fx',
    'erc8004_identity',
    'erc8004_validation',
    'erc8183_escrowed_flows'
  ],
  version:     '1.1.0',
  network:     'ARC-TESTNET',
  powered_by:  'Anthropic Claude + Arc SDK + Circle App Kit',
} as const;

// ── App Kit Config ─────────────────────────────────────────────────────────────
export const APP_KIT_CONFIG = {
  chains: {
    ARC: 'Arc_Testnet',
    ETH: 'Ethereum_Sepolia',
    SOL: 'Solana_Devnet'
  },
  defaultSlippage: 0.5, // 0.5%
};
