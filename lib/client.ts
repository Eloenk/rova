import { createPublicClient, http } from 'viem';
import { arcChain } from './arcChain';
import { ARC_NETWORK, TOKENS } from './config';

let _client: ReturnType<typeof createPublicClient> | null = null;

export function getArcPublicClient() {
  if (_client) return _client;
  _client = createPublicClient({ chain: arcChain, transport: http(ARC_NETWORK.rpc) });
  return _client;
}

const ERC20_ABI = [{ name:'balanceOf', type:'function', stateMutability:'view', inputs:[{name:'account',type:'address'}], outputs:[{name:'',type:'uint256'}] }] as const;

export async function getUsdcBalance(address: `0x${string}`): Promise<number> {
  const raw = await getArcPublicClient().readContract({ address: TOKENS.USDC.address, abi: ERC20_ABI, functionName: 'balanceOf', args: [address] });
  return Number(raw) / 10 ** TOKENS.USDC.decimals;
}
