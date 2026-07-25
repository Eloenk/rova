// ─────────────────────────────────────────────────────────────────────────────
// Rova — Email → Wallet Resolution
//
// Backs "email or wallet" recipients across Send & Swap, Agent rules, and
// Command Hub standing intents. First send to an email creates a Circle-
// managed wallet for that address; every send after that reuses it — same
// pattern Circle's own email-onboarding examples use, just kept in one place
// so the Agent and manual Send don't diverge.
//
// In-memory for hackathon speed (see NOTES.md on persistence); the shape is
// deliberately a plain async map so swapping in a real store later doesn't
// change any call site.
// ─────────────────────────────────────────────────────────────────────────────

import { getIsMockMode } from './ai-provider';

interface WalletRecord {
  address: string;
  walletId: string;
  createdAt: string;
}

const emailToWallet = new Map<string, WalletRecord>();

function normalize(email: string) {
  return email.trim().toLowerCase();
}

export function isEmail(identifier: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim());
}

export function isAddress(identifier: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(identifier.trim());
}

/// Resolves either an email or a 0x address to a spendable/receivable address.
/// Addresses pass through unchanged. Emails get a Circle-managed wallet,
/// created on first use and reused after.
export async function resolveRecipient(identifier: string): Promise<{ address: string; isNewWallet: boolean }> {
  const trimmed = identifier.trim();

  if (isAddress(trimmed)) {
    return { address: trimmed, isNewWallet: false };
  }

  if (!isEmail(trimmed)) {
    throw new Error(`"${identifier}" isn't a valid wallet address or email`);
  }

  const key = normalize(trimmed);
  const existing = emailToWallet.get(key);
  if (existing) return { address: existing.address, isNewWallet: false };

  const mock = getIsMockMode();

  if (mock) {
    // Deterministic fake address so the same email always mocks to the same
    // "wallet" within a session — useful for demoing repeat sends.
    const hash = Array.from(key).reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 7);
    const address = '0x' + hash.toString(16).padStart(8, '0') + 'e'.repeat(32);
    emailToWallet.set(key, { address, walletId: `MOCK-${hash}`, createdAt: new Date().toISOString() });
    return { address, isNewWallet: true };
  }

  const { createSingleWallet } = await import('./circle');
  const { address, walletId } = await createSingleWallet(key);
  emailToWallet.set(key, { address, walletId, createdAt: new Date().toISOString() });
  return { address, isNewWallet: true };
}

export function listKnownEmailWallets() {
  return Array.from(emailToWallet.entries()).map(([email, w]) => ({ email, ...w }));
}
