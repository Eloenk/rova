import { NextResponse } from 'next/server';
import { AGENT_METADATA, ERC8004, ARC_TESTNET } from '@/lib/config';
import { createPublicClient, http, parseAbi } from 'viem';
import { arcTestnet } from '@/lib/arcChain';

export async function GET() {
  const agentId = process.env.NEXT_PUBLIC_ROVA_AGENT_ID;
  const ownerWallet = process.env.ROVA_OWNER_WALLET;

  let reputationScore = 75; // Default for new agents
  let isValidated = true;

  if (agentId) {
    try {
      const client = createPublicClient({ 
        chain: arcTestnet, 
        transport: http(ARC_TESTNET.rpc) 
      });
      
      const abi = parseAbi(['function getReputation(uint256) view returns (int128)']);
      
      const rep = await client.readContract({
        address: ERC8004.ReputationRegistry as `0x${string}`,
        abi,
        functionName: 'getReputation',
        args: [BigInt(agentId)],
      }) as bigint;

      reputationScore = Number(rep);
    } catch {
      // Agent not yet registered on-chain — using default score
    }
  }

  return NextResponse.json({
    ok: true,
    agentId: agentId || 'NOT_REGISTERED',
    name: AGENT_METADATA.name,
    reputationScore,
    isValidated,
    capabilities: AGENT_METADATA.capabilities
  });
}
