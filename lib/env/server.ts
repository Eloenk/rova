import 'server-only';

import { publicEnv } from './public';

type ServerVariable =
  | 'ANTHROPIC_API_KEY'
  | 'ARC_RPC_URL'
  | 'CIRCLE_API_KEY'
  | 'CIRCLE_ENTITY_SECRET'
  | 'DISCORD_FEEDBACK_WEBHOOK_URL'
  | 'FLOWFI_VALIDATOR_WALLET'
  | 'GOOGLE_GENERATIVE_AI_API_KEY'
  | 'KIT_KEY'
  | 'NVIDIA_API_KEY'
  | 'NVIDIA_BASE_URL'
  | 'RESEND_API_KEY'
  | 'RESEND_FROM_EMAIL'
  | 'ROVA_ADMIN_TOKEN'
  | 'ROVA_ALLOW_MEMORY_OTP'
  | 'ROVA_EXECUTION_ENABLED'
  | 'ROVA_MAX_AUTONOMOUS_AMOUNT_USDC'
  | 'ROVA_MAX_MANUAL_AMOUNT_USDC'
  | 'ROVA_SAVINGS_VAULT_ADDRESS'
  | 'ROVA_SESSION_SECRET'
  | 'ROVA_VALIDATOR_WALLET'
  | 'SUPABASE_SECRET_KEY'
  | 'SUPABASE_URL';

function read(name: ServerVariable): string {
  return process.env[name]?.trim() || '';
}

function enabled(name: ServerVariable): boolean {
  return read(name).toLowerCase() === 'true';
}

function positiveNumber(name: ServerVariable, fallback: number): number {
  const value = Number(read(name));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const serverEnv = {
  get isProduction() { return process.env.NODE_ENV === 'production'; },
  get googleGenerativeAiApiKey() { return read('GOOGLE_GENERATIVE_AI_API_KEY'); },
  get anthropicApiKey() { return read('ANTHROPIC_API_KEY'); },
  get nvidiaApiKey() { return read('NVIDIA_API_KEY'); },
  get nvidiaBaseUrl() { return read('NVIDIA_BASE_URL') || 'https://integrate.api.nvidia.com/v1/chat/completions'; },
  get circleApiKey() { return read('CIRCLE_API_KEY'); },
  get circleEntitySecret() { return read('CIRCLE_ENTITY_SECRET'); },
  get circleKitKey() { return read('KIT_KEY') || publicEnv.circleKitKey; },
  get supabaseUrl() { return read('SUPABASE_URL'); },
  get supabaseSecretKey() { return read('SUPABASE_SECRET_KEY'); },
  get sessionSecret() { return read('ROVA_SESSION_SECRET'); },
  get adminToken() { return read('ROVA_ADMIN_TOKEN'); },
  get executionEnabled() { return enabled('ROVA_EXECUTION_ENABLED'); },
  get allowMemoryOtp() { return process.env.NODE_ENV !== 'production' && enabled('ROVA_ALLOW_MEMORY_OTP'); },
  get manualAmountLimitUsdc() { return positiveNumber('ROVA_MAX_MANUAL_AMOUNT_USDC', 1_000); },
  get autonomousAmountLimitUsdc() { return positiveNumber('ROVA_MAX_AUTONOMOUS_AMOUNT_USDC', 100); },
  get arcRpcUrl() { return read('ARC_RPC_URL'); },
  get discordFeedbackWebhookUrl() { return read('DISCORD_FEEDBACK_WEBHOOK_URL'); },
  get resendApiKey() { return read('RESEND_API_KEY'); },
  get resendFromEmail() { return read('RESEND_FROM_EMAIL') || 'Rova Security <onboarding@resend.dev>'; },
  get validatorWallet() { return read('ROVA_VALIDATOR_WALLET') || read('FLOWFI_VALIDATOR_WALLET'); },
  get savingsVaultAddress() { return read('ROVA_SAVINGS_VAULT_ADDRESS') || publicEnv.savingsVaultAddress; },
};

export function requireSecret(value: string, name: ServerVariable, minimumLength = 1): string {
  if (value.length < minimumLength) {
    throw new Error(`${name} must be configured with at least ${minimumLength} characters`);
  }
  return value;
}
