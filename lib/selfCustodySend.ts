'use client';

export async function sendUsdcSelfCustody(toAddress: string, amountUsdc: number): Promise<string> {
  void toAddress;
  void amountUsdc;
  throw new Error('Self-custody USDC transfers are disabled in the Arc mainnet release.');
}

export async function resolveRecipientAddress(identifier: string): Promise<string> {
  const res = await fetch(`/api/agent/resolve-recipient?id=${encodeURIComponent(identifier)}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Failed to resolve recipient');
  return data.address;
}
