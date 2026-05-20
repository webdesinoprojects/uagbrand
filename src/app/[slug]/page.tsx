import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  BookOpen,
  Box,
  Building2,
  Clock3,
  CreditCard,
  FileText,
  Headphones,
  LockKeyhole,
  Mail,
  MapPin,
  PackageCheck,
  PackageSearch,
  Phone,
  RefreshCcw,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeaderWithSettings } from "@/components/layout/site-header-with-settings";
import {
  staticPages,
  type StaticPageCard,
  type StaticPageContent,
  type StaticPageIcon,
  type StaticPageSection,
} from "@/lib/static-pages";
import { getHomePageDTO } from "@/server/public/home-dal";
import { getPublicStaticPage } from "@/server/public/pages-dal";

const iconMap = {
  badge: BadgeCheck,
  book: BookOpen,
  box: Box,
  building: Building2,
  cart: ShoppingCart,
  card: CreditCard,
  clock: Clock3,
  file: FileText,
  headphones: Headphones,
  lock: LockKeyhole,
  mail: Mail,
  map: MapPin,
  package: PackageCheck,
  phone: Phone,
  refresh: RefreshCcw,
  shield: ShieldCheck,
  spark: Sparkles,
  truck: Truck,
  user: UserRound,
} satisfies Record<StaticPageIcon, LucideIcon>;

type StaticPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return Object.keys(staticPages).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: StaticPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicStaticPage(slug);

  if (!result) {
    return {};
  }

  return {
    title: result.page.title,
    description: result.page.description,
  };
}

export default async function StaticPage({ params }: StaticPageProps) {
  const { slug } = await params;
  const result = await getPublicStaticPage(slug);

  if (!result) {
    notFound();
  }

  const page = result.page;

  // DB-aware composer with static fallback so admin-managed brands/categories
  // appear in the header/footer here too.
  const data = await getHomePageDTO();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeaderWithSettings brands={data.brands} categories={data.categories} />
      <main>
        <PageHero page={page} />
        <StatsGrid cards={page.stats} />
        <PageSections sections={page.sections} />
        {page.fields ? <FieldPanel page={page} /> : null}
        {page.cards ? <LinkCards cards={page.cards} /> : null}
        {page.faqs ? <FaqPanel faqs={page.faqs} /> : null}
        {page.posts ? <PostGrid posts={page.posts} /> : null}
      </main>
      <SiteFooter brands={data.brands} categories={data.categories} />
      <MobileBottomNav brands={data.brands} categories={data.categories} />
    </div>
  );
}

