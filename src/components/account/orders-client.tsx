"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { CustomerOrderListData } from "@/types/api";

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string } };

export function OrdersClient() {
  const [orders, setOrders] = useState<CustomerOrderListData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      const data = await getJson<CustomerOrderListData>("/api/orders");
      if (!cancelled) {
        setOrders(
          data.ok
            ? data.data
            : {
                items: [],
                pagination: { page: 1, pageSize: 24, total: 0, pageCount: 0 },
              },
        );
      }
    }

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm font-black uppercase text-brand">Account</p>
      <h1 className="mt-2 font-display text-4xl font-black text-foreground">
        Orders
      </h1>
      <div className="mt-8 grid gap-3">
        {orders?.items.map((order) => (
          <Link
            key={order.id}
            href={`/account/orders/${order.id}`}
            className="flex items-center justify-between rounded-lg border border-border bg-surface p-4 text-sm font-bold transition hover:border-brand"
          >
              <span>
                <span className="block font-black text-foreground">{order.orderNumber}</span>
              <span className="mt-1 block text-muted">
                {order.status} / {formatPaymentMethod(order.paymentMethod)}
              </span>
              </span>
            <span>Rs. {order.totalAmount.toLocaleString("en-IN")}</span>
          </Link>
        ))}
      </div>
      {orders && orders.items.length === 0 ? (
        <p className="mt-8 text-sm font-bold text-muted">No orders yet.</p>
      ) : null}
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
