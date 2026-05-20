import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { hasSupabasePublicEnv } from "@/server/env";
import { createSupabasePublicClient } from "@/server/supabase/public";
import type {
  AdminMediaReference,
  MediaResourceType,
  PublicSiteSettingsData,
} from "@/types/api";
import type { Tables } from "@/types/supabase";

export type PublicFooterLink = {
  id: string;
  label: string;
  href: string;
};

export type PublicFooterColumn = {
  id: string;
  title: string;
  links: PublicFooterLink[];
};

export type PublicNavigationItem = {
  id: string;
  label: string;
  href: string;
  location: string;
};

export type PublicFooterColumnsResult = {
  columns: PublicFooterColumn[];
  source: "database" | "static";
};

export type PublicNavigationResult = {
  items: PublicNavigationItem[];
  source: "database" | "static";
};

type EmbeddedMedia = Pick<
  Tables<"media_assets">,
  "alt_text" | "height" | "id" | "resource_type" | "thumbnail_url" | "url" | "width"
> | null;

type SiteSettingsRow = Pick<
  Tables<"site_settings">,
  | "address_label"
  | "contact_email"
  | "contact_phone"
  | "footer_description"
  | "logo_media_id"
  | "site_name"
> & {
  logo: EmbeddedMedia;
};

const STATIC_SITE_SETTINGS: PublicSiteSettingsData = {
  siteName: "ALLEARBUDS.COM",
  logo: null,
  contactEmail: "support@allearbuds.com",
  contactPhone: "+91 00000 00000",
  addressLabel: "India dispatch center",
  footerDescription:
    "AllEarbuds is structured as a fast ecommerce storefront for audio, wearables, charging products and daily mobile accessories.",
  source: "static",
};

const STATIC_FOOTER_COLUMNS: PublicFooterColumn[] = [
  {
    id: "static-support",
    title: "Support",
    links: [
      { id: "static-about", label: "About us", href: "/about" },
      { id: "static-support-center", label: "Support center", href: "/support" },
      { id: "static-contact", label: "Contact us", href: "/contact" },
      { id: "static-track", label: "Track my order", href: "/track-order" },
      { id: "static-faq", label: "FAQ", href: "/faq" },
    ],
  },
  {
    id: "static-policy",
    title: "Policy",
    links: [
      { id: "static-return", label: "Return / refund policy", href: "/return-policy" },
      { id: "static-shipping", label: "Shipping policy", href: "/shipping-policy" },
      { id: "static-privacy", label: "Privacy policy", href: "/privacy-policy" },
      { id: "static-terms", label: "Terms and conditions", href: "/terms-and-conditions" },
      { id: "static-blogs", label: "Blogs", href: "/blogs" },
    ],
  },
];

const STATIC_NAVIGATION_ITEMS: PublicNavigationItem[] = [
  { id: "static-store", label: "Store", href: "/products", location: "header" },
  { id: "static-about", label: "About", href: "/about", location: "header" },
  { id: "static-support", label: "Support", href: "/support", location: "header" },
];

const MEDIA_SELECT = "id,url,thumbnail_url,resource_type,alt_text,width,height";
const SITE_SETTINGS_SELECT = `
  site_name,
  logo_media_id,
  contact_email,
  contact_phone,
  address_label,
  footer_description,
  logo:media_assets!site_settings_logo_media_id_fkey(${MEDIA_SELECT})
`;

export async function getPublicSiteSettings(): Promise<PublicSiteSettingsData> {
  "use cache";
  cacheLife("hours");
  cacheTag("site-chrome");

  if (!hasSupabasePublicEnv()) {
    return STATIC_SITE_SETTINGS;
  }

  try {
    const supabase = createSupabasePublicClient();
    const result = await supabase
      .from("site_settings")
      .select(SITE_SETTINGS_SELECT)
      .eq("id", true)
      .maybeSingle<SiteSettingsRow>();

    if (result.error) throw result.error;
    if (!result.data) return STATIC_SITE_SETTINGS;

    return {
      siteName: result.data.site_name,
      logo: mapMedia(result.data.logo),
      contactEmail: result.data.contact_email,
      contactPhone: result.data.contact_phone,
      addressLabel: result.data.address_label,
      footerDescription: result.data.footer_description,
      source: "database",
    };
  } catch (error) {
    console.error("[public:site-chrome-dal:settings]", error);
    return STATIC_SITE_SETTINGS;
  }
}

type ColumnRow = {
  id: string;
  title: string;
  sort_order: number;
  footer_links: {
    id: string;
    label: string;
    href: string;
    sort_order: number;
    status: string;
  }[];
};

type NavigationRow = {
  id: string;
  label: string;
  href: string;
  location: string;
  sort_order: number;
};

export async function getPublicNavigationItems(
  location = "header",
): Promise<PublicNavigationResult> {
  "use cache";
  cacheLife("hours");
  cacheTag("site-chrome");

  if (!hasSupabasePublicEnv()) {
    return {
      items: STATIC_NAVIGATION_ITEMS.filter((item) => item.location === location),
      source: "static",
    };
  }

  try {
    const supabase = createSupabasePublicClient();
    const result = await supabase
      .from("navigation_items")
      .select("id,label,href,location,sort_order")
      .eq("status", "published")
      .eq("location", location)
      .is("parent_id", null)
      .order("sort_order", { ascending: true })
      .order("label", { ascending: true });

    if (result.error) throw result.error;

    const rows = (result.data ?? []) as NavigationRow[];
    if (rows.length === 0) {
      return {
        items: STATIC_NAVIGATION_ITEMS.filter((item) => item.location === location),
        source: "static",
      };
    }

    return {
      items: rows.map((row) => ({
        id: row.id,
        label: row.label,
        href: row.href,
        location: row.location,
      })),
      source: "database",
    };
  } catch (error) {
    console.error("[public:site-chrome-dal:navigation]", error);
    return {
      items: STATIC_NAVIGATION_ITEMS.filter((item) => item.location === location),
      source: "static",
    };
  }
}

export async function getPublicFooterColumns(): Promise<PublicFooterColumnsResult> {
  "use cache";
  cacheLife("hours");
  cacheTag("site-chrome");

  if (!hasSupabasePublicEnv()) {
    return { columns: STATIC_FOOTER_COLUMNS, source: "static" };
  }

  try {
    const supabase = createSupabasePublicClient();
    const result = await supabase
      .from("footer_columns")
      .select(
        "id,title,sort_order,footer_links(id,label,href,sort_order,status)",
      )
      .eq("status", "published")
      .order("sort_order", { ascending: true });

    if (result.error) throw result.error;

    const rows = (result.data ?? []) as unknown as ColumnRow[];

    if (rows.length === 0) {
      return { columns: STATIC_FOOTER_COLUMNS, source: "static" };
    }

    const columns: PublicFooterColumn[] = rows.map((col) => ({
      id: col.id,
      title: col.title,
      links: (col.footer_links ?? [])
        .filter((link) => link.status === "published")
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((link) => ({ id: link.id, label: link.label, href: link.href })),
    }));

    return { columns, source: "database" };
  } catch (error) {
    console.error("[public:site-chrome-dal:footer]", error);
    return { columns: STATIC_FOOTER_COLUMNS, source: "static" };
  }
}

function mapMedia(row: EmbeddedMedia): AdminMediaReference | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    url: row.url,
    thumbnailUrl: row.thumbnail_url,
    resourceType: row.resource_type as MediaResourceType,
    altText: row.alt_text,
    width: row.width,
    height: row.height,
  };
}
