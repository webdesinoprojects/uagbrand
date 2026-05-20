import {
  BadgePercent,
  Boxes,
  FileText,
  Image,
  Inbox,
  Package,
  ShoppingBag,
  Star,
  Users,
} from "lucide-react";

import type { AdminDashboardData } from "@/types/api";

type AdminDashboardProps = {
  data: AdminDashboardData;
};

const numberFormat = new Intl.NumberFormat("en-IN");

export function AdminDashboard({ data }: AdminDashboardProps) {
  const metrics = [
    {
      label: "Products",
      value: data.catalog.products.total,
      detail: `${data.catalog.products.published} published / ${data.catalog.products.draft} draft`,
      icon: Package,
    },
    {
      label: "Brands",
      value: data.catalog.brands,
      detail: `${data.catalog.categories} categories`,
      icon: Boxes,
    },
    {
      label: "Offers",
      value: data.catalog.offers.total,
      detail: `${data.catalog.offers.published} published`,
      icon: BadgePercent,
    },
    {
      label: "Media",
      value: data.catalog.media,
      detail: "ImageKit metadata records",
      icon: Image,
    },
  ];

  const queues = [
    {
      label: "Contact messages",
      value: data.customer.contactMessages.newCount,
      detail: `${data.customer.contactMessages.total} total`,
      icon: Inbox,
    },
    {
      label: "Reviews pending",
      value: data.customer.reviews.pendingModeration,
      detail: `${data.customer.reviews.total} reviews`,
      icon: Star,
    },
    {
      label: "Support open",
      value: data.customer.supportTickets.openCount,
      detail: `${data.customer.supportTickets.total} tickets`,
      icon: Users,
    },
    {
      label: "Newsletter",
      value: data.customer.newsletter.total,
      detail: `${data.customer.newsletter.confirmed} confirmed`,
      icon: FileText,
    },
  ];

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-brand">Dashboard</p>
          <h1 className="mt-2 font-display text-3xl font-black text-foreground">
            Operations overview
          </h1>
          <p className="mt-2 text-sm font-bold text-muted">
            Catalog, CMS and customer queues from the live backend.
          </p>
        </div>
        <p className="text-xs font-bold text-muted">
          Updated {new Date(data.generatedAt).toLocaleString("en-IN")}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-lg border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-brand">Content</p>
              <h2 className="mt-1 text-xl font-black text-foreground">
                CMS coverage
              </h2>
            </div>
            <ShoppingBag className="text-brand" size={22} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MiniStat label="Pages" value={data.content.pages} />
            <MiniStat label="Navigation items" value={data.content.navigationItems} />
            <MiniStat label="Footer columns" value={data.content.footerColumns} />
            <MiniStat label="Hero slides" value={data.content.heroSlides} />
            <MiniStat label="Collections" value={data.content.homeCollections} />
            <MiniStat label="Brand collabs" value={data.content.brandCollabs} />
            <MiniStat label="Warehouse slides" value={data.content.warehouseSlides} />
            <MiniStat label="Trust cards" value={data.content.trustCards} />
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface p-5">
          <div>
            <p className="text-xs font-black uppercase text-brand">Queues</p>
            <h2 className="mt-1 text-xl font-black text-foreground">
              Needs attention
            </h2>
          </div>
          <div className="mt-5 grid gap-3">
            {queues.map((queue) => (
              <QueueRow key={queue.label} {...queue} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number;
  detail: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <article className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-muted">{label}</p>
          <p className="mt-3 text-3xl font-black text-foreground">
            {numberFormat.format(value)}
          </p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand/10 text-brand">
          <Icon size={21} />
        </span>
      </div>
      <p className="mt-4 text-sm font-bold text-muted">{detail}</p>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-xs font-black uppercase text-muted">{label}</p>
      <p className="mt-2 text-2xl font-black text-foreground">
        {numberFormat.format(value)}
      </p>
    </div>
  );
}

function QueueRow({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number;
  detail: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-surface-strong text-brand">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-foreground">{label}</span>
        <span className="mt-1 block text-xs font-bold text-muted">{detail}</span>
      </span>
      <span className="text-2xl font-black text-foreground">
        {numberFormat.format(value)}
      </span>
    </div>
  );
}
