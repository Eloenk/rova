import { NextRequest, NextResponse } from 'next/server';
import { AGENT_METADATA, ERC8004, ARC_NETWORK } from '@/lib/config';
import { createPublicClient, http, parseAbi } from 'viem';
import { arcChain } from '@/lib/arcChain';
import { requireSession } from '@/lib/auth';
import { publicEnv } from '@/lib/env/public';

export async function GET(request: NextRequest) {
  const guard = await requireSession(request);
  if ('response' in guard) return guard.response;
  const agentId = publicEnv.rovaAgentId;

  let reputationScore = 75; // Default for new agents
  let isValidated = true;

  if (agentId) {
    try {
      const client = createPublicClient({ 
        chain: arcChain,
        transport: http(ARC_NETWORK.rpc)
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
