import "server-only";

import { getHomePageData } from "@/lib/catalog";
import { hasSupabasePublicEnv } from "@/server/env";
import { createSupabasePublicClient } from "@/server/supabase/public";
import type { PublicCatalogData, PublicDataSource } from "@/types/api";
import type { Brand, Category, ImageAsset } from "@/types";
import type { Tables } from "@/types/supabase";

type EmbeddedMedia = Pick<
  Tables<"media_assets">,
  "url" | "alt_text" | "width" | "height" | "resource_type" | "thumbnail_url"
> | null;

type BrandRow = Pick<Tables<"brands">, "slug" | "name" | "deal"> & {
  logo: EmbeddedMedia;
};

type CategoryRow = Pick<
  Tables<"categories">,
  "slug" | "name" | "short_name" | "description"
> & {
  hoverMedia: EmbeddedMedia;
  image: EmbeddedMedia;
};

// Brands have one FK to media_assets (logo_media_id) — Supabase can resolve it
// without a hint, but we alias for cleaner row access.
const BRAND_SELECT = `
  slug,
  name,
  deal,
  logo:media_assets!brands_logo_media_id_fkey(url,alt_text,width,height)
`;

// Categories have two FKs to media_assets (image_media_id + hover_media_id);
// PostgREST requires the constraint name to disambiguate the embed.
const CATEGORY_SELECT = `
  slug,
  name,
  short_name,
  description,
  image:media_assets!categories_image_media_id_fkey(url,thumbnail_url,resource_type,alt_text,width,height),
  hoverMedia:media_assets!categories_hover_media_id_fkey(url,thumbnail_url,resource_type,alt_text,width,height)
`;

export async function getPublicCatalog(): Promise<PublicCatalogData> {
  if (!hasSupabasePublicEnv()) {
    return getStaticCatalog("static");
  }

  try {
    const supabase = createSupabasePublicClient();

    const [brandsResult, categoriesResult] = await Promise.all([
      supabase
        .from("brands")
        .select(BRAND_SELECT)
        .eq("status", "published")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("categories")
        .select(CATEGORY_SELECT)
        .eq("status", "published")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
    ]);

    if (brandsResult.error) throw brandsResult.error;
    if (categoriesResult.error) throw categoriesResult.error;

    const brandRows = (brandsResult.data ?? []) as unknown as BrandRow[];
    const categoryRows = (categoriesResult.data ?? []) as unknown as CategoryRow[];

    if (brandRows.length === 0 && categoryRows.length === 0) {
      return getStaticCatalog("static");
    }

    const fallback = await getStaticCatalog("static");

    return {
      brands: brandRows.length > 0 ? brandRows.map(mapBrandRow) : fallback.brands,
      categories:
        categoryRows.length > 0 ? categoryRows.map(mapCategoryRow) : fallback.categories,
      source: "database",
    };
  } catch (error) {
    console.error("[public:catalog-dal]", error);
    return getStaticCatalog("static");
  }
}

async function getStaticCatalog(
  source: PublicDataSource,
): Promise<PublicCatalogData> {
  const home = await getHomePageData();
  return {
    brands: home.brands,
    categories: home.categories,
    source,
  };
}

function mapBrandRow(row: BrandRow): Brand {
  const slug = row.slug;
  return {
    slug,
    name: row.name,
    deal: row.deal ?? "Brand pick",
    href: `/products?brand=${slug}` as const,
    logo: mapImageAsset(row.logo, `${slug}-logo`),
  };
}

function mapCategoryRow(row: CategoryRow): Category {
  const slug = row.slug;
  return {
    slug,
    name: row.name,
    shortName: row.short_name,
    description: row.description ?? row.name,
    href: `/products?category=${slug}` as const,
    image: mapImageAsset(row.image, slug),
    hoverMedia: row.hoverMedia ? mapImageAsset(row.hoverMedia, `${slug}-hover`) : undefined,
  };
}

function mapImageAsset(
  asset: {
    url: string;
    alt_text: string | null;
    width: number | null;
    height: number | null;
    resource_type?: string | null;
    thumbnail_url?: string | null;
  } | null,
  fallbackLabel: string,
): ImageAsset {
  if (!asset) {
    return {
      src: `/assets/category-icons/${fallbackLabel}.svg`,
      alt: fallbackLabel,
        width: 320,
        height: 240,
        label: `${fallbackLabel}.svg`,
        resourceType: "image",
      };
  }
  const src = asset.thumbnail_url ?? asset.url;
  return {
    src,
    alt: asset.alt_text ?? fallbackLabel,
    width: asset.width ?? 320,
    height: asset.height ?? 240,
    label: getMediaLabel(src),
    resourceType: toResourceType(asset.resource_type),
  };
}

function getMediaLabel(url: string) {
  return url.split("/").pop()?.split("?")[0] || "media";
}

function toResourceType(value: string | null | undefined): ImageAsset["resourceType"] {
  if (value === "video" || value === "gif" || value === "file") {
    return value;
  }

  return "image";
}
