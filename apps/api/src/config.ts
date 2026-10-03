import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  API_BASE_URL: z.string().default('http://localhost:3000'),
  VERSION: z.string().default('0.1.0'),

  CLERK_SECRET_KEY: z.string().default(''),
  CLERK_PUBLISHABLE_KEY: z.string().default(''),

  DATABASE_URL: z.string().default(''),
  DATABASE_URL_UNPOOLED: z.string().default(''),

  UPSTASH_REDIS_REST_URL: z.string().default(''),
  UPSTASH_REDIS_REST_TOKEN: z.string().default(''),
  UPSTASH_REDIS_URL: z.string().default(''),

  TELNYX_API_KEY: z.string().default(''),
  TELNYX_CONNECTION_ID: z.string().default(''),
  TELNYX_FROM_NUMBER: z.string().default(''),
  TELNYX_PUBLIC_KEY: z.string().default(''),

  DODO_PAYMENTS_API_KEY: z.string().default(''),
  DODO_PAYMENTS_WEBHOOK_KEY: z.string().default(''),
  DODO_PAYMENTS_PRODUCT_ID: z.string().default(''),
  DODO_PAYMENTS_ANUAL_PRODUCT_ID: z.string().default(''),
  DODO_PAYMENTS_ENVIRONMENT: z.enum(['test_mode', 'live_mode']).default('test_mode'),
  DODO_PAYMENTS_RETURN_URL: z.string().default('http://localhost:5173/'),
  TRIAL_PERIOD_DAYS: z.coerce.number().int().positive().default(2),
  TRIAL_CALL_LIMIT: z.coerce.number().int().positive().default(2),
  DAILY_REMINDER_LIMIT: z.coerce.number().int().positive().default(4),

  GEO_ALLOW_PREFIXES: z.string().default(''),
  SENTRY_DSN: z.string().default(''),
  CORS_ORIGINS: z.string().default(''),

  // Comma-separated Google Gemini API keys. The enhancer rotates across them
  // round-robin and fails over to the next key on errors or timeouts, so a
  // single exhausted key never blocks reminder creation.
  GEMINI_API_KEYS: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-3.1-flash-lite-preview')
});

type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment: ${issues}`);
  }
  return parsed.data;
}

export const env: Env = loadEnv();

export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

export function requiredEnv(name: keyof Env, feature: string): string {
  const value = env[name];
  if (!value) {
    throw new Error(`${feature} requires env ${name} to be set. Add it to apps/api/.env`);
  }
  return value as string;
}

export function geoAllowedPrefixes(): string[] {
  return env.GEO_ALLOW_PREFIXES.split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (s.startsWith('+') ? s : `+${s}`));
}

export function corsOriginList(): string[] {
  return env.CORS_ORIGINS.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function geminiApiKeys(): string[] {
  return env.GEMINI_API_KEYS.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}