import "server-only";

import {
  getFilteredProducts,
  getProductBySlug,
  getProducts,
  type ProductFilter,
} from "@/lib/products";
import { hasSupabasePublicEnv } from "@/server/env";
import {
  buildPaginationMeta,
  getPagination,
  type PaginationInput,
} from "@/server/http/pagination";
import { createSupabasePublicClient } from "@/server/supabase/public";
import type { ProductListData, PublicDataSource } from "@/types/api";
import type {
  ImageAsset,
  Product,
  ProductColorOption,
  ProductOffer,
  ProductSpecification,
} from "@/types";
import type { Tables } from "@/types/supabase";

type ProductListInput = ProductFilter & PaginationInput;

type ProductRow = Tables<"products"> & {
  brands: Pick<Tables<"brands">, "slug" | "name"> | null;
  categories: Pick<Tables<"categories">, "slug" | "name"> | null;
  product_variants: Pick<
    Tables<"product_variants">,
    | "color_name"
    | "color_swatch"
    | "compare_at_amount"
    | "currency"
    | "id"
    | "is_available"
    | "product_id"
    | "price_amount"
    | "selected_by_default"
    | "sku"
  >[];
  product_media: (Pick<Tables<"product_media">, "role" | "sort_order"> & {
    media_assets: Pick<
      Tables<"media_assets">,
      "alt_text" | "height" | "resource_type" | "thumbnail_url" | "url" | "width"
    > | null;
  })[];
  product_offer_links: {
    offers: Pick<Tables<"offers">, "code" | "label" | "status" | "title" | "value"> | null;
  }[];
  product_specifications: Pick<
    Tables<"product_specifications">,
    "label" | "sort_order" | "value"
  >[];
};

const PRODUCT_SELECT = `
  id,
  slug,
  title,
  badge,
  feature,
  tagline,
  description,
  rating,
  rating_count,
  brands!inner(slug,name),
  categories!inner(slug,name),
  product_variants(
    id,
    product_id,
    sku,
    color_name,
    color_swatch,
    is_available,
    price_amount,
    compare_at_amount,
    currency,
    selected_by_default
  ),
  product_media(
    role,
    sort_order,
    media_assets(
      url,
      thumbnail_url,
      alt_text,
      width,
      height,
      resource_type
    )
  ),
  product_offer_links(
    offers(
      label,
      title,
      value,
      code,
      status
    )
  ),
  product_specifications(
    label,
    value,
    sort_order
  )
`;

export async function getPublicProducts(
  input: ProductListInput = {},
): Promise<ProductListData> {
  const pagination = getPagination(input);

  if (!hasSupabasePublicEnv()) {
    return getStaticProductList(input, "static");
  }

  try {
    const supabase = createSupabasePublicClient();
    let query = supabase
      .from("products")
      .select(PRODUCT_SELECT, { count: "exact" })
      .eq("status", "published")
      .range(pagination.from, pagination.to);

    if (input.brand) {
      query = query.eq("brands.slug", input.brand);
    }

    if (input.category) {
      query = query.eq("categories.slug", input.category);
    }

    if (input.q?.trim()) {
      const escapedQuery = escapeSearchValue(input.q.trim());
      query = query.or(
        `title.ilike.%${escapedQuery}%,tagline.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%`,
      );
    }

    if (input.sort === "new") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("updated_at", { ascending: false });
    }

    const result = await query;

    if (result.error) {
      throw result.error;
    }

    const rows = (result.data ?? []) as unknown as ProductRow[];

    if (rows.length === 0 && !(await hasPublishedProducts())) {
      return getStaticProductList(input, "static");
    }

    const items = rows
      .map(mapProductRow)
      .filter((product): product is Product => Boolean(product));

    return {
      items,
      pagination: buildPaginationMeta({
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: result.count ?? items.length,
      }),
      source: "database",
    };
  } catch (error) {
    console.error("[public:products-dal]", error);
    return getStaticProductList(input, "static");
  }
}

export async function getPublicProductBySlug(slug: string) {
  if (!hasSupabasePublicEnv()) {
    return getStaticProductDetail(slug, "static");
  }

  try {
    const supabase = createSupabasePublicClient();
    const result = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("status", "published")
      .eq("slug", slug)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      return getStaticProductDetail(slug, "static");
    }

    const product = mapProductRow(result.data as unknown as ProductRow);

    if (!product) {
      return getStaticProductDetail(slug, "static");
    }

    return {
      product,
      relatedProducts: getRelatedStaticProducts(product),
      source: "database" as PublicDataSource,
    };
  } catch (error) {
    console.error("[public:product-dal]", error);
    return getStaticProductDetail(slug, "static");
  }
}

function getStaticProductList(
  input: ProductListInput,
  source: PublicDataSource,
): ProductListData {
  const pagination = getPagination(input);
  const allItems = getFilteredProducts(input);
  const items = allItems.slice(pagination.from, pagination.to + 1);

  return {
    items,
    pagination: buildPaginationMeta({
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: allItems.length,
    }),
    source,
  };
}

function getStaticProductDetail(slug: string, source: PublicDataSource) {
  const product = getProductBySlug(slug);

  if (!product) {
    return null;
  }

  return {
    product,
    relatedProducts: getRelatedStaticProducts(product),
    source,
  };
}

function getRelatedStaticProducts(product: Product) {
  return getProducts()
    .filter(
      (item) =>
        item.slug !== product.slug &&
        (item.categorySlug === product.categorySlug ||
          item.brandSlug === product.brandSlug),
    )
    .slice(0, 4);
}

