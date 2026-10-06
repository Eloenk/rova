'use client';
import { createWalletClient, custom, parseUnits } from 'viem';
import { arcTestnet } from './arcChain';
import { TOKENS } from './config';

const ERC20_TRANSFER_ABI = [{
  type: 'function',
  name: 'transfer',
  stateMutability: 'nonpayable',
  inputs: [
    { name: 'recipient', type: 'address' },
    { name: 'amount', type: 'uint256' },
  ],
  outputs: [{ name: '', type: 'bool' }],
}] as const;

export async function sendUsdcSelfCustody(toAddress: string, amountUsdc: number): Promise<string> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('No Web3 wallet extension found');
  }
  const client = createWalletClient({
    chain: arcTestnet,
    transport: custom((window as any).ethereum),
  });
  const [account] = await client.getAddresses();
  if (!account) throw new Error('Wallet not connected');

  const hash = await client.writeContract({
    account,
    address: TOKENS.USDC.address as `0x${string}`,
    abi: ERC20_TRANSFER_ABI,
    functionName: 'transfer',
    args: [toAddress as `0x${string}`, parseUnits(String(amountUsdc), 6)],
  });
  return hash;
}

export async function resolveRecipientAddress(identifier: string): Promise<string> {
  const res = await fetch(`/api/agent/resolve-recipient?id=${encodeURIComponent(identifier)}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Failed to resolve recipient');
  return data.address;
}
