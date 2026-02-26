import bcrypt from 'bcryptjs';

/**
 * Verify a plain-text password against a bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
