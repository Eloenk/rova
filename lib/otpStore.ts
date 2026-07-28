// Shared in-memory OTP cache for local development resilience
const memoryOtpStore = new Map<string, { code: string; expiresAt: number }>();

export function setMemoryOtp(email: string, code: string, expiresAt: number) {
  memoryOtpStore.set(email.toLowerCase().trim(), { code, expiresAt });
}

export function getMemoryOtp(email: string) {
  return memoryOtpStore.get(email.toLowerCase().trim());
}

export function deleteMemoryOtp(email: string) {
  memoryOtpStore.delete(email.toLowerCase().trim());
}
