"use client";

import {
  BadgePercent,
  BarChart3,
  Boxes,
  FileText,
  Headphones,
  Home,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  ReceiptText,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import type { AdminSessionRole } from "@/types/api";

type AdminShellProps = {
  actor: {
    email: string;
    role: AdminSessionRole;
  };
  children: React.ReactNode;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles: AdminSessionRole[];
};

const allStaff: AdminSessionRole[] = ["admin", "editor", "support"];
const catalogRoles: AdminSessionRole[] = ["admin", "editor"];
const supportRoles: AdminSessionRole[] = ["admin", "support"];

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Dashboard",
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard, roles: allStaff },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: Package, roles: catalogRoles },
      { label: "Brands", href: "/admin/brands", icon: Star, roles: catalogRoles },
      { label: "Categories", href: "/admin/categories", icon: Boxes, roles: catalogRoles },
      { label: "Inventory", href: "/admin/inventory", icon: ShoppingBag, roles: catalogRoles },
      { label: "Offers", href: "/admin/offers", icon: BadgePercent, roles: catalogRoles },
      { label: "Media", href: "/admin/media", icon: Image, roles: catalogRoles },
    ],
  },
  {
    label: "Homepage CMS",
    items: [
      { label: "Hero", href: "/admin/home/hero", icon: Home, roles: catalogRoles },
      { label: "Top Deals", href: "/admin/home/top-deals", icon: BadgePercent, roles: catalogRoles },
      { label: "Warehouse", href: "/admin/home/warehouse", icon: Boxes, roles: catalogRoles },
      { label: "Collabs", href: "/admin/home/collabs", icon: Headphones, roles: catalogRoles },
      { label: "Trust", href: "/admin/home/trust", icon: Star, roles: catalogRoles },
    ],
  },
  {
    label: "Orders",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ReceiptText, roles: supportRoles },
      { label: "Payments", href: "/admin/payments", icon: ShoppingBag, roles: supportRoles },
      { label: "Returns", href: "/admin/returns", icon: Package, roles: supportRoles },
    ],
  },
  {
    label: "Customers",
    items: [
      { label: "Customers", href: "/admin/customers", icon: Users, roles: supportRoles },
      { label: "Reviews", href: "/admin/reviews", icon: Star, roles: supportRoles },
      { label: "Support", href: "/admin/support", icon: MessageSquare, roles: supportRoles },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Pages", href: "/admin/pages", icon: FileText, roles: catalogRoles },
      { label: "Navigation", href: "/admin/navigation", icon: Menu, roles: catalogRoles },
      { label: "Footer", href: "/admin/footer", icon: FileText, roles: catalogRoles },
    ],
  },
  {
    label: "Reports & Settings",
    items: [
      { label: "Reports", href: "/admin/reports/sales", icon: BarChart3, roles: ["admin"] },
      { label: "Settings", href: "/admin/settings/store", icon: Settings, roles: ["admin"] },
    ],
  },
];

export function AdminShell({ actor, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleGroups = useMemo(
    () =>
      navGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => item.roles.includes(actor.role)),
        }))
        .filter((group) => group.items.length > 0),
    [actor.role],
  );

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" }).catch(() => null);
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-surface-soft text-foreground">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[278px] flex-col border-r border-border bg-surface transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Link href="/admin" className="font-display text-xl font-black">
            AllEarbuds
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border lg:hidden"
            aria-label="Close admin navigation"
          >
            <X size={17} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          {visibleGroups.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="px-2 text-[11px] font-black uppercase tracking-wide text-muted">
                {group.label}
              </p>
              <div className="mt-2 grid gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-black transition",
                        active
                          ? "bg-slate-950 text-white"
                          : "text-muted hover:bg-surface-strong hover:text-foreground",
                      )}
                    >
                      <Icon size={17} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close admin navigation"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="lg:pl-[278px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur lg:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-border lg:hidden"
            aria-label="Open admin navigation"
          >
            <Menu size={18} />
          </button>
          <div className="hidden h-10 min-w-0 max-w-md flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 md:flex">
            <Search size={17} className="text-muted" />
            <input
              placeholder="Search admin"
              className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
            />
          </div>
          <div className="ml-auto flex min-w-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="truncate text-sm font-black">{actor.email}</p>
              <p className="text-xs font-bold uppercase text-muted">{actor.role}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs font-black text-danger transition hover:bg-surface-strong"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 lg:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
