import "server-only";

import {
  buildPaginationMeta,
  getPagination,
  type PaginationInput,
} from "@/server/http/pagination";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type {
  AdminBrandCollab,
  AdminBrandCollabListData,
  AdminMediaReference,
  MediaResourceType,
  PublishStatus,
} from "@/types/api";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

type EmbeddedMedia = Pick<
  Tables<"media_assets">,
  "alt_text" | "height" | "id" | "resource_type" | "thumbnail_url" | "url" | "width"
> | null;

type EmbeddedBrand = Pick<Tables<"brands">, "id" | "name" | "slug"> | null;

type Row = Pick<
  Tables<"brand_collabs">,
  | "brand_id"
  | "created_at"
  | "id"
  | "media_id"
  | "sort_order"
  | "status"
  | "subtitle"
  | "title"
  | "updated_at"
> & {
  brands: EmbeddedBrand;
  media_assets: EmbeddedMedia;
};

const MEDIA_FIELDS = "id,url,thumbnail_url,resource_type,alt_text,width,height";
const SELECT = `
  id,title,subtitle,brand_id,media_id,status,sort_order,created_at,updated_at,
  brands(id,name,slug),
  media_assets(${MEDIA_FIELDS})
`;

export type AdminBrandCollabListInput = PaginationInput & {
  q?: string | null;
  status?: PublishStatus | null;
  brandId?: string | null;
};

export async function listAdminBrandCollabs(
  input: AdminBrandCollabListInput = {},
): Promise<AdminBrandCollabListData> {
  const pagination = getPagination(input);
  const s = await createSupabaseServerClient();
  let q = s
    .from("brand_collabs")
    .select(SELECT, { count: "exact" })
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true })
    .range(pagination.from, pagination.to);
  if (input.status) q = q.eq("status", input.status);
  if (input.brandId) q = q.eq("brand_id", input.brandId);
  if (input.q?.trim()) {
    const e = escape(input.q.trim());
    q = q.or(`title.ilike.%${e}%,subtitle.ilike.%${e}%`);
  }
  const r = await q;
  if (r.error) throw r.error;
  const rows = (r.data ?? []) as unknown as Row[];
  return {
    items: rows.map(map),
    pagination: buildPaginationMeta({
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: r.count ?? rows.length,
    }),
  };
}

export async function getAdminBrandCollabById(
  id: string,
): Promise<AdminBrandCollab | null> {
  const s = await createSupabaseServerClient();
  const r = await s
    .from("brand_collabs")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle<Row>();
  if (r.error) throw r.error;
  return r.data ? map(r.data) : null;
}

export async function createAdminBrandCollab(
  input: TablesInsert<"brand_collabs">,
): Promise<AdminBrandCollab> {
  const s = await createSupabaseServerClient();
  const r = await s
    .from("brand_collabs")
    .insert(input)
    .select(SELECT)
    .single<Row>();
  if (r.error) throw r.error;
  return map(r.data);
}

export async function updateAdminBrandCollab(
  id: string,
  input: TablesUpdate<"brand_collabs">,
): Promise<AdminBrandCollab | null> {
  const s = await createSupabaseServerClient();
  const r = await s
    .from("brand_collabs")
    .update(input)
    .eq("id", id)
    .select(SELECT)
    .maybeSingle<Row>();
  if (r.error) throw r.error;
  return r.data ? map(r.data) : null;
}

export async function deleteAdminBrandCollab(id: string): Promise<boolean> {
  const s = await createSupabaseServerClient();
  const r = await s
    .from("brand_collabs")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle<{ id: string }>();
  if (r.error) throw r.error;
  return Boolean(r.data);
}

function map(row: Row): AdminBrandCollab {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    brandId: row.brand_id,
    brand: row.brands
      ? { id: row.brands.id, name: row.brands.name, slug: row.brands.slug }
      : null,
    mediaId: row.media_id,
    media: mapMedia(row.media_assets),
    status: row.status,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMedia(m: EmbeddedMedia): AdminMediaReference | null {
  if (!m) return null;
  return {
    id: m.id,
    url: m.url,
    thumbnailUrl: m.thumbnail_url,
    resourceType: m.resource_type as MediaResourceType,
    altText: m.alt_text,
    width: m.width,
    height: m.height,
  };
}

function escape(v: string) {
  return v.replaceAll("%", "\\%").replaceAll("_", "\\_").replaceAll(",", " ");
}
