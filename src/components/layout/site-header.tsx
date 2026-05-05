"use client";

import {
  ChevronRight,
  Menu,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { Brand, Category } from "@/types";

type SiteHeaderProps = {
  brands: Brand[];
  categories: Category[];
};

export function SiteHeader({ brands, categories }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/88 px-3 py-3 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 shadow-[var(--shadow-soft)] sm:gap-3 sm:px-4 md:justify-start">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground transition hover:border-foreground hover:shadow-md"
          >
            <Menu size={20} />
          </button>

          <Link
            href="/"
            className="flex min-w-0 shrink-0 items-center gap-2 text-foreground"
          >
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand text-sm font-black text-white shadow-sm">
              AE
            </span>
            <span className="hidden font-display text-lg font-black tracking-tight sm:block">
              allearbuds
            </span>
          </Link>

          <form
            action="/products"
            className="mx-auto hidden h-11 max-w-2xl flex-1 items-center gap-2 rounded-full border border-border bg-background px-4 shadow-inner md:flex"
          >
            <Search size={18} className="text-muted" />
            <input
              name="q"
              type="search"
              placeholder="Search earbuds, watches, brands"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-muted"
            />
          </form>

          <button
            type="button"
            aria-label="Open filters"
            onClick={() => setFilterOpen(true)}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground transition hover:border-foreground hover:shadow-md"
          >
            <SlidersHorizontal size={18} />
          </button>

          <ThemeToggle />

          <Link
            href="/products"
            aria-label="Search products"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground transition hover:border-foreground hover:shadow-md md:hidden"
          >
            <Search size={18} />
          </Link>

          <Link
            href="/account"
            aria-label="Account"
            className="hidden h-11 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-extrabold text-foreground transition hover:border-foreground hover:shadow-md lg:flex"
          >
            <UserRound size={17} />
            Account
          </Link>

          <Link
            href="/cart"
            aria-label="Cart"
            className="relative grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground transition hover:border-foreground hover:shadow-md"
          >
            <ShoppingCart size={18} />
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-md bg-accent px-1 text-[11px] font-black text-slate-950">
              0
            </span>
          </Link>
        </div>
      </header>

      <MenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        categories={categories}
        brands={brands}
      />
      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        categories={categories}
        brands={brands}
      />
    </>
  );
}

function MenuDrawer({
  open,
  onClose,
  categories,
  brands,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  brands: Brand[];
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/52">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
      />
      <aside className="absolute left-0 top-0 flex h-full w-[min(390px,92vw)] flex-col border-r border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand text-sm font-black text-white">
              AE
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase text-brand">
                Quick menu
              </p>
              <h2 className="font-display text-xl font-black">Menu</h2>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-lg border border-border bg-surface transition hover:border-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 no-scrollbar">
          <DrawerGroup title="Shop by category">
            {categories.map((category) => (
              <DrawerLink
                key={category.slug}
                href={category.href}
                onClose={onClose}
              >
                {category.shortName}
              </DrawerLink>
            ))}
          </DrawerGroup>

          <DrawerGroup title="Shop by brand">
            {brands.map((brand) => (
              <DrawerLink key={brand.slug} href={brand.href} onClose={onClose}>
                {brand.name}
              </DrawerLink>
            ))}
          </DrawerGroup>
        </div>
      </aside>
    </div>
  );
}

function FilterDrawer({
  open,
  onClose,
  categories,
  brands,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  brands: Brand[];
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/52">
      <button
        type="button"
        aria-label="Close filters"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 flex h-full w-[min(420px,92vw)] flex-col border-l border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-xs font-extrabold uppercase text-brand">
              Product filter
            </p>
            <h2 className="font-display text-xl font-black">Find products</h2>
          </div>
          <button
            type="button"
            aria-label="Close filters"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-lg border border-border bg-surface transition hover:border-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <form action="/products" className="grid gap-4 p-5">
          <FilterSelect name="price" label="Price range" defaultValue="0-4999">
            <option value="0-4999">Rs. 0 - Rs. 4,999</option>
            <option value="0-999">Under Rs. 999</option>
            <option value="1000-1999">Rs. 1,000 - Rs. 1,999</option>
            <option value="2000-4999">Rs. 2,000 - Rs. 4,999</option>
          </FilterSelect>

          <FilterSelect name="category" label="Category" defaultValue="">
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect name="brand" label="Brand" defaultValue="">
            <option value="">All brands</option>
            {brands.map((brand) => (
              <option key={brand.slug} value={brand.slug}>
                {brand.name}
              </option>
            ))}
          </FilterSelect>

          <button
            type="submit"
            className="mt-2 h-12 rounded-lg bg-brand px-5 text-sm font-black text-white shadow-md transition hover:bg-brand-strong hover:shadow-lg"
          >
            Apply filters
          </button>
        </form>
      </aside>
    </div>
  );
}

function DrawerGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-7">
      <h3 className="mb-3 text-xs font-black uppercase text-muted">{title}</h3>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}

function DrawerLink({
  href,
  children,
  onClose,
}: {
  href: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-sm font-extrabold text-foreground transition hover:border-brand hover:text-brand hover:shadow-md"
    >
      {children}
      <ChevronRight size={17} className="text-muted" />
    </Link>
  );
}

function FilterSelect({
  name,
  label,
  defaultValue,
  children,
}: {
  name: string;
  label: string;
  defaultValue: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-xs font-black uppercase text-muted">
      {label}
      <select
        name={name}
        className="h-12 rounded-lg border border-border bg-surface px-3 text-sm font-bold text-foreground outline-none transition focus:border-brand"
        defaultValue={defaultValue}
      >
        {children}
      </select>
    </label>
  );
}
