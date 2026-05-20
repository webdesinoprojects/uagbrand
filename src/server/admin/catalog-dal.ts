import "server-only";

import {
  buildPaginationMeta,
  getPagination,
  type PaginationInput,
} from "@/server/http/pagination";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type {
  AdminBrand,
  AdminBrandListData,
  AdminCategory,
  AdminCategoryListData,
  AdminMediaReference,
  MediaResourceType,
  PublishStatus,
} from "@/types/api";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

type EmbeddedMedia = Pick<
  Tables<"media_assets">,
  "alt_text" | "height" | "id" | "resource_type" | "thumbnail_url" | "url" | "width"
> | null;

type BrandRow = Pick<
  Tables<"brands">,
  | "created_at"
  | "deal"
  | "id"
  | "logo_media_id"
  | "name"
  | "seo_description"
  | "seo_title"
  | "slug"
  | "sort_order"
  | "status"
  | "updated_at"
> & {
  logo: EmbeddedMedia;
};

type CategoryRow = Pick<
  Tables<"categories">,
  | "created_at"
  | "description"
  | "hover_media_id"
  | "id"
  | "image_media_id"
  | "name"
  | "seo_description"
  | "seo_title"
  | "short_name"
  | "slug"
  | "sort_order"
  | "status"
  | "updated_at"
> & {
  hover_media: EmbeddedMedia;
  image: EmbeddedMedia;
};

export type AdminCatalogListInput = PaginationInput & {
  q?: string | null;
  status?: PublishStatus | null;
};

const MEDIA_SELECT = "id,url,thumbnail_url,resource_type,alt_text,width,height";

const BRAND_SELECT = `
  id,
  name,
  slug,
  deal,
  logo_media_id,
  status,
  sort_order,
  seo_title,
  seo_description,
  created_at,
  updated_at,
  logo:media_assets!brands_logo_media_id_fkey(${MEDIA_SELECT})
`;

const CATEGORY_SELECT = `
  id,
  name,
  slug,
  short_name,
  description,
  image_media_id,
  hover_media_id,
  status,
  sort_order,
  seo_title,
  seo_description,
  created_at,
  updated_at,
  image:media_assets!categories_image_media_id_fkey(${MEDIA_SELECT}),
  hover_media:media_assets!categories_hover_media_id_fkey(${MEDIA_SELECT})
`;

export async function listAdminBrands(
  input: AdminCatalogListInput = {},
): Promise<AdminBrandListData> {
  const pagination = getPagination(input);
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("brands")
    .select(BRAND_SELECT, { count: "exact" })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .range(pagination.from, pagination.to);

  if (input.status) {
    query = query.eq("status", input.status);
  }

  if (input.q?.trim()) {
    const escaped = escapeSearchValue(input.q.trim());
    query = query.or(
      `name.ilike.%${escaped}%,slug.ilike.%${escaped}%,deal.ilike.%${escaped}%`,
    );
  }

  const result = await query;
  if (result.error) throw result.error;

  const rows = (result.data ?? []) as unknown as BrandRow[];

  return {
    items: rows.map(mapBrandRow),
    pagination: buildPaginationMeta({
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: result.count ?? rows.length,
    }),
  };
}

export async function getAdminBrandById(id: string): Promise<AdminBrand | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("brands")
    .select(BRAND_SELECT)
    .eq("id", id)
    .maybeSingle<BrandRow>();

  if (result.error) throw result.error;
  return result.data ? mapBrandRow(result.data) : null;
}

export async function createAdminBrand(
  input: TablesInsert<"brands">,
): Promise<AdminBrand> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("brands")
    .insert(input)
    .select(BRAND_SELECT)
    .single<BrandRow>();

  if (result.error) throw result.error;
  return mapBrandRow(result.data);
}

export async function updateAdminBrand(
  id: string,
  input: TablesUpdate<"brands">,
): Promise<AdminBrand | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("brands")
    .update(input)
    .eq("id", id)
    .select(BRAND_SELECT)
    .maybeSingle<BrandRow>();

  if (result.error) throw result.error;
  return result.data ? mapBrandRow(result.data) : null;
}

export async function deleteAdminBrand(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("brands")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (result.error) throw result.error;
  return Boolean(result.data);
}

export async function listAdminCategories(
  input: AdminCatalogListInput = {},
): Promise<AdminCategoryListData> {
  const pagination = getPagination(input);
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("categories")
    .select(CATEGORY_SELECT, { count: "exact" })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .range(pagination.from, pagination.to);

  if (input.status) {
    query = query.eq("status", input.status);
  }

  if (input.q?.trim()) {
    const escaped = escapeSearchValue(input.q.trim());
    query = query.or(
      `name.ilike.%${escaped}%,short_name.ilike.%${escaped}%,slug.ilike.%${escaped}%,description.ilike.%${escaped}%`,
    );
  }

  const result = await query;
  if (result.error) throw result.error;

  const rows = (result.data ?? []) as unknown as CategoryRow[];

  return {
    items: rows.map(mapCategoryRow),
    pagination: buildPaginationMeta({
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: result.count ?? rows.length,
    }),
  };
}

export async function getAdminCategoryById(
  id: string,
): Promise<AdminCategory | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("categories")
    .select(CATEGORY_SELECT)
    .eq("id", id)
    .maybeSingle<CategoryRow>();

  if (result.error) throw result.error;
  return result.data ? mapCategoryRow(result.data) : null;
}

export async function createAdminCategory(
  input: TablesInsert<"categories">,
): Promise<AdminCategory> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("categories")
    .insert(input)
    .select(CATEGORY_SELECT)
    .single<CategoryRow>();

  if (result.error) throw result.error;
  return mapCategoryRow(result.data);
}

export async function updateAdminCategory(
  id: string,
  input: TablesUpdate<"categories">,
): Promise<AdminCategory | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("categories")
    .update(input)
    .eq("id", id)
    .select(CATEGORY_SELECT)
    .maybeSingle<CategoryRow>();

  if (result.error) throw result.error;
  return result.data ? mapCategoryRow(result.data) : null;
}

export async function deleteAdminCategory(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (result.error) throw result.error;
  return Boolean(result.data);
}

function mapBrandRow(row: BrandRow): AdminBrand {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    deal: row.deal,
    logoMediaId: row.logo_media_id,
    logo: mapMedia(row.logo),
    status: row.status,
    sortOrder: row.sort_order,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCategoryRow(row: CategoryRow): AdminCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    shortName: row.short_name,
    description: row.description,
    imageMediaId: row.image_media_id,
    hoverMediaId: row.hover_media_id,
    image: mapMedia(row.image),
    hoverMedia: mapMedia(row.hover_media),
    status: row.status,
    sortOrder: row.sort_order,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
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
