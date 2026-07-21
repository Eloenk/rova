'use client';
// ─────────────────────────────────────────────────────────────────────────────
// Rova — Self-Custody Send
//
// Used only for the "ready_to_execute" approval step on self-custody Agent
// rules/intents. USDC is Arc's native gas token (see lib/config.ts), so this
// is a plain native value transfer signed by the user's own connected wallet
// via wagmi — Circle's server-side DCW signing is never involved here, which
// is the whole point of the self-custody path.
// ─────────────────────────────────────────────────────────────────────────────

import { sendTransaction } from 'wagmi/actions';
import { parseUnits } from 'viem';
import { wagmiConfig } from './wagmiConfig';
import { arcTestnet } from './arcChain';

export async function sendUsdcSelfCustody(toAddress: string, amountUsdc: number): Promise<string> {
  const hash = await sendTransaction(wagmiConfig, {
    to: toAddress as `0x${string}`,
    value: parseUnits(String(amountUsdc), 6),
    chainId: arcTestnet.id,
  });
  return hash;
}

export async function resolveRecipientAddress(identifier: string): Promise<string> {
  const res = await fetch(`/api/agent/resolve-recipient?id=${encodeURIComponent(identifier)}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Failed to resolve recipient');
  return data.address;
}
