"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { CustomerOrderDetailData } from "@/types/api";

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string } };

export function OrderDetailClient({ id }: { id: string }) {
  const [order, setOrder] = useState<CustomerOrderDetailData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      const data = await getJson<CustomerOrderDetailData>(`/api/orders/${id}`);
      if (!cancelled) {
        setOrder(data.ok ? data.data : null);
      }
    }

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!order) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl font-black">Order</h1>
        <p className="mt-2 text-sm font-bold text-muted">Loading order...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/account/orders" className="text-sm font-black text-brand">
        Back to orders
      </Link>
      <h1 className="mt-3 font-display text-4xl font-black text-foreground">
        {order.orderNumber}
      </h1>
      <p className="mt-2 text-sm font-bold text-muted">
        {order.status} / {formatPaymentMethod(order.paymentMethod)} payment{" "}
        {order.paymentStatus}
      </p>
      <section className="mt-8 rounded-lg border border-border bg-surface p-5">
        <p className="text-xs font-black uppercase text-brand">Items</p>
        <div className="mt-4 grid gap-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3 text-sm font-bold">
              <span>
                {item.title} x {item.quantity}
              </span>
              <span>Rs. {item.totalAmount.toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-border pt-4 text-base font-black">
          Total: Rs. {order.totalAmount.toLocaleString("en-IN")}
        </div>
      </section>
    </main>
  );
}

function formatPaymentMethod(method: string) {
  return method === "cod" ? "COD" : method;
}

async function getJson<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url, { cache: "no-store" });
  return (await response.json().catch(() => ({
    ok: false,
    error: { message: "Something went wrong." },
  }))) as ApiResponse<T>;
}
