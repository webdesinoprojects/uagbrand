import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <p className="text-sm font-black uppercase text-brand">Checkout</p>
      <h1 className="mt-2 font-display text-4xl font-black">Order placed</h1>
      <p className="mt-3 text-sm font-bold text-muted">
        Your order has been created. You can review it from your account orders.
      </p>
      <Link
        href="/account/orders"
        className="mt-6 inline-flex h-12 items-center rounded-lg bg-brand px-5 text-sm font-black text-white"
      >
        View orders
      </Link>
    </main>
  );
}
