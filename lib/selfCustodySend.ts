'use client';
import { createWalletClient, custom, parseUnits } from 'viem';
import { arcTestnet } from './arcChain';

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

  const hash = await client.sendTransaction({
    account,
    to: toAddress as `0x${string}`,
    value: parseUnits(String(amountUsdc), 6),
  });
  return hash;
}

export async function resolveRecipientAddress(identifier: string): Promise<string> {
  const res = await fetch(`/api/agent/resolve-recipient?id=${encodeURIComponent(identifier)}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Failed to resolve recipient');
  return data.address;
}
