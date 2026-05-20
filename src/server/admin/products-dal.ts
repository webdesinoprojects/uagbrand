import "server-only";

import {
  buildPaginationMeta,
  getPagination,
  type PaginationInput,
} from "@/server/http/pagination";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type {
  AdminMediaReference,
  AdminOffer,
  AdminProduct,
  AdminProductListData,
  AdminProductMedia,
  AdminProductSpecification,
  AdminProductVariant,
  MediaResourceType,
  PublishStatus,
} from "@/types/api";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

type EmbeddedMedia = Pick<
  Tables<"media_assets">,
  "alt_text" | "height" | "id" | "resource_type" | "thumbnail_url" | "url" | "width"
> | null;

type ProductRow = Pick<
  Tables<"products">,
  | "badge"
  | "brand_id"
  | "category_id"
  | "created_at"
  | "description"
  | "feature"
  | "id"
  | "rating"
  | "rating_count"
  | "seo_description"
  | "seo_title"
  | "slug"
  | "status"
  | "tagline"
  | "title"
  | "updated_at"
> & {
  brands: Pick<Tables<"brands">, "id" | "name" | "slug"> | null;
  categories:
    | Pick<Tables<"categories">, "id" | "name" | "short_name" | "slug">
    | null;
  product_media: (Pick<
    Tables<"product_media">,
    "created_at" | "id" | "role" | "sort_order" | "variant_id"
  > & {
    media_assets: EmbeddedMedia;
  })[];
  product_specifications: Pick<
    Tables<"product_specifications">,
    "created_at" | "group_name" | "id" | "label" | "sort_order" | "updated_at" | "value"
  >[];
  product_variants: Pick<
    Tables<"product_variants">,
    | "color_name"
    | "color_swatch"
    | "compare_at_amount"
    | "created_at"
    | "currency"
    | "id"
    | "is_available"
    | "price_amount"
    | "selected_by_default"
    | "sku"
    | "updated_at"
  >[];
  product_offer_links: {
    offers: Pick<
      Tables<"offers">,
      | "code"
      | "created_at"
      | "discount_percent"
      | "ends_at"
      | "id"
      | "label"
      | "min_quantity"
      | "starts_at"
      | "status"
      | "title"
      | "updated_at"
      | "value"
    > | null;
  }[];
};

export type AdminProductListInput = PaginationInput & {
  brandId?: string | null;
  categoryId?: string | null;
  q?: string | null;
  status?: PublishStatus | null;
};

const MEDIA_SELECT = "id,url,thumbnail_url,resource_type,alt_text,width,height";

const PRODUCT_SELECT = `
  id,
  slug,
  brand_id,
  category_id,
  title,
  badge,
  feature,
  tagline,
  description,
  rating,
  rating_count,
  status,
  seo_title,
  seo_description,
  created_at,
  updated_at,
  brands(id,slug,name),
  categories(id,slug,name,short_name),
  product_variants(
    id,
    sku,
    color_name,
    color_swatch,
    is_available,
    price_amount,
    compare_at_amount,
    currency,
    selected_by_default,
    created_at,
    updated_at
  ),
  product_media(
    id,
    role,
    sort_order,
    variant_id,
    created_at,
    media_assets(${MEDIA_SELECT})
  ),
  product_specifications(
    id,
    label,
    value,
    group_name,
    sort_order,
    created_at,
    updated_at
  ),
  product_offer_links(
    offers(
      id,
      label,
      title,
      value,
      code,
      min_quantity,
      discount_percent,
      starts_at,
      ends_at,
      status,
      created_at,
      updated_at
    )
  )
`;

export async function listAdminProducts(
  input: AdminProductListInput = {},
): Promise<AdminProductListData> {
  const pagination = getPagination(input);
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(pagination.from, pagination.to);

  if (input.status) {
    query = query.eq("status", input.status);
  }

  if (input.brandId) {
    query = query.eq("brand_id", input.brandId);
  }

  if (input.categoryId) {
    query = query.eq("category_id", input.categoryId);
  }

  if (input.q?.trim()) {
    const escaped = escapeSearchValue(input.q.trim());
    query = query.or(
      `title.ilike.%${escaped}%,slug.ilike.%${escaped}%,tagline.ilike.%${escaped}%,description.ilike.%${escaped}%`,
    );
  }

  const result = await query;
  if (result.error) throw result.error;

  const rows = (result.data ?? []) as unknown as ProductRow[];

  return {
    items: rows.map(mapProductRow),
    pagination: buildPaginationMeta({
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: result.count ?? rows.length,
    }),
  };
}

