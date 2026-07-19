export const AGENT_METADATA = {
  name: 'Rova Sentinel',
  description: 'Autonomous capital flow orchestrator with ERC-8004 compliance',
  version: '2.0',
  network: 'Arc Testnet',
  capabilities: ['arc_native', 'stablefx', 'cctp', 'reputation_tracking', 'compliance_monitoring']
};

export const ERC8004 = {
  IdentityRegistry: '0x1234567890abcdef1234567890abcdef12345678',
  ReputationRegistry: '0xabcdef1234567890abcdef1234567890abcdef12'
};

export const ARC_TESTNET = {
  rpc: 'https://rpc.arc-testnet.io',
  chainId: 8183,
  explorer: 'https://arcscan.io'
};

export const TOKENS = {
  USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
};

export const arcScan = {
  tx: (hash: string) => `${ARC_TESTNET.explorer}/tx/${hash}`,
  address: (addr: string) => `${ARC_TESTNET.explorer}/address/${addr}`
};
