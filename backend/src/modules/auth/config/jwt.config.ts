const DEVELOPMENT_JWT_SECRET = 'development-only-jwt-secret';

export function getJwtSecret(
  configuredSecret = process.env.JWT_SECRET,
  nodeEnv = process.env.NODE_ENV,
) {
  const secret = configuredSecret?.trim();

  if (secret) {
    return secret;
  }

  if (nodeEnv === 'production') {
    throw new Error('JWT_SECRET is required to initialize authentication.');
  }

  return DEVELOPMENT_JWT_SECRET;
}
