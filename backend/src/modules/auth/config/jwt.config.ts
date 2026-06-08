const DEVELOPMENT_JWT_SECRET = 'development-only-jwt-secret';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required to initialize authentication.');
  }

  return DEVELOPMENT_JWT_SECRET;
}
