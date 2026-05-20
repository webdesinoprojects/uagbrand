import "server-only";

import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { AdminDashboardData } from "@/types/api";

// The Supabase typed query builder narrows differently per table, so a
// reusable count helper would need per-table generics. We keep one localized
// loose type here so the composer stays a single Promise.all call.
/* eslint-disable @typescript-eslint/no-explicit-any */
type FilterFn = (q: any) => any;
type Counter = (table: string, filters?: FilterFn) => Promise<number>;
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  // Caller must be authenticated as staff (verified in the route handler).
  // We use the admin client here so dashboard counts are RLS-independent;
  // otherwise a support-role actor would see 0 for catalog/CMS tables they
  // cannot SELECT directly, which is misleading for an aggregate dashboard.
  const supabase = createSupabaseAdminClient();

  const count: Counter = async (table, filters) => {
    let q = supabase.from(table as never).select("id", { count: "exact", head: true });
    if (filters) q = filters(q);
    const r = await q;
    if (r.error) throw r.error;
    return r.count ?? 0;
  };

  const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    productsTotal,
    productsPublished,
    productsDraft,
    productsArchived,
    brands,
    categories,
    offersTotal,
    offersPublished,
    media,
    pages,
    navigationItems,
    footerColumns,
    heroSlides,
    homeCollections,
    warehouseSlides,
    brandCollabs,
    trustCards,
    newsletterTotal,
    newsletterPending,
    newsletterConfirmed,
    contactTotal,
    contactNew,
    reviewsTotal,
    reviewsDraft,
    supportTotal,
    supportOpen,
  ] = await Promise.all([
    count("products"),
    count("products", (q) => q.eq("status", "published")),
    count("products", (q) => q.eq("status", "draft")),
    count("products", (q) => q.eq("status", "archived")),
    count("brands"),
    count("categories"),
    count("offers"),
    count("offers", (q) => q.eq("status", "published")),
    count("media_assets"),
    count("pages"),
    count("navigation_items"),
    count("footer_columns"),
    count("hero_slides"),
    count("home_collections"),
    count("warehouse_slides"),
    count("brand_collabs"),
    count("trust_cards"),
    count("newsletter_subscribers"),
    count("newsletter_subscribers", (q) => q.eq("status", "pending")),
    count("newsletter_subscribers", (q) => q.eq("status", "confirmed")),
    count("contact_messages"),
    count("contact_messages", (q) => q.eq("status", "new").gte("created_at", sevenDaysAgoIso)),
    count("reviews"),
    count("reviews", (q) => q.eq("status", "draft")),
    count("support_tickets"),
    count("support_tickets", (q) => q.eq("status", "open")),
  ]);

  return {
    catalog: {
      products: {
        total: productsTotal,
        published: productsPublished,
        draft: productsDraft,
        archived: productsArchived,
      },
      brands,
      categories,
      offers: { total: offersTotal, published: offersPublished },
      media,
    },
    content: {
      pages,
      navigationItems,
      footerColumns,
      heroSlides,
      homeCollections,
      warehouseSlides,
      brandCollabs,
      trustCards,
    },
    customer: {
      newsletter: {
        total: newsletterTotal,
        pending: newsletterPending,
        confirmed: newsletterConfirmed,
      },
      contactMessages: { total: contactTotal, newCount: contactNew },
      reviews: { total: reviewsTotal, pendingModeration: reviewsDraft },
      supportTickets: { total: supportTotal, openCount: supportOpen },
    },
    generatedAt: new Date().toISOString(),
  };
}