export async function getAdminProductById(
  id: string,
): Promise<AdminProduct | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle<ProductRow>();

  if (result.error) throw result.error;
  return result.data ? mapProductRow(result.data) : null;
}

export async function createAdminProduct(
  input: TablesInsert<"products">,
): Promise<AdminProduct> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("products")
    .insert(input)
    .select(PRODUCT_SELECT)
    .single<ProductRow>();

  if (result.error) throw result.error;
  return mapProductRow(result.data);
}

export async function updateAdminProduct(
  id: string,
  input: TablesUpdate<"products">,
): Promise<AdminProduct | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("products")
    .update(input)
    .eq("id", id)
    .select(PRODUCT_SELECT)
    .maybeSingle<ProductRow>();

  if (result.error) throw result.error;
  return result.data ? mapProductRow(result.data) : null;
}

export async function deleteAdminProduct(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (result.error) throw result.error;
  return Boolean(result.data);
}

const VARIANT_SELECT =
  "id,sku,color_name,color_swatch,is_available,price_amount,compare_at_amount,currency,selected_by_default,created_at,updated_at";

type VariantRow = ProductRow["product_variants"][number];

export async function getAdminProductVariantById(
  productId: string,
  variantId: string,
): Promise<AdminProductVariant | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("product_variants")
    .select(VARIANT_SELECT)
    .eq("product_id", productId)
    .eq("id", variantId)
    .maybeSingle<VariantRow>();

  if (result.error) throw result.error;
  return result.data ? mapVariantRow(result.data) : null;
}

export async function createAdminProductVariant(
  input: TablesInsert<"product_variants">,
): Promise<AdminProductVariant> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("product_variants")
    .insert(input)
    .select(VARIANT_SELECT)
    .single<VariantRow>();

  if (result.error) throw result.error;
  return mapVariantRow(result.data);
}

export async function updateAdminProductVariant(
  productId: string,
  variantId: string,
  input: TablesUpdate<"product_variants">,
): Promise<AdminProductVariant | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("product_variants")
    .update(input)
    .eq("product_id", productId)
    .eq("id", variantId)
    .select(VARIANT_SELECT)
    .maybeSingle<VariantRow>();

  if (result.error) throw result.error;
  return result.data ? mapVariantRow(result.data) : null;
}

export async function deleteAdminProductVariant(
  productId: string,
  variantId: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("product_variants")
    .delete()
    .eq("product_id", productId)
    .eq("id", variantId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (result.error) throw result.error;
  return Boolean(result.data);
}

const PRODUCT_MEDIA_SELECT = `
  id,
  role,
  sort_order,
  variant_id,
  created_at,
  media_assets(${MEDIA_SELECT})
`;

type ProductMediaRow = ProductRow["product_media"][number];

export async function getAdminProductMediaById(
  productId: string,
  productMediaId: string,
): Promise<AdminProductMedia | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("product_media")
    .select(PRODUCT_MEDIA_SELECT)
    .eq("product_id", productId)
    .eq("id", productMediaId)
    .maybeSingle<ProductMediaRow>();

  if (result.error) throw result.error;
  return result.data ? mapProductMediaRow(result.data) : null;
}

export async function createAdminProductMedia(
  input: TablesInsert<"product_media">,
): Promise<AdminProductMedia> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("product_media")
    .insert(input)
    .select(PRODUCT_MEDIA_SELECT)
    .single<ProductMediaRow>();

  if (result.error) throw result.error;
  return mapProductMediaRow(result.data);
}

