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

import { getSupabaseClient } from './supabase';

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

export function isPhone(identifier: string): boolean {
  const digitsOnly = identifier.trim().replace(/[^0-9]/g, '');
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
}

/// Resolves either an email, phone number, or 0x address to a spendable/receivable address.
/// Addresses pass through unchanged. Registered emails & phone numbers are looked up via Supabase.
export async function resolveRecipient(identifier: string): Promise<{ address: string; isNewWallet: boolean }> {
  const trimmed = identifier.trim();

  if (isAddress(trimmed)) {
    return { address: trimmed, isNewWallet: false };
  }

  const supabase = getSupabaseClient();

  // 1. Email Resolution
  if (isEmail(trimmed)) {
    const key = normalize(trimmed);

    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('circle_wallet_address')
        .eq('email', key)
        .limit(1);

      if (!error && data && data.length > 0 && data[0].circle_wallet_address) {
        return { address: data[0].circle_wallet_address, isNewWallet: false };
      }
    }

    const existing = emailToWallet.get(key);
    if (existing) return { address: existing.address, isNewWallet: false };

    const { createSingleWallet } = await import('./circle');
    const { address, walletId } = await createSingleWallet(key);
    emailToWallet.set(key, { address, walletId, createdAt: new Date().toISOString() });

    if (supabase) {
      await supabase.from('users').upsert({
        id: `usr_${key.replace(/[^a-z0-9]/g, '_')}`,
        email: key,
        circle_wallet_address: address,
      });
    }

    return { address, isNewWallet: true };
  }

  // 2. Phone Number Resolution
  if (isPhone(trimmed)) {
    const cleanPhone = trimmed.replace(/[^0-9]/g, '');

    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('circle_wallet_address')
        .or(`whatsapp_number.eq.${cleanPhone},whatsapp_number.eq.+${cleanPhone}`)
        .limit(1);

      if (!error && data && data.length > 0 && data[0].circle_wallet_address) {
        return { address: data[0].circle_wallet_address, isNewWallet: false };
      }
    }

    throw new Error(`No registered Rova user found for phone number "${identifier}". Please ask them to register on rovapay.xyz.`);
  }

  throw new Error(`"${identifier}" isn't a valid wallet address, email, or phone number`);
}

export function listKnownEmailWallets() {
  return Array.from(emailToWallet.entries()).map(([email, w]) => ({ email, ...w }));
}

