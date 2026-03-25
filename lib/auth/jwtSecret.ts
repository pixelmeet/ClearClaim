/**
 * Centralized JWT secret — fail closed when misconfigured (no fallbacks).
 */
let cachedKey: Uint8Array | null = null;

export function getJwtSecretKey(): Uint8Array {
  if (cachedKey) return cachedKey;
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET is required and must be at least 32 characters. Set it in your environment.'
    );
  }
  cachedKey = new TextEncoder().encode(secret);
  return cachedKey;
}
