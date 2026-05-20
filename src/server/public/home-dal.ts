import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { getHomePageData } from "@/lib/catalog";
import { hasSupabasePublicEnv } from "@/server/env";
import { getPublicCatalog } from "@/server/public/catalog-dal";
import { createSupabasePublicClient } from "@/server/supabase/public";
import type {
  CollabSlide,
  FeaturedDeal,
  HeroSlide,
  HomePageData,
  ImageAsset,
  TrustItem,
} from "@/types";
import type { PublicHomeData } from "@/types/api";
import type { Json, Tables } from "@/types/supabase";

type EmbeddedMedia = Pick<
  Tables<"media_assets">,
  "alt_text" | "height" | "thumbnail_url" | "url" | "width"
> | null;

type HeroSlideRow = Pick<
  Tables<"hero_slides">,
  | "cta_label"
  | "description"
  | "ends_at"
  | "eyebrow"
  | "href"
  | "id"
  | "offer"
  | "starts_at"
  | "title"
> & {
  media: EmbeddedMedia;
};

type VariantRow = Pick<
  Tables<"product_variants">,
  "compare_at_amount" | "currency" | "price_amount" | "selected_by_default"
>;

type CollectionItemRow = Pick<
  Tables<"collection_items">,
  "badge" | "feature" | "href" | "id" | "payload" | "sort_order" | "title"
> & {
  home_collections: Pick<Tables<"home_collections">, "key" | "status"> | null;
  media: EmbeddedMedia;
  products:
    | (Pick<Tables<"products">, "badge" | "feature" | "slug" | "title"> & {
        product_variants: VariantRow[];
      })
    | null;
};

type WarehouseSlideRow = Pick<
  Tables<"warehouse_slides">,
  "href" | "id" | "subtitle" | "title"
> & {
  media: EmbeddedMedia;
};

type BrandCollabRow = Pick<
  Tables<"brand_collabs">,
  "id" | "subtitle" | "title"
> & {
  brands: Pick<Tables<"brands">, "slug"> | null;
  media: EmbeddedMedia;
};

type TrustCardRow = Pick<
  Tables<"trust_cards">,
  "description" | "metric" | "title"
>;

const HERO_SELECT = `
  id,
  title,
  eyebrow,
  description,
  offer,
  cta_label,
  href,
  starts_at,
  ends_at,
  media:media_assets!hero_slides_media_id_fkey(url,thumbnail_url,alt_text,width,height)
`;

const COLLECTION_ITEM_SELECT = `
  id,
  title,
  badge,
  feature,
  href,
  payload,
  sort_order,
  home_collections!inner(key,status),
  media:media_assets!collection_items_media_id_fkey(url,thumbnail_url,alt_text,width,height),
  products(
    slug,
    title,
    badge,
    feature,
    product_variants(
      price_amount,
      compare_at_amount,
      currency,
      selected_by_default
    )
  )
`;

const HOMEPAGE_COLLECTION_KEYS = [
  "top-deals",
  "new-drops",
  "top-picks",
  "featured-deals",
];

const WAREHOUSE_SELECT = `
  id,
  title,
  subtitle,
  href,
  media:media_assets!warehouse_slides_media_id_fkey(url,thumbnail_url,alt_text,width,height)
`;

const COLLAB_SELECT = `
  id,
  title,
  subtitle,
  brands(slug),
  media:media_assets!brand_collabs_media_id_fkey(url,thumbnail_url,alt_text,width,height)
`;

export async function getHomePageDTO(): Promise<HomePageData> {
  "use cache";
  cacheLife("hours");
  cacheTag("home-page", "catalog");

  const result = await getPublicHomePage();
  return result.home;
}

