"use client";

import {
  ChevronRight,
  Menu,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import type { Brand, Category } from "@/types";
import { HeaderAccountLink } from "@/components/layout/header-account-link";
import { HeaderCartLink } from "@/components/layout/header-cart-link";
import { OptimizedImage } from "@/components/ui/optimized-image";
import type { AdminMediaReference } from "@/types/api";

type SiteHeaderProps = {
  brands: Brand[];
  categories: Category[];
  siteName?: string;
  logo?: AdminMediaReference | null;
  navLinks?: Array<{ id: string; label: string; href: string }>;
  variant?: "solid" | "overlay";
};

export function SiteHeader({
  brands,
  categories,
  siteName = "ALLEARBUDS.COM",
  logo = null,
  navLinks = [],
  variant = "solid",
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const isOverlay = variant === "overlay";

  useEffect(() => {
    if (!isOverlay) {
      return;
    }

    const updateScrollState = () => {
      setHasScrolled(window.scrollY > 8);
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => window.removeEventListener("scroll", updateScrollState);
  }, [isOverlay]);

  const iconButtonClassName = cn(
    "grid h-9 w-9 shrink-0 place-items-center rounded-md transition sm:h-10 sm:w-10",
    isOverlay && !hasScrolled
      ? "bg-transparent text-white hover:bg-white/10"
      : "bg-black/16 text-white backdrop-blur-sm hover:bg-white/14",
  );

  return (
    <>
      <header
        className={cn(
          "relative inset-x-0 top-0 z-40 px-2 py-2 sm:px-4",
          isOverlay && !hasScrolled
            ? "sticky -mb-[65px] border-b border-transparent bg-transparent text-white transition-colors duration-200"
            : cn(
                "sticky border-b border-white/10 bg-black/78 text-white shadow-lg backdrop-blur-md transition-colors duration-200",
                isOverlay ? "-mb-[65px]" : null,
              ),
        )}
      >
        <div
          className={cn(
            "mx-auto grid h-12 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2",
            "max-w-[1680px] px-1 sm:px-4",
          )}
        >
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              title="Menu"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              className={iconButtonClassName}
            >
              <Menu size={18} />
            </button>

            <button
              type="button"
              title="Filters"
              aria-label="Open filters"
              onClick={() => setFilterOpen(true)}
              className={iconButtonClassName}
            >
              <SlidersHorizontal size={17} />
            </button>
          </div>

          <Link
            href="/"
            aria-label={`${siteName} home`}
            className={cn(
              "min-w-0 justify-self-center truncate px-2 text-center font-display text-[11px] font-black uppercase tracking-normal sm:text-sm lg:text-base",
              "text-white",
            )}
          >
            {logo ? (
              <OptimizedImage
                src={logo.thumbnailUrl ?? logo.url}
                alt={logo.altText ?? `${siteName} logo`}
                width={logo.width ?? 240}
                height={logo.height ?? 80}
                sizes="140px"
                wrapperClassName="h-8 w-32 bg-transparent"
                className="h-full w-full object-contain"
              />
            ) : (
              siteName
            )}
          </Link>

          <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
            <form
              action="/products"
              className={cn(
                "hidden h-9 w-40 shrink-0 items-center gap-2 rounded-full px-3 transition md:flex lg:w-52",
                "bg-white/18 text-white backdrop-blur-sm",
              )}
            >
              <input
                name="q"
                type="search"
                placeholder="Search"
                className="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none placeholder:text-current sm:text-sm"
              />
              <button
                type="submit"
                title="Search"
                aria-label="Search products"
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full transition hover:bg-white/16"
              >
                <Search size={16} />
              </button>
            </form>

            <button
              type="button"
              title="Search"
              aria-label="Open search"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((value) => !value)}
              className={cn(iconButtonClassName, "md:hidden")}
            >
              <Search size={17} />
            </button>

            <HeaderAccountLink
              className={
                isOverlay && !hasScrolled
                  ? "bg-transparent text-white hover:bg-white/10"
                  : "bg-black/16 text-white backdrop-blur-sm hover:bg-white/14"
              }
            />

            <HeaderCartLink className={iconButtonClassName} />
          </div>
        </div>

        {searchOpen ? (
          <form
            action="/products"
            className="absolute left-3 right-3 top-[calc(100%+8px)] z-50 flex h-12 items-center gap-2 rounded-full border border-white/12 bg-black/88 px-4 text-white shadow-2xl backdrop-blur-md md:hidden"
          >
            <input
              autoFocus
              name="q"
              type="search"
              placeholder="Search earbuds, watches, brands"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-white/60"
            />
            <button
              type="submit"
              title="Search"
              aria-label="Search products"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-slate-950 transition hover:bg-accent"
            >
              <Search size={16} />
            </button>
            <button
              type="button"
              aria-label="Close search"
              onClick={() => setSearchOpen(false)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/70 transition hover:bg-white/12 hover:text-white"
            >
              <X size={16} />
            </button>
          </form>
        ) : null}
      </header>

      <MenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        categories={categories}
        brands={brands}
        siteName={siteName}
        logo={logo}
        navLinks={navLinks}
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
  siteName,
  logo,
  navLinks,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  brands: Brand[];
  siteName: string;
  logo: AdminMediaReference | null;
  navLinks: Array<{ id: string; label: string; href: string }>;
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
              {logo ? (
                <OptimizedImage
                  src={logo.thumbnailUrl ?? logo.url}
                  alt={logo.altText ?? `${siteName} logo`}
                  width={logo.width ?? 96}
                  height={logo.height ?? 96}
                  sizes="44px"
                  wrapperClassName="h-full w-full rounded-lg bg-white/12"
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                siteName.slice(0, 2).toUpperCase()
              )}
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
          {navLinks.length > 0 ? (
            <DrawerGroup title="Quick links">
              {navLinks.map((item) => (
                <DrawerLink key={item.id} href={item.href} onClose={onClose}>
                  {item.label}
                </DrawerLink>
              ))}
            </DrawerGroup>
          ) : null}

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
