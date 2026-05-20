"use client";

import {
  ChevronRight,
  Home,
  Menu,
  PackageSearch,
  Store,
  Tags,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

import type { Brand, Category } from "@/types";
import { MobileCartLink } from "@/components/layout/mobile-cart-link";

type MobileBottomNavProps = {
  brands: Brand[];
  categories: Category[];
};

export function MobileBottomNav({ brands, categories }: MobileBottomNavProps) {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [panel, setPanel] = useState<"categories" | "brands">("categories");

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-50 bg-black/45 lg:hidden">
          <button
            type="button"
            aria-label="Close menu backdrop"
            className="absolute inset-0 h-full w-full"
            onClick={() => setOpen(false)}
          />
          <section className="absolute left-0 top-0 flex h-full w-[min(390px,92vw)] flex-col border-r border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-xs font-bold uppercase text-brand">
                  Quick menu
                </p>
                <h2 className="text-lg font-black text-foreground">Menu</h2>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-surface"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 border-b border-border p-3">
              <button
                type="button"
                onClick={() => setPanel("categories")}
                className={`flex h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-bold ${
                  panel === "categories"
                    ? "border-brand bg-brand text-white"
                    : "border-border bg-surface text-foreground"
                }`}
              >
                <Tags size={17} />
                Shop by category
              </button>
              <button
                type="button"
                onClick={() => setPanel("brands")}
                className={`flex h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-bold ${
                  panel === "brands"
                    ? "border-brand bg-brand text-white"
                    : "border-border bg-surface text-foreground"
                }`}
              >
                <Store size={17} />
                Shop by brand
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 no-scrollbar">
              <div className="grid gap-2">
                {(panel === "categories" ? categories : brands).map((item) => (
                  <Link
                    key={item.slug}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-3 text-sm font-bold text-foreground transition hover:border-brand hover:text-brand"
                  >
                    {"shortName" in item ? item.shortName : item.name}
                    <ChevronRight size={17} className="text-muted" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {accountOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close account quick links"
            className="absolute inset-0 h-full w-full"
            onClick={() => setAccountOpen(false)}
          />
          <section className="absolute bottom-[76px] left-1/2 w-[min(360px,calc(100vw-24px))] -translate-x-1/2 rounded-xl border border-border bg-surface p-2 shadow-2xl">
            <AccountQuickLink
              href="/account"
              icon={<UserRound size={18} />}
              label="My account"
              onClick={() => setAccountOpen(false)}
            />
            <AccountQuickLink
              href="/track-order"
              icon={<PackageSearch size={18} />}
              label="Track my order"
              onClick={() => setAccountOpen(false)}
            />
          </section>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/96 px-2 py-1.5 shadow-2xl backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          <MobileNavLink href="/" icon={<Home size={19} />} label="Home" />
          <MobileCartLink />
          <button
            type="button"
            aria-expanded={accountOpen}
            aria-label="Open account quick links"
            onClick={() => {
              setOpen(false);
              setAccountOpen((value) => !value);
            }}
            className="flex h-[52px] flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-bold leading-none text-muted transition hover:bg-surface-soft hover:text-brand"
          >
            <UserRound size={19} />
            <span>My account</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAccountOpen(false);
              setOpen(true);
            }}
            className="flex h-[52px] flex-col items-center justify-center gap-1 rounded-lg text-xs font-bold text-muted transition hover:bg-surface-soft hover:text-brand"
          >
            <Menu size={19} />
            Menu
          </button>
        </div>
      </nav>
    </>
  );
}

function AccountQuickLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-black text-foreground transition hover:bg-surface-soft hover:text-brand"
    >
      <span className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-background">
          {icon}
        </span>
        {label}
      </span>
      <ChevronRight size={17} className="text-muted" />
    </Link>
  );
}

function MobileNavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex h-[52px] flex-col items-center justify-center gap-1 rounded-lg text-xs font-bold text-muted transition hover:bg-surface-soft hover:text-brand"
    >
      {icon}
      {label}
    </Link>
  );
}
