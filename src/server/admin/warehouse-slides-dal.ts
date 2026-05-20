import "server-only";

import {
  buildPaginationMeta,
  getPagination,
  type PaginationInput,
} from "@/server/http/pagination";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type {
  AdminMediaReference,
  AdminWarehouseSlide,
  AdminWarehouseSlideListData,
  MediaResourceType,
  PublishStatus,
} from "@/types/api";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

type EmbeddedMedia = Pick<
  Tables<"media_assets">,
  "alt_text" | "height" | "id" | "resource_type" | "thumbnail_url" | "url" | "width"
> | null;

type Row = Pick<
  Tables<"warehouse_slides">,
  | "created_at"
  | "href"
  | "id"
  | "media_id"
  | "sort_order"
  | "status"
  | "subtitle"
  | "title"
  | "updated_at"
> & { media_assets: EmbeddedMedia };

const MEDIA_FIELDS = "id,url,thumbnail_url,resource_type,alt_text,width,height";
const SELECT = `
  id,title,subtitle,href,media_id,status,sort_order,created_at,updated_at,
  media_assets(${MEDIA_FIELDS})
`;

export type AdminWarehouseSlideListInput = PaginationInput & {
  q?: string | null;
  status?: PublishStatus | null;
};

export async function listAdminWarehouseSlides(
  input: AdminWarehouseSlideListInput = {},
): Promise<AdminWarehouseSlideListData> {
  const pagination = getPagination(input);
  const s = await createSupabaseServerClient();
  let q = s
    .from("warehouse_slides")
    .select(SELECT, { count: "exact" })
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true })
    .range(pagination.from, pagination.to);
  if (input.status) q = q.eq("status", input.status);
  if (input.q?.trim()) {
    const e = escape(input.q.trim());
    q = q.or(`title.ilike.%${e}%,subtitle.ilike.%${e}%,href.ilike.%${e}%`);
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

export async function getAdminWarehouseSlideById(
  id: string,
): Promise<AdminWarehouseSlide | null> {
  const s = await createSupabaseServerClient();
  const r = await s
    .from("warehouse_slides")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle<Row>();
  if (r.error) throw r.error;
  return r.data ? map(r.data) : null;
}

export async function createAdminWarehouseSlide(
  input: TablesInsert<"warehouse_slides">,
): Promise<AdminWarehouseSlide> {
  const s = await createSupabaseServerClient();
  const r = await s
    .from("warehouse_slides")
    .insert(input)
    .select(SELECT)
    .single<Row>();
  if (r.error) throw r.error;
  return map(r.data);
}

export async function updateAdminWarehouseSlide(
  id: string,
  input: TablesUpdate<"warehouse_slides">,
): Promise<AdminWarehouseSlide | null> {
  const s = await createSupabaseServerClient();
  const r = await s
    .from("warehouse_slides")
    .update(input)
    .eq("id", id)
    .select(SELECT)
    .maybeSingle<Row>();
  if (r.error) throw r.error;
  return r.data ? map(r.data) : null;
}

export async function deleteAdminWarehouseSlide(id: string): Promise<boolean> {
  const s = await createSupabaseServerClient();
  const r = await s
    .from("warehouse_slides")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle<{ id: string }>();
  if (r.error) throw r.error;
  return Boolean(r.data);
}

function map(row: Row): AdminWarehouseSlide {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    href: row.href,
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
