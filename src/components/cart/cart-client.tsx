"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { CartData } from "@/types/api";

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string } };

export function CartClient() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function fetchCart() {
    const data = await getJson<CartData>("/api/cart");
    return data.ok ? data.data : null;
  }

  useEffect(() => {
    let cancelled = false;

    async function loadCart() {
      const data = await fetchCart();
      if (!cancelled) {
        setCart(data);
      }
    }

    loadCart();

    return () => {
      cancelled = true;
    };
  }, []);

  async function updateItem(id: string, quantity: number) {
    const data = await getJson<CartData>(`/api/cart/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });

    if (data.ok) {
      setCart(data.data);
      window.dispatchEvent(new Event("allearbuds:cart-updated"));
    } else {
      setMessage(data.error.message);
    }
  }

  async function deleteItem(id: string) {
    const data = await getJson<CartData>(`/api/cart/items/${id}`, {
      method: "DELETE",
    });

    if (data.ok) {
      setCart(data.data);
      window.dispatchEvent(new Event("allearbuds:cart-updated"));
    } else {
      setMessage(data.error.message);
    }
  }

  if (!cart) {
    return <CartShell title="Cart" subtitle="Loading your cart..." />;
  }

  if (cart.items.length === 0) {
    return (
      <CartShell title="Cart" subtitle="Your cart is empty.">
        <Link
          href="/products"
          className="inline-flex h-12 items-center rounded-lg bg-brand px-5 text-sm font-black text-white"
        >
          Shop products
        </Link>
      </CartShell>
    );
  }

  return (
    <CartShell title="Cart" subtitle={`${cart.itemCount} item(s) ready for checkout.`}>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-3">
          {cart.items.map((item) => (
            <article
              key={item.id}
              className="grid gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-[1fr_auto]"
            >
              <div>
                <p className="font-black text-foreground">{item.title}</p>
                <p className="mt-1 text-sm font-bold text-muted">
                  {item.variant.colorName ?? item.variant.sku}
                </p>
                <p className="mt-3 text-sm font-black text-foreground">
                  Rs. {item.variant.priceAmount.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
                  className="h-10 w-10 rounded-lg border border-border font-black"
                >
                  -
                </button>
                <span className="grid h-10 min-w-10 place-items-center rounded-lg bg-background px-3 text-sm font-black">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateItem(item.id, item.quantity + 1)}
                  className="h-10 w-10 rounded-lg border border-border font-black"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => deleteItem(item.id)}
                  className="h-10 rounded-lg border border-border px-3 text-xs font-black text-danger"
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </section>

        <aside className="h-fit rounded-lg border border-border bg-surface p-5">
          <p className="text-xs font-black uppercase text-brand">Summary</p>
          <div className="mt-4 flex justify-between text-sm font-bold">
            <span>Subtotal</span>
            <span>Rs. {cart.subtotalAmount.toLocaleString("en-IN")}</span>
          </div>
          <Link
            href="/checkout"
            className="mt-5 flex h-12 items-center justify-center rounded-lg bg-success px-5 text-sm font-black text-white"
          >
            Checkout
          </Link>
          {message ? <p className="mt-3 text-sm font-bold text-danger">{message}</p> : null}
        </aside>
      </div>
    </CartShell>
  );
}

function CartShell({
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
      <p className="text-sm font-black uppercase text-brand">Shopping cart</p>
      <h1 className="mt-2 font-display text-4xl font-black text-foreground">{title}</h1>
      <p className="mt-2 text-sm font-bold text-muted">{subtitle}</p>
      <div className="mt-8">{children}</div>
    </main>
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
