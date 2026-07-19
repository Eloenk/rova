import { createPublicClient, http } from 'viem';
import { arcTestnet } from './arcChain';
import { TOKENS } from './config';

let _client: ReturnType<typeof createPublicClient> | null = null;

export function getArcPublicClient() {
  if (_client) return _client;
  _client = createPublicClient({ chain: arcTestnet, transport: http('https://rpc.testnet.arc.network') });
  return _client;
}

const ERC20_ABI = [{ name:'balanceOf', type:'function', stateMutability:'view', inputs:[{name:'account',type:'address'}], outputs:[{name:'',type:'uint256'}] }] as const;

export async function getUsdcBalance(address: `0x${string}`): Promise<number> {
  const raw = await getArcPublicClient().readContract({ address: TOKENS.USDC.address, abi: ERC20_ABI, functionName: 'balanceOf', args: [address] });
  return Number(raw) / 10 ** TOKENS.USDC.decimals;
}