export async function getPublicHomePage(): Promise<PublicHomeData> {
  "use cache";
  cacheLife("hours");
  cacheTag("home-page", "catalog");

  const fallback = await getHomePageData();

  if (!hasSupabasePublicEnv()) {
    return {
      home: fallback,
      source: "static",
    };
  }

  try {
    const supabase = createSupabasePublicClient();
    const now = new Date().toISOString();

    const [
      catalog,
      heroResult,
      collectionResult,
      warehouseResult,
      collabResult,
      trustResult,
    ] = await Promise.all([
      getPublicCatalog(),
      supabase
        .from("hero_slides")
        .select(HERO_SELECT)
        .eq("status", "published")
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order("sort_order", { ascending: true }),
      supabase
        .from("collection_items")
        .select(COLLECTION_ITEM_SELECT)
        .eq("status", "published")
        .eq("home_collections.status", "published")
        .in("home_collections.key", HOMEPAGE_COLLECTION_KEYS)
        .order("sort_order", { ascending: true })
        .limit(6),
      supabase
        .from("warehouse_slides")
        .select(WAREHOUSE_SELECT)
        .eq("status", "published")
        .order("sort_order", { ascending: true }),
      supabase
        .from("brand_collabs")
        .select(COLLAB_SELECT)
        .eq("status", "published")
        .order("sort_order", { ascending: true }),
      supabase
        .from("trust_cards")
        .select("title,description,metric")
        .eq("status", "published")
        .order("sort_order", { ascending: true }),
    ]);

    if (heroResult.error) throw heroResult.error;
    if (collectionResult.error) throw collectionResult.error;
    if (warehouseResult.error) throw warehouseResult.error;
    if (collabResult.error) throw collabResult.error;
    if (trustResult.error) throw trustResult.error;

    const heroRows = (heroResult.data ?? []) as unknown as HeroSlideRow[];
    const collectionRows =
      (collectionResult.data ?? []) as unknown as CollectionItemRow[];
    const warehouseRows =
      (warehouseResult.data ?? []) as unknown as WarehouseSlideRow[];
    const collabRows = (collabResult.data ?? []) as unknown as BrandCollabRow[];
    const trustRows = (trustResult.data ?? []) as TrustCardRow[];

    const hasDatabaseHomeContent =
      heroRows.length > 0 ||
      collectionRows.length > 0 ||
      warehouseRows.length > 0 ||
      collabRows.length > 0 ||
      trustRows.length > 0 ||
      catalog.source === "database";

    if (!hasDatabaseHomeContent) {
      return {
        home: fallback,
        source: "static",
      };
    }

    return {
      home: {
        ...fallback,
        brands: catalog.brands,
        categories: catalog.categories,
        heroSlides:
          heroRows.length > 0
            ? heroRows.map((row, index) =>
                mapHeroSlide(row, fallback.heroSlides[index]),
              )
            : fallback.heroSlides,
        featuredDeals:
          collectionRows.length > 0
            ? collectionRows.map((row, index) =>
                mapFeaturedDeal(row, fallback.featuredDeals[index]),
              )
            : fallback.featuredDeals,
        warehouseSlides:
          warehouseRows.length > 0
            ? warehouseRows.map((row, index) =>
                mapWarehouseSlide(row, fallback.warehouseSlides[index]),
              )
            : fallback.warehouseSlides,
        collabSlides:
          collabRows.length > 0
            ? collabRows.map((row, index) =>
                mapBrandCollab(row, fallback.collabSlides[index]),
              )
            : fallback.collabSlides,
        trustItems:
          trustRows.length > 0
            ? trustRows.map(mapTrustCard)
            : fallback.trustItems,
      },
      source: "database",
    };
  } catch (error) {
    console.error("[public:home-dal]", error);
    return {
      home: fallback,
      source: "static",
    };
  }
}

