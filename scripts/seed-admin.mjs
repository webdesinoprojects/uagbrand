import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

const envPath = resolve(process.cwd(), ".env");
const env = loadEnv(envPath);

const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");
const email = readOrPersistEnv("ADMIN_SEED_EMAIL", "admin@allearbuds.local");
const password = readOrPersistEnv("ADMIN_SEED_PASSWORD", generatePassword());
const role = readOrPersistEnv("ADMIN_SEED_ROLE", "admin");
const fullName = readOrPersistEnv("ADMIN_SEED_FULL_NAME", "AllEarbuds Admin");

if (process.env.NODE_ENV === "production" && env.ALLOW_ADMIN_SEED !== "true") {
  throw new Error("Refusing to seed an admin while NODE_ENV=production.");
}

if (!["support", "editor", "admin"].includes(role)) {
  throw new Error("ADMIN_SEED_ROLE must be support, editor, or admin.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const user = await upsertAuthUser();
await upsertProfile(user.id);

console.log(
  JSON.stringify(
    {
      ok: true,
      email,
      role,
      profileId: user.id,
      passwordStoredIn: ".env:ADMIN_SEED_PASSWORD",
    },
    null,
    2,
  ),
);

async function upsertAuthUser() {
  const existing = await findUserByEmail(email);

  if (existing) {
    const result = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (result.error || !result.data.user) {
      throw result.error ?? new Error("Failed to update admin auth user.");
    }

    return result.data.user;
  }

  const result = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (result.error || !result.data.user) {
    throw result.error ?? new Error("Failed to create admin auth user.");
  }

  return result.data.user;
}

async function upsertProfile(userId) {
  const result = await supabase.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      role,
      is_active: true,
    },
    { onConflict: "id" },
  );

  if (result.error) {
    throw result.error;
  }
}

async function findUserByEmail(targetEmail) {
  const normalizedEmail = targetEmail.toLowerCase();
  let page = 1;

  while (page <= 20) {
    const result = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (result.error) {
      throw result.error;
    }

    const users = result.data.users ?? [];
    const match = users.find(
      (user) => user.email?.toLowerCase() === normalizedEmail,
    );

    if (match || users.length < 1000) {
      return match ?? null;
    }

    page += 1;
  }

  return null;
}

function loadEnv(path) {
  if (!existsSync(path)) {
    return {};
  }

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  const values = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    values[key] = unquote(value);
    process.env[key] ??= values[key];
  }

  return values;
}

function readEnv(key) {
  const value = process.env[key] || env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function readOrPersistEnv(key, fallback) {
  const value = process.env[key] || env[key];
  if (value) {
    return value;
  }

  persistEnv(key, fallback);
  env[key] = fallback;
  process.env[key] = fallback;
  return fallback;
}

function persistEnv(key, value) {
  const current = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const prefix = current.endsWith("\n") || current.length === 0 ? "" : "\n";
  writeFileSync(envPath, `${current}${prefix}${key}=${value}\n`);
}

function generatePassword() {
  return `Aa1!${randomBytes(18).toString("base64url")}`;
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
