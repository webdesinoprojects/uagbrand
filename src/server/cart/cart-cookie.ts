import "server-only";

import { randomBytes } from "crypto";

import { cookies } from "next/headers";

export const CART_COOKIE_NAME = "ae_cart";
export const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const CART_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;

export async function getGuestCartToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CART_COOKIE_NAME)?.value;

  return token && isValidCartToken(token) ? token : null;
}

export async function ensureGuestCartToken() {
  const existing = await getGuestCartToken();
  if (existing) {
    return existing;
  }

  const token = randomBytes(32).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(CART_COOKIE_NAME, token, getCartCookieOptions());

  return token;
}

export async function clearGuestCartToken() {
  const cookieStore = await cookies();
  cookieStore.delete(CART_COOKIE_NAME);
}

export function isValidCartToken(token: string) {
  return CART_TOKEN_PATTERN.test(token);
}

function getCartCookieOptions() {
  return {
    httpOnly: true,
    maxAge: CART_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    priority: "high" as const,
  };
}