async function hasPublishedProducts() {
  const supabase = createSupabasePublicClient();
  const result = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  if (result.error) {
    throw result.error;
  }

  return Boolean(result.count && result.count > 0);
}

function mapProductRow(row: ProductRow): Product | null {
  const variants = row.product_variants ?? [];
  const selectedVariant =
    variants.find((variant) => variant.selected_by_default) ?? variants[0];

  if (!selectedVariant) {
    return null;
  }

  const categorySlug = row.categories?.slug ?? "mobile-accessories";
  const media = (row.product_media ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => ({
      role: item.role,
      asset: item.media_assets,
    }))
    .filter(
      (item): item is { role: string; asset: NonNullable<typeof item.asset> } =>
        Boolean(item.asset),
    );

  const imageMedia = media
    .filter((item) => item.asset.resource_type !== "video")
    .map((item) => ({
      role: item.role,
      image: mapImageAsset(item.asset),
    }));
  const galleryImages = imageMedia
    .filter((item) => item.role.startsWith("gallery"))
    .map((item) => item.image);
  const bentoImages = imageMedia
    .filter((item) => item.role.startsWith("bento"))
    .map((item) => item.image);
  const fallback = fallbackImage(categorySlug);
  const images =
    galleryImages.length > 0
      ? galleryImages
      : imageMedia.length > 0
        ? imageMedia.map((item) => item.image)
        : [fallback];
  const productVideo = media
    .filter((item) => item.asset.resource_type === "video")
    .map((item) => mapImageAsset(item.asset))[0];
  const compareAt = selectedVariant.compare_at_amount ?? selectedVariant.price_amount;

  return {
    id: row.id,
    selectedVariantId: selectedVariant.id,
    slug: row.slug,
    title: row.title,
    brandSlug: row.brands?.slug ?? "all-earbuds",
    categorySlug,
    badge: row.badge ?? "Catalog pick",
    feature: row.feature ?? "Ready to ship",
    tagline: row.tagline ?? row.description ?? row.title,
    description: row.description ?? row.tagline ?? row.title,
    price: formatMoney(selectedVariant.price_amount, selectedVariant.currency),
    compareAt: formatMoney(compareAt, selectedVariant.currency),
    discount: formatDiscount(selectedVariant.price_amount, compareAt),
    rating: Number(row.rating).toFixed(1),
    ratingCount: String(row.rating_count),
    availability: selectedVariant.is_available ? "in-stock" : "out-of-stock",
    selectedColor: selectedVariant.color_name ?? "Default",
    colors: mapColors(variants),
    deliveryPincode: "122008",
    deliveryPromise: selectedVariant.is_available
      ? "Free delivery | By tomorrow"
      : "Notify me when stock returns",
    usersLove: `${row.rating_count.toLocaleString("en-IN")} verified reviews from buyers.`,
    rewardText: `Earn upto ${Math.max(10, Math.floor(selectedVariant.price_amount / 20))} reward points on this product`,
    activeOffers: mapOffers(row.product_offer_links),
    images,
    galleryImages: images,
    bentoImages: bentoImages.length > 0 ? bentoImages : images,
    productVideo,
    specifications: mapSpecifications(row.product_specifications, row.categories?.name),
  };
}

function mapImageAsset(asset: NonNullable<ProductRow["product_media"][number]["media_assets"]>): ImageAsset {
  return {
    src: asset.thumbnail_url ?? asset.url,
    alt: asset.alt_text ?? "Product media",
    width: asset.width ?? 640,
    height: asset.height ?? 480,
    label: getMediaLabel(asset.url),
    resourceType: asset.resource_type as ImageAsset["resourceType"],
  };
}

function fallbackImage(categorySlug: string): ImageAsset {
  return {
    src: `/assets/category-icons/${categorySlug}.svg`,
    alt: "Product image",
    width: 640,
    height: 480,
    label: `${categorySlug}.svg`,
  };
}

function mapColors(
  variants: ProductRow["product_variants"],
): ProductColorOption[] {
  const colors = variants.map((variant) => ({
    name: variant.color_name ?? "Default",
    swatch: variant.color_swatch ?? "#111318",
    available: variant.is_available,
  }));

  if (colors.length === 0) {
    return [{ name: "Default", swatch: "#111318", available: true }];
  }

  return colors;
}

function mapOffers(links: ProductRow["product_offer_links"]): ProductOffer[] {
  const offers = links
    .map((link) => link.offers)
    .filter(
      (offer): offer is NonNullable<typeof offer> =>
        Boolean(offer) && offer?.status === "published",
    )
    .map((offer) => ({
      label: offer.label ?? "Active offer",
      title: offer.title,
      value: offer.value,
      code: offer.code ?? "ALLEARBUDS",
    }));

  if (offers.length > 0) {
    return offers;
  }

  return [
    {
      label: "Active offer",
      title: "Launch deal",
      value: "Best price available",
      code: "ALLEARBUDS",
    },
  ];
}

function mapSpecifications(
  rows: ProductRow["product_specifications"],
  categoryName: string | undefined,
): ProductSpecification[] {
  const specs = rows
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => ({
      label: item.label,
      value: item.value,
    }));

  if (categoryName && !specs.some((item) => item.label === "Category")) {
    return [{ label: "Category", value: categoryName }, ...specs];
  }

  return specs;
}

function formatMoney(amount: number, currency: string) {
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(amount);

  if (currency === "INR") {
    return `Rs. ${formattedAmount}`;
  }

  return `${currency} ${formattedAmount}`;
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

function escapeSearchValue(value: string) {
  return value.replaceAll("%", "\\%").replaceAll("_", "\\_").replaceAll(",", " ");
}