function mapHeroSlide(row: HeroSlideRow, fallback: HeroSlide | undefined): HeroSlide {
  return {
    id: row.id,
    eyebrow: row.eyebrow ?? fallback?.eyebrow ?? "Featured",
    title: row.title,
    description: row.description ?? fallback?.description ?? "",
    offer: row.offer ?? fallback?.offer ?? "",
    ctaLabel: row.cta_label ?? fallback?.ctaLabel ?? "Shop now",
    href: row.href ?? fallback?.href ?? "/products",
    image: mapImageAsset(row.media, fallback?.image, "hero-slide"),
  };
}

function mapFeaturedDeal(
  row: CollectionItemRow,
  fallback: FeaturedDeal | undefined,
): FeaturedDeal {
  const product = row.products;
  const variant =
    product?.product_variants.find((item) => item.selected_by_default) ??
    product?.product_variants[0] ??
    null;
  const payload = toRecord(row.payload);
  const price = readString(payload.price);
  const compareAt = readString(payload.compareAt);
  const discount = readString(payload.discount);

  return {
    id: row.id,
    badge: row.badge ?? product?.badge ?? fallback?.badge ?? "Deal live",
    feature: row.feature ?? product?.feature ?? fallback?.feature ?? "Featured",
    title: row.title ?? product?.title ?? fallback?.title ?? "Featured product",
    price: price ?? (variant ? formatMoney(variant.price_amount, variant.currency) : fallback?.price ?? ""),
    compareAt:
      compareAt ??
      (variant?.compare_at_amount
        ? formatMoney(variant.compare_at_amount, variant.currency)
        : fallback?.compareAt ?? ""),
    discount:
      discount ??
      (variant?.compare_at_amount
        ? formatDiscount(variant.price_amount, variant.compare_at_amount)
        : fallback?.discount ?? ""),
    href:
      row.href ??
      (product?.slug ? `/products/${product.slug}` : fallback?.href ?? "/products"),
    image: mapImageAsset(row.media, fallback?.image, "featured-deal"),
  };
}

function mapWarehouseSlide(
  row: WarehouseSlideRow,
  fallback: CollabSlide | undefined,
): CollabSlide {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? fallback?.subtitle ?? "",
    href: row.href ?? fallback?.href ?? "/about",
    image: mapImageAsset(row.media, fallback?.image, "warehouse-slide"),
  };
}

function mapBrandCollab(
  row: BrandCollabRow,
  fallback: CollabSlide | undefined,
): CollabSlide {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? fallback?.subtitle ?? "",
    href: row.brands?.slug
      ? `/products?brand=${row.brands.slug}`
      : fallback?.href ?? "/products?sort=deals",
    image: mapImageAsset(row.media, fallback?.image, "brand-collab"),
  };
}

function mapTrustCard(row: TrustCardRow): TrustItem {
  return {
    title: row.title,
    description: row.description ?? "",
    metric: row.metric ?? "",
  };
}

function mapImageAsset(
  asset: EmbeddedMedia,
  fallback: ImageAsset | undefined,
  fallbackLabel: string,
): ImageAsset {
  if (!asset) {
    return (
      fallback ?? {
        src: "/assets/category-icons/mobile-accessories.svg",
        alt: fallbackLabel,
        width: 640,
        height: 480,
        label: `${fallbackLabel}.svg`,
      }
    );
  }

  const src = asset.thumbnail_url ?? asset.url;

  return {
    src,
    alt: asset.alt_text ?? fallback?.alt ?? fallbackLabel,
    width: asset.width ?? fallback?.width ?? 640,
    height: asset.height ?? fallback?.height ?? 480,
    label: getMediaLabel(src),
  };
}

function formatMoney(amount: number, currency: string) {
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(amount);

  return currency === "INR" ? `Rs. ${formattedAmount}` : `${currency} ${formattedAmount}`;
}

function formatDiscount(price: number, compareAt: number) {
  if (compareAt <= price) {
    return "";
  }

  return `${Math.round(((compareAt - price) / compareAt) * 100)}% off`;
}

function getMediaLabel(url: string) {
  return url.split("/").pop()?.split("?")[0] || "media";
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function toRecord(value: Json): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}
