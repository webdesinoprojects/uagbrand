"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type HeaderCartLinkProps = {
  className?: string;
};

type CartResponse = {
  ok: boolean;
  data?: {
    itemCount: number;
  };
};

export function HeaderCartLink({ className }: HeaderCartLinkProps) {
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
      title="Cart"
      aria-label="Cart"
      className={cn("relative", className)}
    >
      <ShoppingCart size={17} />
      <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-md bg-accent px-1 text-[11px] font-black text-slate-950">
        {Math.min(itemCount, 99)}
      </span>
    </Link>
  );
}
