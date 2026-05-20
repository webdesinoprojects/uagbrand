import "server-only";

import {
  buildPaginationMeta,
  getPagination,
  type PaginationInput,
} from "@/server/http/pagination";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type {
  AdminHeroSlide,
  AdminHeroSlideListData,
  AdminMediaReference,
  MediaResourceType,
  PublishStatus,
} from "@/types/api";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

type EmbeddedMedia = Pick<
  Tables<"media_assets">,
  "alt_text" | "height" | "id" | "resource_type" | "thumbnail_url" | "url" | "width"
> | null;

type Row = Pick<
  Tables<"hero_slides">,
  | "created_at"
  | "cta_label"
  | "description"
  | "ends_at"
  | "eyebrow"
  | "href"
  | "id"
  | "media_id"
  | "offer"
  | "sort_order"
  | "starts_at"
  | "status"
  | "title"
  | "updated_at"
> & { media_assets: EmbeddedMedia };

const MEDIA_FIELDS = "id,url,thumbnail_url,resource_type,alt_text,width,height";
const SELECT = `
  id,title,eyebrow,description,offer,cta_label,href,media_id,status,sort_order,
  starts_at,ends_at,created_at,updated_at,
  media_assets(${MEDIA_FIELDS})
`;

export type AdminHeroSlideListInput = PaginationInput & {
  q?: string | null;
  status?: PublishStatus | null;
};

export async function listAdminHeroSlides(
  input: AdminHeroSlideListInput = {},
): Promise<AdminHeroSlideListData> {
  const pagination = getPagination(input);
  const s = await createSupabaseServerClient();
  let q = s
    .from("hero_slides")
    .select(SELECT, { count: "exact" })
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true })
    .range(pagination.from, pagination.to);
  if (input.status) q = q.eq("status", input.status);
  if (input.q?.trim()) {
    const e = escape(input.q.trim());
    q = q.or(
      `title.ilike.%${e}%,eyebrow.ilike.%${e}%,description.ilike.%${e}%,offer.ilike.%${e}%`,
    );
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

export async function getAdminHeroSlideById(
  id: string,
): Promise<AdminHeroSlide | null> {
  const s = await createSupabaseServerClient();
  const r = await s.from("hero_slides").select(SELECT).eq("id", id).maybeSingle<Row>();
  if (r.error) throw r.error;
  return r.data ? map(r.data) : null;
}

export async function createAdminHeroSlide(
  input: TablesInsert<"hero_slides">,
): Promise<AdminHeroSlide> {
  const s = await createSupabaseServerClient();
  const r = await s.from("hero_slides").insert(input).select(SELECT).single<Row>();
  if (r.error) throw r.error;
  return map(r.data);
}

export async function updateAdminHeroSlide(
  id: string,
  input: TablesUpdate<"hero_slides">,
): Promise<AdminHeroSlide | null> {
  const s = await createSupabaseServerClient();
  const r = await s
    .from("hero_slides")
    .update(input)
    .eq("id", id)
    .select(SELECT)
    .maybeSingle<Row>();
  if (r.error) throw r.error;
  return r.data ? map(r.data) : null;
}

export async function deleteAdminHeroSlide(id: string): Promise<boolean> {
  const s = await createSupabaseServerClient();
  const r = await s
    .from("hero_slides")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle<{ id: string }>();
  if (r.error) throw r.error;
  return Boolean(r.data);
}

function map(row: Row): AdminHeroSlide {
  return {
    id: row.id,
    title: row.title,
    eyebrow: row.eyebrow,
    description: row.description,
    offer: row.offer,
    ctaLabel: row.cta_label,
    href: row.href,
    mediaId: row.media_id,
    media: mapMedia(row.media_assets),
    status: row.status,
    sortOrder: row.sort_order,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
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
