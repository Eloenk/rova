const readPublic = (value: string | undefined): string => value?.trim() || '';

export const publicEnv = Object.freeze({
  appUrl: readPublic(process.env.NEXT_PUBLIC_APP_URL),
  arcChain: readPublic(process.env.NEXT_PUBLIC_ARC_CHAIN) || 'Arc',
  arcRpcUrl: readPublic(process.env.NEXT_PUBLIC_ARC_RPC_URL) || 'https://rpc.mainnet.arc.io',
  circleKitKey: readPublic(process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY),
  executionLogAddress: readPublic(process.env.NEXT_PUBLIC_ROVA_EXECUTION_LOG_ADDRESS),
  rovaAgentId: readPublic(process.env.NEXT_PUBLIC_ROVA_AGENT_ID),
  savingsVaultAddress: readPublic(process.env.NEXT_PUBLIC_ROVA_SAVINGS_VAULT_ADDRESS),
  walletConnectProjectId: readPublic(process.env.NEXT_PUBLIC_WC_PROJECT_ID),
  whatsappLink: readPublic(process.env.NEXT_PUBLIC_WHATSAPP_LINK),
});
