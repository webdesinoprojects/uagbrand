"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import type {
  CartData,
  CustomerAddressData,
  CustomerOrderListData,
  CustomerProfileData,
  CustomerSessionData,
  WishlistData,
} from "@/types/api";

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string } };

export function AccountClient() {
  const [profile, setProfile] = useState<CustomerProfileData | null>(null);
  const [cart, setCart] = useState<CartData | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddressData[]>([]);
  const [wishlist, setWishlist] = useState<WishlistData | null>(null);
  const [orders, setOrders] = useState<CustomerOrderListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      const [profileData, cartData, addressData, wishlistData, orderData] =
        await Promise.all([
          getJson<CustomerProfileData>("/api/account/profile"),
          getJson<CartData>("/api/cart"),
          getJson<{ items: CustomerAddressData[] }>("/api/account/addresses"),
          getJson<WishlistData>("/api/wishlist"),
          getJson<CustomerOrderListData>("/api/orders?pageSize=5"),
        ]);

      if (!cancelled) {
        setProfile(profileData.ok ? profileData.data : null);
        setCart(cartData.ok ? cartData.data : null);
        setAddresses(addressData.ok ? addressData.data.items : []);
        setWishlist(wishlistData.ok ? wishlistData.data : null);
        setOrders(orderData.ok ? orderData.data : null);
        setLoading(false);
      }
    }

    loadAccount();

    return () => {
      cancelled = true;
    };
  }, []);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthSubmitting(true);
    setAuthMessage(null);

    const formData = new FormData(event.currentTarget);
    const endpoint =
      authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload =
      authMode === "login"
        ? {
            email: formData.get("email"),
            password: formData.get("password"),
          }
        : {
            email: formData.get("email"),
            password: formData.get("password"),
            fullName: formData.get("fullName"),
            phone: formData.get("phone"),
          };

    const response = await getJson<CustomerSessionData>(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setAuthSubmitting(false);

    if (!response.ok) {
      setAuthMessage(response.error.message);
      return;
    }

    window.dispatchEvent(new Event("allearbuds:cart-updated"));
    window.location.reload();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    window.dispatchEvent(new Event("allearbuds:cart-updated"));
    window.location.reload();
  }

  if (loading) {
    return <AccountShell title="Account" subtitle="Loading your account..." />;
  }

  if (!profile) {
    return (
      <AccountShell
        title="Login / Register"
        subtitle="Sign in to manage orders, addresses, wishlist and checkout."
      >
        <section className="max-w-xl rounded-lg border border-border bg-surface p-5">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-background p-1">
            {(["login", "register"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setAuthMode(mode);
                  setAuthMessage(null);
                }}
                className={`h-10 rounded-md text-sm font-black capitalize transition ${
                  authMode === mode
                    ? "bg-brand text-white"
                    : "text-muted hover:bg-surface"
                }`}
              >
                {mode === "login" ? "Login" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={submitAuth} className="mt-5 grid gap-3">
            {authMode === "register" ? (
              <>
                <input
                  name="fullName"
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder="Full name"
                  className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-bold outline-none focus:border-brand"
                />
                <input
                  name="phone"
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  maxLength={10}
                  className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-bold outline-none focus:border-brand"
                />
              </>
            ) : null}
            <input
              name="email"
              required
              type="email"
              placeholder="Email"
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-bold outline-none focus:border-brand"
            />
            <input
              name="password"
              required
              type="password"
              minLength={8}
              maxLength={128}
              placeholder="Password"
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-bold outline-none focus:border-brand"
            />
            <button
              disabled={authSubmitting}
              className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-surface-strong disabled:text-muted"
            >
              {authSubmitting
                ? "Please wait..."
                : authMode === "login"
                  ? "Login"
                  : "Create account"}
            </button>
            {authMessage ? (
              <p className="text-sm font-bold text-danger">{authMessage}</p>
            ) : null}
          </form>
        </section>
      </AccountShell>
    );
  }

  return (
    <AccountShell
      title={`Hi${profile.fullName ? `, ${profile.fullName}` : ""}`}
      subtitle={profile.email}
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/account/profile"
          className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-xs font-black text-white"
        >
          Edit profile
        </Link>
        <button
          type="button"
          onClick={logout}
          className="h-10 rounded-lg border border-border px-4 text-xs font-black text-danger"
        >
          Logout
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Cart items" value={String(cart?.itemCount ?? 0)} href="/cart" />
        <MetricCard label="Addresses" value={String(addresses.length)} href="/account/addresses" />
        <MetricCard label="Wishlist" value={String(wishlist?.items.length ?? 0)} href="/account/wishlist" />
        <MetricCard label="Orders" value={String(orders?.pagination.total ?? 0)} href="/account/orders" />
      </div>

      <section className="mt-8 rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-brand">Recent orders</p>
            <h2 className="mt-1 text-xl font-black text-foreground">Order history</h2>
          </div>
          <Link href="/account/orders" className="text-sm font-black text-brand">
            View all
          </Link>
        </div>
        <div className="mt-4 grid gap-3">
          {orders?.items.length ? (
            orders.items.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-4 text-sm font-bold"
              >
                <span>{order.orderNumber}</span>
                <span>Rs. {order.totalAmount.toLocaleString("en-IN")}</span>
              </Link>
            ))
          ) : (
            <p className="text-sm font-bold text-muted">No orders yet.</p>
          )}
        </div>
      </section>
    </AccountShell>
  );
}

function AccountShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm font-black uppercase text-brand">My account</p>
      <h1 className="mt-2 font-display text-4xl font-black text-foreground">{title}</h1>
      <p className="mt-2 text-sm font-bold text-muted">{subtitle}</p>
      <div className="mt-8">{children}</div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border bg-surface p-4 transition hover:border-brand hover:shadow-md"
    >
      <p className="text-xs font-black uppercase text-muted">{label}</p>
      <p className="mt-3 text-3xl font-black text-foreground">{value}</p>
    </Link>
  );
}

async function getJson<T>(
  url: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: init?.body ? { "content-type": "application/json" } : undefined,
    ...init,
  });
  return (await response.json().catch(() => ({
    ok: false,
    error: { message: "Something went wrong." },
  }))) as ApiResponse<T>;
}
