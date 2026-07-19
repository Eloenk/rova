#!/usr/bin/env tsx
// Run: npm run register-agent
import 'dotenv/config';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { arcTestnet } from 'viem/chains';
import { createAgentWallets, registerAgentIdentity, recordReputation } from '../lib/circle';
import { ARC_TESTNET, ERC8004, AGENT_METADATA, arcScan, TOKENS } from '../lib/config';
import { parseAbi } from 'viem';

const step = (n: number, s: string) => console.log(`\n${'─'.repeat(55)}\n[${n}/4] ${s}\n${'─'.repeat(55)}`);
const ok   = (s: string) => console.log(`  ✓  ${s}`);
const info = (k: string, v: string) => console.log(`  ${k.padEnd(22)} ${v}`);

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Rova — ERC-8004 Agent Registration         ║');
  console.log('║  Arc Testnet (Chain ID: 5042002)                  ║');
  console.log('╚═══════════════════════════════════════════════════╝');

  step(1, 'Creating Circle Developer Controlled Wallets on Arc');
  const wallets = await createAgentWallets('Rova Capital Engine');
  ok('Two SCA wallets created (owner + validator)');
  info('Owner:',     wallets.ownerAddress);
  info('Validator:', wallets.validatorAddress);

  console.log(`\n  ⚠️  ACTION REQUIRED: Fund THE OWNER WALLET to proceed:`);
  console.log(`     Address: ${wallets.ownerAddress}`);
  console.log(`     Faucet: ${ARC_TESTNET.faucet}`);
  console.log(`\n  Polling for USDC balance… (Awaiting ~10 USDC)`);

  const client = createPublicClient({ chain: arcTestnet, transport: http(ARC_TESTNET.rpc) });
  const usdcAbi = parseAbi(['function balanceOf(address) view returns (uint256)']);
  
  let balance = 0n;
  while (balance === 0n) {
    try {
      balance = await client.readContract({
        address: TOKENS.USDC.address as `0x${string}`,
        abi: usdcAbi,
        functionName: 'balanceOf',
        args: [wallets.ownerAddress as `0x${string}`],
      }) as bigint;
      if (balance > 0n) break;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 5000));
  }

  ok('Funds detected. Proceeding to registration…');

  step(2, 'Registering agent identity on ERC-8004 IdentityRegistry');
  const metaURI = process.env.ROVA_METADATA_URI ?? 'ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei';
  const regHash = await registerAgentIdentity(wallets.ownerAddress, metaURI);
  ok('Identity NFT minted on Arc');
  info('Transaction:', arcScan.tx(regHash));

  step(3, 'Retrieving agent token ID');
  const latest = await client.getBlockNumber();
  const from   = latest > BigInt(10000) ? latest - BigInt(10000) : BigInt(0);
  const logs   = await client.getLogs({
    address: ERC8004.IdentityRegistry,
    event:   parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'),
    args:    { to: wallets.ownerAddress as `0x${string}` },
    fromBlock: from, toBlock: latest,
  });
  const agentId = logs[logs.length - 1].args.tokenId!.toString();
  ok(`Agent ID: #${agentId}`);
  info('NFT explorer:', arcScan.nft(agentId));

  step(4, 'Recording initial reputation (via validator wallet)');
  const repHash = await recordReputation(wallets.validatorAddress, agentId, 75, 'agent_registered');
  ok('Reputation recorded on Arc');
  info('Transaction:', arcScan.tx(repHash));

  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  ✅  Done — Copy these to your .env.local         ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  console.log(`ROVA_AGENT_ID=${agentId}`);
  console.log(`ROVA_OWNER_WALLET=${wallets.ownerAddress}`);
  console.log(`ROVA_VALIDATOR_WALLET=${wallets.validatorAddress}`);
  console.log(`\nView your agent:\n  ${arcScan.nft(agentId)}\n`);
}

main().catch(e => { console.error('\n❌ Failed:', e.message); process.exit(1); });
