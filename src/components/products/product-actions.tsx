"use client";

import { Heart, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Product } from "@/types";

type ProductActionsProps = {
  product: Product;
};

export function ProductActions({ product }: ProductActionsProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<"cart" | "buy" | "wish" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const isOutOfStock = product.availability === "out-of-stock";
  const isProductReady = Boolean(product.id);
  const canMutate = isProductReady && !isOutOfStock;

  async function addToCart({ redirectToCheckout }: { redirectToCheckout: boolean }) {
    if (!product.id) {
      setMessage("This product is not ready to buy yet.");
      return;
    }

    const action = redirectToCheckout ? "buy" : "cart";
    setPendingAction(action);
    setMessage(null);

    const response = await fetch("/api/cart/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        variantId: product.selectedVariantId ?? null,
        quantity: 1,
      }),
    });

    const payload = (await response.json().catch(() => null)) as {
      ok?: boolean;
      error?: { message?: string };
    } | null;

    setPendingAction(null);

    if (!response.ok || !payload?.ok) {
      setMessage(payload?.error?.message ?? "Please try again in a moment.");
      return;
    }

    window.dispatchEvent(new Event("allearbuds:cart-updated"));
    router.refresh();

    if (redirectToCheckout) {
      router.push("/checkout");
      return;
    }

    setMessage("Added to cart.");
  }

  async function saveToWishlist() {
    if (!product.id) {
      setMessage("This product is not ready to save yet.");
      return;
    }

    setPendingAction("wish");
    setMessage(null);

    const response = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    });
    const payload = (await response.json().catch(() => null)) as {
      ok?: boolean;
      error?: { code?: string; message?: string };
    } | null;

    setPendingAction(null);

    if (response.status === 401) {
      router.push("/account");
      return;
    }

    if (!response.ok || !payload?.ok) {
      setMessage(payload?.error?.message ?? "Please try again in a moment.");
      return;
    }

    setMessage("Saved to wishlist.");
  }

  return (
    <div className="mt-7 overflow-hidden rounded-lg border border-border bg-surface">
      <div className="bg-success px-4 py-1 text-center text-xs font-black text-white">
        Personalise your product
      </div>
      <div className="grid gap-3 p-3 sm:grid-cols-[1fr_1fr_auto]">
        <button
          type="button"
          disabled={!canMutate || pendingAction !== null}
          onClick={() => addToCart({ redirectToCheckout: false })}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-surface-strong disabled:text-muted"
        >
          <ShoppingCart size={17} />
          {!isProductReady
            ? "Preparing"
            : isOutOfStock
            ? "Out Of Stock"
            : pendingAction === "cart"
              ? "Adding..."
              : "Add To Cart"}
        </button>
        <button
          type="button"
          disabled={!canMutate || pendingAction !== null}
          onClick={() => addToCart({ redirectToCheckout: true })}
          className="h-12 rounded-lg bg-success px-5 text-sm font-black text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-surface-strong disabled:text-muted"
        >
          {!isProductReady
            ? "Preparing"
            : pendingAction === "buy"
              ? "Opening..."
              : "Buy Now"}
        </button>
        <button
          type="button"
          disabled={!product.id || pendingAction !== null}
          onClick={saveToWishlist}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-black text-foreground transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:text-muted"
        >
          <Heart size={17} />
          <span className="sm:hidden lg:inline">
            {pendingAction === "wish" ? "Saving..." : "Save"}
          </span>
        </button>
      </div>
      {message ? (
        <p className="border-t border-border px-4 py-3 text-sm font-bold text-muted">
          {message}
        </p>
      ) : !isProductReady ? (
        <p className="border-t border-border px-4 py-3 text-sm font-bold text-muted">
          This product will be ready for checkout after it is published in the catalog.
        </p>
      ) : null}
    </div>
  );
}
