import { SignJWT, jwtVerify } from 'jose';
import { getJwtSecretKey } from '@/lib/auth/jwtSecret';

export type GoogleOnboardingState = {
  email: string;
  name: string;
  googleId: string;
};

const GOOGLE_ONBOARDING_AUD = 'google-onboarding';
const GOOGLE_ONBOARDING_ISS = 'clearclaim';

export async function encodeGoogleOnboardingState(
  payload: GoogleOnboardingState
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(GOOGLE_ONBOARDING_ISS)
    .setAudience(GOOGLE_ONBOARDING_AUD)
    .setExpirationTime('10m')
    .sign(getJwtSecretKey());
}

export async function decodeGoogleOnboardingState(
  token: string
): Promise<GoogleOnboardingState | null> {
  try {
    const verified = await jwtVerify(token, getJwtSecretKey(), {
      issuer: GOOGLE_ONBOARDING_ISS,
      audience: GOOGLE_ONBOARDING_AUD,
    });

    const email = String(verified.payload.email ?? '').trim().toLowerCase();
    const name = String(verified.payload.name ?? '').trim();
    const googleId = String(verified.payload.googleId ?? '').trim();

    if (!email || !googleId) return null;
    return { email, name, googleId };
  } catch {
    return null;
  }
}
