import { defineChain } from 'viem';
import { publicEnv } from './env/public';

const arcRpcUrl = publicEnv.arcRpcUrl || 'https://rpc.mainnet.arc.io';

export const arcChain = defineChain({
  id: 5042,
  name: 'Arc Mainnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: [arcRpcUrl] } },
  blockExplorers: { default: { name: 'Arc Explorer', url: 'https://explorer.arc.io' } },
});