export async function deleteAdminProductMedia(
  productId: string,
  productMediaId: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("product_media")
    .delete()
    .eq("product_id", productId)
    .eq("id", productMediaId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (result.error) throw result.error;
  return Boolean(result.data);
}

const SPECIFICATION_SELECT =
  "id,label,value,group_name,sort_order,created_at,updated_at";

type SpecificationRow = ProductRow["product_specifications"][number];

export async function getAdminProductSpecificationById(
  productId: string,
  specId: string,
): Promise<AdminProductSpecification | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("product_specifications")
    .select(SPECIFICATION_SELECT)
    .eq("product_id", productId)
    .eq("id", specId)
    .maybeSingle<SpecificationRow>();

  if (result.error) throw result.error;
  return result.data ? mapSpecificationRow(result.data) : null;
}

export async function createAdminProductSpecification(
  input: TablesInsert<"product_specifications">,
): Promise<AdminProductSpecification> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("product_specifications")
    .insert(input)
    .select(SPECIFICATION_SELECT)
    .single<SpecificationRow>();

  if (result.error) throw result.error;
  return mapSpecificationRow(result.data);
}

export async function updateAdminProductSpecification(
  productId: string,
  specId: string,
  input: TablesUpdate<"product_specifications">,
): Promise<AdminProductSpecification | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("product_specifications")
    .update(input)
    .eq("product_id", productId)
    .eq("id", specId)
    .select(SPECIFICATION_SELECT)
    .maybeSingle<SpecificationRow>();

  if (result.error) throw result.error;
  return result.data ? mapSpecificationRow(result.data) : null;
}

export async function deleteAdminProductSpecification(
  productId: string,
  specId: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("product_specifications")
    .delete()
    .eq("product_id", productId)
    .eq("id", specId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (result.error) throw result.error;
  return Boolean(result.data);
}

function mapProductRow(row: ProductRow): AdminProduct {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    brandId: row.brand_id,
    categoryId: row.category_id,
    brand: row.brands,
    category: row.categories
      ? {
          id: row.categories.id,
          name: row.categories.name,
          slug: row.categories.slug,
          shortName: row.categories.short_name,
        }
      : null,
    badge: row.badge,
    feature: row.feature,
    tagline: row.tagline,
    description: row.description,
    rating: Number(row.rating),
    ratingCount: row.rating_count,
    status: row.status,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    variants: (row.product_variants ?? [])
      .slice()
      .sort((a, b) => a.sku.localeCompare(b.sku))
      .map(mapVariantRow),
    media: (row.product_media ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapProductMediaRow),
    specifications: (row.product_specifications ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapSpecificationRow),
    offers: (row.product_offer_links ?? [])
      .map((link) => link.offers)
      .filter((offer): offer is NonNullable<typeof offer> => Boolean(offer))
      .map(mapOfferRow),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOfferRow(
  row: NonNullable<ProductRow["product_offer_links"][number]["offers"]>,
): AdminOffer {
  return {
    id: row.id,
    label: row.label,
    title: row.title,
    value: row.value,
    code: row.code,
    minQuantity: row.min_quantity,
    discountPercent:
      row.discount_percent === null ? null : Number(row.discount_percent),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVariantRow(
  row: ProductRow["product_variants"][number],
): AdminProductVariant {
  return {
    id: row.id,
    sku: row.sku,
    colorName: row.color_name,
    colorSwatch: row.color_swatch,
    isAvailable: row.is_available,
    priceAmount: row.price_amount,
    compareAtAmount: row.compare_at_amount,
    currency: row.currency,
    selectedByDefault: row.selected_by_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProductMediaRow(
  row: ProductRow["product_media"][number],
): AdminProductMedia {
  return {
    id: row.id,
    role: row.role,
    sortOrder: row.sort_order,
    variantId: row.variant_id,
    media: mapMedia(row.media_assets),
    createdAt: row.created_at,
  };
}

function mapSpecificationRow(
  row: ProductRow["product_specifications"][number],
): AdminProductSpecification {
  return {
    id: row.id,
    label: row.label,
    value: row.value,
    groupName: row.group_name,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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

function escapeSearchValue(value: string) {
  return value
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_")
    .replaceAll(",", " ");
}
