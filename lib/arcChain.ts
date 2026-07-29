import { defineChain } from 'viem';
import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';

function getArcRpcUrl(): string {
  if (process.env.ARC_RPC_URL) return process.env.ARC_RPC_URL;
  try {
    const configPath = path.join(process.cwd(), 'config.yaml');
    if (fs.existsSync(configPath)) {
      const fileContents = fs.readFileSync(configPath, 'utf8');
      const parsed = yaml.load(fileContents) as any;
      if (parsed?.arc?.rpc_url) {
        return parsed.arc.rpc_url;
      }
    }
  } catch (err) {
    // Fallback if config file is not readable in client bundle
  }
  return 'https://rpc.testnet.arc.network';
}

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: [getArcRpcUrl()] } },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
});
