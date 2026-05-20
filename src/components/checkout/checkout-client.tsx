"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type {
  CartData,
  CustomerAddressData,
  CustomerOrderDetailData,
} from "@/types/api";

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string } };

export function CheckoutClient() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddressData[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [order, setOrder] = useState<CustomerOrderDetailData | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCheckout() {
      const [cartData, addressData] = await Promise.all([
        getJson<CartData>("/api/cart"),
        getJson<{ items: CustomerAddressData[] }>("/api/account/addresses"),
      ]);

      if (cancelled) {
        return;
      }

      setCart(cartData.ok ? cartData.data : null);

      if (addressData.ok) {
        setAddresses(addressData.data.items);
        setSelectedAddressId(
          addressData.data.items.find((item) => item.isDefaultShipping)?.id ??
            addressData.data.items[0]?.id ??
            "",
        );
      }
    }

    loadCheckout();

    return () => {
      cancelled = true;
    };
  }, []);

  async function placeOrder() {
    if (!selectedAddressId) {
      setMessage("Add a delivery address before checkout.");
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const data = await getJson<CustomerOrderDetailData>("/api/checkout", {
      method: "POST",
      body: JSON.stringify({
        shippingAddressId: selectedAddressId,
        paymentMethod: "cod",
      }),
    });

    setSubmitting(false);

    if (!data.ok) {
      setMessage(data.error.message);
      return;
    }

    setOrder(data.data);
    window.dispatchEvent(new Event("allearbuds:cart-updated"));
  }

  if (order) {
    return (
      <CheckoutShell title="Order placed" subtitle={order.orderNumber}>
        <div className="rounded-lg border border-success bg-success/10 p-5">
          <p className="text-lg font-black text-foreground">
            Your COD order has been created.
          </p>
          <p className="mt-2 text-sm font-bold text-muted">
            Total: Rs. {order.totalAmount.toLocaleString("en-IN")} / Payment on delivery
          </p>
          <Link
            href={`/account/orders/${order.id}`}
            className="mt-5 inline-flex h-11 items-center rounded-lg bg-success px-5 text-sm font-black text-white"
          >
            View order
          </Link>
        </div>
      </CheckoutShell>
    );
  }

  if (!cart) {
    return <CheckoutShell title="Checkout" subtitle="Loading checkout..." />;
  }

  if (!cart.authenticated) {
    return (
      <CheckoutShell title="Checkout" subtitle="Please sign in before checkout.">
        <Link
          href="/account"
          className="inline-flex h-12 items-center rounded-lg bg-brand px-5 text-sm font-black text-white"
        >
          Login / Register
        </Link>
      </CheckoutShell>
    );
  }

  if (cart.items.length === 0) {
    return (
      <CheckoutShell title="Checkout" subtitle="Your cart is empty.">
        <Link
          href="/products"
          className="inline-flex h-12 items-center rounded-lg bg-brand px-5 text-sm font-black text-white"
        >
          Shop products
        </Link>
      </CheckoutShell>
    );
  }

  return (
    <CheckoutShell title="Checkout" subtitle="Cash on delivery / manual payment">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-border bg-surface p-5">
          <p className="text-xs font-black uppercase text-brand">Delivery address</p>
          <div className="mt-4 grid gap-3">
            {addresses.map((address) => (
              <label
                key={address.id}
                className="flex cursor-pointer gap-3 rounded-lg border border-border bg-background p-4"
              >
                <input
                  type="radio"
                  name="address"
                  value={address.id}
                  checked={selectedAddressId === address.id}
                  onChange={() => setSelectedAddressId(address.id)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-black text-foreground">
                    {address.fullName}
                  </span>
                  <span className="mt-1 block text-sm font-bold leading-6 text-muted">
                    {address.line1}, {address.city}, {address.state} -{" "}
                    {address.pincode}
                  </span>
                  <span className="mt-1 block text-xs font-black text-muted">
                    Mobile: {address.phone}
                  </span>
                </span>
              </label>
            ))}
            {addresses.length === 0 ? (
              <Link
                href="/account/addresses"
                className="inline-flex h-11 w-fit items-center rounded-lg bg-brand px-5 text-sm font-black text-white"
              >
                Add address
              </Link>
            ) : null}
          </div>
        </section>

        <aside className="h-fit rounded-lg border border-border bg-surface p-5">
          <p className="text-xs font-black uppercase text-brand">Order summary</p>
          <div className="mt-4 grid gap-3 text-sm font-bold">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3">
                <span>
                  {item.title} x {item.quantity}
                </span>
                <span>Rs. {item.lineTotalAmount.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex justify-between text-base font-black">
              <span>Total</span>
              <span>Rs. {cart.subtotalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <button
            type="button"
            disabled={submitting || !selectedAddressId}
            onClick={placeOrder}
            className="mt-5 h-12 w-full rounded-lg bg-success px-5 text-sm font-black text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-surface-strong disabled:text-muted"
          >
            {submitting ? "Placing order..." : "Place COD order"}
          </button>
          <p className="mt-3 text-xs font-bold leading-5 text-muted">
            Pay by cash or approved manual collection when the order is delivered.
          </p>
          {message ? <p className="mt-3 text-sm font-bold text-danger">{message}</p> : null}
        </aside>
      </div>
    </CheckoutShell>
  );
}

function CheckoutShell({
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
      <p className="text-sm font-black uppercase text-brand">Checkout</p>
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
