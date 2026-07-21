// ─────────────────────────────────────────────────────────────────────────────
// Rova — Phone-to-Wallet Identity Mapping
//
// Resolves phone numbers (E.164 format) to Circle-managed developer wallets or
// user-connected self-custody wallet addresses.
// ─────────────────────────────────────────────────────────────────────────────

import { resolveRecipient } from './emailWallets';
import { normalizePhone } from './whatsapp';

export interface PhoneWalletInfo {
  phone: string;
  emailAlias: string;
  walletAddress: string;
  custodyMode: 'managed' | 'self_custody';
}

// In-memory registry mapping phone numbers to custom wallet overrides if set
const phoneWalletOverrides = new Map<string, { address: string; mode: 'managed' | 'self_custody' }>();

/// Resolves a raw phone input (e.g. "+254712345678" or "254712345678") to a spendable wallet.
export async function resolvePhoneWallet(rawPhone: string): Promise<PhoneWalletInfo> {
  const phone = normalizePhone(rawPhone);

  const override = phoneWalletOverrides.get(phone);
  if (override) {
    return {
      phone,
      emailAlias: `phone-${phone.replace('+', '')}@rova.app`,
      walletAddress: override.address,
      custodyMode: override.mode,
    };
  }

  // Synthesize a deterministic email alias for Circle Developer-Controlled Wallet onboarding
  const cleanDigits = phone.replace(/[^\d]/g, '');
  const emailAlias = `phone-${cleanDigits}@rova.app`;

  const { address } = await resolveRecipient(emailAlias);

  return {
    phone,
    emailAlias,
    walletAddress: address,
    custodyMode: 'managed',
  };
}

/// Links a specific custom wallet address (e.g. self-custody wagmi address) to a phone number.
export function linkPhoneToCustomWallet(rawPhone: string, walletAddress: string, custodyMode: 'managed' | 'self_custody' = 'self_custody') {
  const phone = normalizePhone(rawPhone);
  phoneWalletOverrides.set(phone, { address: walletAddress, mode: custodyMode });
}
