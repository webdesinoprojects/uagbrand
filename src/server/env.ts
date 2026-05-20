import "server-only";

type ServerEnvKey =
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "SUPABASE_PASSWORD"
  | "IMAGEKIT_PRIVATE_KEY"
  | "RESEND_API_KEY"
  | "EMAIL_FROM"
  | "PAYMENT_PROVIDER"
  | "PAYMENT_PROVIDER_SECRET_KEY"
  | "PAYMENT_WEBHOOK_SECRET"
  | "ADMIN_SESSION_COOKIE_NAME"
  | "RATE_LIMIT_SECRET"
  | "CRON_SECRET";

type PublicEnvKey =
  | "NEXT_PUBLIC_APP_URL"
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
  | "NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT"
  | "NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY";

export function readServerEnv(key: ServerEnvKey) {
  return process.env[key];
}

export function requireServerEnv(key: ServerEnvKey) {
  const value = readServerEnv(key);

  if (!value) {
    throw new Error(`Missing required server environment variable: ${key}`);
  }

  return value;
}

export function readPublicEnv(key: PublicEnvKey) {
  return process.env[key];
}

export function requirePublicEnv(key: PublicEnvKey) {
  const value = readPublicEnv(key);

  if (!value) {
    throw new Error(`Missing required public environment variable: ${key}`);
  }

  return value;
}

export function hasSupabasePublicEnv() {
  return Boolean(
    readPublicEnv("NEXT_PUBLIC_SUPABASE_URL") &&
      readPublicEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  );
}

export function hasSupabaseAdminEnv() {
  return Boolean(hasSupabasePublicEnv() && readServerEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

export function hasImageKitEnv() {
  return Boolean(
    readPublicEnv("NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT") &&
      readPublicEnv("NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY") &&
      readServerEnv("IMAGEKIT_PRIVATE_KEY"),
  );
}
