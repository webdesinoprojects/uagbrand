import Link from "next/link";

export default function CheckoutFailedPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <p className="text-sm font-black uppercase text-brand">Checkout</p>
      <h1 className="mt-2 font-display text-4xl font-black">Checkout failed</h1>
      <p className="mt-3 text-sm font-bold text-muted">
        Please review your cart and try again.
      </p>
      <Link
        href="/cart"
        className="mt-6 inline-flex h-12 items-center rounded-lg bg-brand px-5 text-sm font-black text-white"
      >
        Back to cart
      </Link>
    </main>
  );
}
