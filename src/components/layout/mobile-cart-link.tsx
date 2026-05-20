"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type CartResponse = {
  ok: boolean;
  data?: {
    itemCount: number;
  };
};

export function MobileCartLink() {
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadCart() {
      const response = await fetch("/api/cart", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as CartResponse | null;

      if (!cancelled && response.ok && payload?.ok) {
        setItemCount(payload.data?.itemCount ?? 0);
      }
    }

    loadCart();
    window.addEventListener("allearbuds:cart-updated", loadCart);

    return () => {
      cancelled = true;
      window.removeEventListener("allearbuds:cart-updated", loadCart);
    };
  }, []);

  return (
    <Link
      href="/cart"
      className="relative flex h-[52px] flex-col items-center justify-center gap-1 rounded-lg text-xs font-bold text-muted transition hover:bg-surface-soft hover:text-brand"
    >
      <ShoppingCart size={19} />
      <span>Cart</span>
      {itemCount > 0 ? (
        <span className="absolute right-5 top-1 grid h-5 min-w-5 place-items-center rounded-md bg-accent px-1 text-[10px] font-black text-slate-950">
          {Math.min(itemCount, 99)}
        </span>
      ) : null}
    </Link>
  );
}
