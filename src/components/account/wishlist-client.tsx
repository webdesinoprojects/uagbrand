"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { WishlistData } from "@/types/api";

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string } };

export function WishlistClient() {
  const [wishlist, setWishlist] = useState<WishlistData | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function fetchWishlist() {
    const data = await getJson<WishlistData>("/api/wishlist");
    return data.ok ? data.data : { items: [] };
  }

  useEffect(() => {
    let cancelled = false;

    async function loadWishlist() {
      const data = await fetchWishlist();
      if (!cancelled) {
        setWishlist(data);
      }
    }

    loadWishlist();

    return () => {
      cancelled = true;
    };
  }, []);

  async function removeItem(id: string) {
    const data = await getJson<{ id: string; deleted: true }>(`/api/wishlist/${id}`, {
      method: "DELETE",
    });

    if (data.ok) {
      setWishlist(await fetchWishlist());
    } else {
      setMessage(data.error.message);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm font-black uppercase text-brand">Account</p>
      <h1 className="mt-2 font-display text-4xl font-black text-foreground">
        Wishlist
      </h1>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {wishlist?.items.map((item) => (
          <article key={item.id} className="rounded-lg border border-border bg-surface p-4">
            <p className="font-black text-foreground">{item.title}</p>
            <p className="mt-2 text-sm font-bold text-muted">
              {item.priceAmount ? `Rs. ${item.priceAmount.toLocaleString("en-IN")}` : "Price unavailable"}
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href={`/products/${item.slug}`}
                className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-xs font-black text-white"
              >
                View
              </Link>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="h-10 rounded-lg border border-border px-4 text-xs font-black text-danger"
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
      {wishlist && wishlist.items.length === 0 ? (
        <p className="mt-8 text-sm font-bold text-muted">No wishlist items yet.</p>
      ) : null}
      {message ? <p className="mt-4 text-sm font-bold text-danger">{message}</p> : null}
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
