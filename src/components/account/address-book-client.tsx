"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import type { CustomerAddressData } from "@/types/api";

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string } };

const addressInputs = [
  { name: "label", placeholder: "Label (Home, Work)", required: false },
  { name: "fullName", placeholder: "Full name", required: true },
  {
    name: "phone",
    placeholder: "10-digit mobile number",
    required: true,
    inputMode: "numeric",
    maxLength: 10,
  },
  { name: "line1", placeholder: "Address line 1", required: true },
  { name: "city", placeholder: "City", required: true },
  { name: "state", placeholder: "State", required: true },
  {
    name: "pincode",
    placeholder: "6-digit PIN code",
    required: true,
    inputMode: "numeric",
    maxLength: 6,
  },
] as const;

export function AddressBookClient() {
  const [addresses, setAddresses] = useState<CustomerAddressData[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function fetchAddresses() {
    const data = await getJson<{ items: CustomerAddressData[] }>("/api/account/addresses");
    return data.ok ? data.data.items : [];
  }

  useEffect(() => {
    let cancelled = false;

    async function loadAddresses() {
      const items = await fetchAddresses();
      if (!cancelled) {
        setAddresses(items);
      }
    }

    loadAddresses();

    return () => {
      cancelled = true;
    };
  }, []);

  async function addAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const data = await getJson<CustomerAddressData>("/api/account/addresses", {
      method: "POST",
      body: JSON.stringify({
        label: formData.get("label"),
        fullName: formData.get("fullName"),
        phone: formData.get("phone"),
        line1: formData.get("line1"),
        city: formData.get("city"),
        state: formData.get("state"),
        pincode: formData.get("pincode"),
      }),
    });

    if (data.ok) {
      setAddresses(await fetchAddresses());
      form.reset();
      setMessage("Address saved.");
    } else {
      setMessage(data.error.message);
    }
  }

  async function setDefaultAddress(
    id: string,
    field: "isDefaultShipping" | "isDefaultBilling",
  ) {
    setMessage(null);
    const data = await getJson<CustomerAddressData>(`/api/account/addresses/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ [field]: true }),
    });

    if (data.ok) {
      setAddresses(await fetchAddresses());
      setMessage(
        field === "isDefaultShipping"
          ? "Default shipping address updated."
          : "Default billing address updated.",
      );
    } else {
      setMessage(data.error.message);
    }
  }

  async function deleteAddress(id: string) {
    setMessage(null);
    const data = await getJson<{ id: string; deleted: true }>(
      `/api/account/addresses/${id}`,
      { method: "DELETE" },
    );

    if (data.ok) {
      setAddresses(await fetchAddresses());
      setMessage("Address deleted.");
    } else {
      setMessage(data.error.message);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm font-black uppercase text-brand">Account</p>
      <h1 className="mt-2 font-display text-4xl font-black text-foreground">
        Addresses
      </h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_420px]">
        <section className="grid gap-3">
          {addresses.map((address) => (
            <article key={address.id} className="rounded-lg border border-border bg-surface p-4">
              <p className="font-black text-foreground">{address.fullName}</p>
              <p className="mt-1 text-sm font-bold leading-6 text-muted">
                {address.line1}, {address.city}, {address.state} - {address.pincode}
              </p>
              <div className="mt-3 flex gap-2 text-xs font-black text-brand">
                {address.isDefaultShipping ? <span>Default shipping</span> : null}
                {address.isDefaultBilling ? <span>Default billing</span> : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={address.isDefaultShipping}
                  onClick={() => setDefaultAddress(address.id, "isDefaultShipping")}
                  className="h-9 rounded-lg border border-border px-3 text-xs font-black text-foreground transition hover:border-brand disabled:cursor-not-allowed disabled:text-muted"
                >
                  Set shipping
                </button>
                <button
                  type="button"
                  disabled={address.isDefaultBilling}
                  onClick={() => setDefaultAddress(address.id, "isDefaultBilling")}
                  className="h-9 rounded-lg border border-border px-3 text-xs font-black text-foreground transition hover:border-brand disabled:cursor-not-allowed disabled:text-muted"
                >
                  Set billing
                </button>
                <button
                  type="button"
                  onClick={() => deleteAddress(address.id)}
                  className="h-9 rounded-lg border border-border px-3 text-xs font-black text-danger"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
          {addresses.length === 0 ? (
            <p className="text-sm font-bold text-muted">No addresses saved yet.</p>
          ) : null}
        </section>
        <form onSubmit={addAddress} className="grid h-fit gap-3 rounded-lg border border-border bg-surface p-5">
          <p className="text-xs font-black uppercase text-brand">Add address</p>
          {addressInputs.map((input) => (
            <input
              key={input.name}
              name={input.name}
              required={input.required}
              placeholder={input.placeholder}
              inputMode={"inputMode" in input ? input.inputMode : undefined}
              maxLength={"maxLength" in input ? input.maxLength : undefined}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-bold outline-none focus:border-brand"
            />
          ))}
          <button className="h-11 rounded-lg bg-brand px-5 text-sm font-black text-white">
            Save address
          </button>
          {message ? <p className="text-sm font-bold text-muted">{message}</p> : null}
        </form>
      </div>
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