function PageHero({ page }: { page: StaticPageContent }) {
  const quickLabel = page.primaryAction?.label ?? page.cards?.[0]?.title ?? "Browse support";
  const quickHref = page.primaryAction?.href ?? page.cards?.[0]?.href ?? "/support";

  return (
    <section className="soft-enter border-b border-border bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={page.breadcrumbs} />
        <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase text-brand">
              {page.eyebrow}
            </p>
            <h1 className="mt-4 max-w-4xl font-display text-5xl font-black leading-[0.98] text-foreground sm:text-6xl lg:text-7xl">
              {page.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted sm:text-lg">
              {page.description}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-background text-brand">
                <PackageSearch aria-hidden="true" size={22} />
              </span>
              <div>
                <p className="text-xs font-black uppercase text-muted">
                  Quick path
                </p>
                <p className="font-display text-xl font-black">
                  {quickLabel}
                </p>
              </div>
            </div>
            <Link
              href={quickHref}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand px-4 text-sm font-black text-white transition hover:bg-brand-strong hover:shadow-lg"
            >
              {quickLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsGrid({ cards }: { cards: StaticPageCard[] }) {
  return (
    <section className="bg-background py-8">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
        {cards.map((card, index) => (
          <InfoCard key={card.title} card={card} index={index} />
        ))}
      </div>
    </section>
  );
}

function InfoCard({ card, index }: { card: StaticPageCard; index: number }) {
  const Icon = iconMap[card.icon];
  const content = (
    <article
      className="card-hover soft-enter h-full rounded-2xl border border-border bg-surface p-5"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-background text-brand">
          <Icon aria-hidden="true" size={22} />
        </span>
        {card.meta ? (
          <span className="rounded-md border border-border bg-surface-soft px-2 py-1 text-xs font-black text-muted">
            {card.meta}
          </span>
        ) : null}
      </div>
      <h2 className="mt-5 font-display text-2xl font-black text-foreground">
        {card.title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">{card.description}</p>
    </article>
  );

  if (!card.href) {
    return content;
  }

  return (
    <Link href={card.href} className="block h-full">
      {content}
    </Link>
  );
}

function PageSections({ sections }: { sections: StaticPageSection[] }) {
  return (
    <section className="bg-surface-soft py-10">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:px-8">
        {sections.map((section, index) => {
          const Icon = iconMap[section.icon];

          return (
            <article
              key={section.title}
              className="soft-enter grid gap-5 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)] lg:grid-cols-[220px_1fr]"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div>
                <span className="grid h-14 w-14 place-items-center rounded-xl border border-border bg-background text-brand">
                  <Icon aria-hidden="true" size={24} />
                </span>
                {section.eyebrow ? (
                  <p className="mt-4 text-xs font-black uppercase text-brand">
                    {section.eyebrow}
                  </p>
                ) : null}
              </div>
              <div>
                <h2 className="font-display text-3xl font-black text-foreground">
                  {section.title}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted sm:text-base">
                  {section.body}
                </p>
                {section.bullets ? (
                  <div className="mt-5 grid gap-2 sm:grid-cols-3">
                    {section.bullets.map((bullet) => (
                      <p
                        key={bullet}
                        className="rounded-xl border border-border bg-background p-3 text-sm font-bold leading-6 text-foreground"
                      >
                        {bullet}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function FieldPanel({ page }: { page: StaticPageContent }) {
  if (!page.fields) {
    return null;
  }

  return (
    <section className="bg-background py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)] lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-black uppercase text-brand">
              Example flow
            </p>
            <h2 className="mt-3 font-display text-4xl font-black text-foreground">
              Form-ready layout
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              These fields show the intended customer flow. They are styled for
              real forms without exposing internal details to shoppers.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {page.fields.map((field) => (
              <label
                key={field.label}
                className="grid gap-2 text-xs font-black uppercase text-muted"
              >
                {field.label}
                <input
                  readOnly
                  value={field.value}
                  className="h-12 rounded-lg border border-border bg-background px-3 text-sm font-bold text-foreground outline-none"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LinkCards({ cards }: { cards: StaticPageCard[] }) {
  return (
    <section className="bg-background py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {cards.map((card, index) => (
            <InfoCard key={card.title} card={card} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqPanel({ faqs }: { faqs: NonNullable<StaticPageContent["faqs"]> }) {
  return (
    <section className="bg-background py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase text-brand">Common questions</p>
        <h2 className="mt-3 font-display text-4xl font-black text-foreground">
          Answers at a glance
        </h2>
        <div className="mt-6 grid gap-3">
          {faqs.map((item, index) => (
            <article
              key={item.question}
              className="soft-enter rounded-2xl border border-border bg-surface p-5 shadow-sm"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <h3 className="font-display text-xl font-black text-foreground">
                {item.question}
              </h3>
              <p className="mt-2 text-sm leading-7 text-muted">{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PostGrid({ posts }: { posts: NonNullable<StaticPageContent["posts"]> }) {
  return (
    <section className="bg-background py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {posts.map((post, index) => (
            <Link
              key={post.title}
              href={post.href}
              className="card-hover soft-enter rounded-2xl border border-border bg-surface p-5"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <p className="text-xs font-black uppercase text-brand">
                {post.category} · {post.readTime}
              </p>
              <h2 className="mt-4 font-display text-3xl font-black leading-tight text-foreground">
                {post.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
