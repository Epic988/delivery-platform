import 'dotenv/config';

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.length === 0) throw new Error(`Missing required env var: ${name}`);
  return v;
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';
const corsOrigin = process.env.CORS_ORIGIN ?? '*';
const jwtSecret = required('JWT_SECRET');

if (isProduction) {
  if (!corsOrigin || corsOrigin === '*') {
    throw new Error('FATAL: CORS_ORIGIN must be an explicit allowlist in production');
  }
  if (jwtSecret.length < 32) {
    throw new Error('FATAL: JWT_SECRET must be at least 32 characters in production');
  }
}

export const config = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? '0.0.0.0',
  databaseUrl: required('DATABASE_URL'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 12),
  corsOrigin,
  logLevel: process.env.LOG_LEVEL ?? 'info',
  trustProxy: isProduction && process.env.TRUST_PROXY === 'true',
} as const;
