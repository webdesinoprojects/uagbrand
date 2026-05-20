import "server-only";

import {
  buildPaginationMeta,
  getPagination,
  type PaginationInput,
} from "@/server/http/pagination";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type {
  AdminMediaAsset,
  AdminMediaListData,
  MediaResourceType,
} from "@/types/api";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

type MediaRow = Pick<
  Tables<"media_assets">,
  | "alt_text"
  | "bytes"
  | "created_at"
  | "duration_seconds"
  | "folder"
  | "height"
  | "id"
  | "metadata"
  | "mime_type"
  | "provider"
  | "provider_file_id"
  | "resource_type"
  | "thumbnail_url"
  | "updated_at"
  | "url"
  | "width"
>;

const MEDIA_SELECT =
  "id,provider,provider_file_id,url,thumbnail_url,resource_type,alt_text,width,height,duration_seconds,bytes,mime_type,folder,metadata,created_at,updated_at";

const RESOURCE_TYPES: MediaResourceType[] = ["image", "video", "gif", "file"];

export type AdminMediaListInput = PaginationInput & {
  folder?: string | null;
  resourceType?: MediaResourceType | null;
  q?: string | null;
};

export function parseResourceType(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return RESOURCE_TYPES.includes(value as MediaResourceType)
    ? (value as MediaResourceType)
    : null;
}

export async function listAdminMedia(
  input: AdminMediaListInput = {},
): Promise<AdminMediaListData> {
  const pagination = getPagination(input);
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("media_assets")
    .select(MEDIA_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(pagination.from, pagination.to);

  if (input.folder) {
    query = query.eq("folder", input.folder);
  }

  if (input.resourceType) {
    query = query.eq("resource_type", input.resourceType);
  }

  if (input.q?.trim()) {
    const escaped = escapeSearchValue(input.q.trim());
    query = query.or(
      `alt_text.ilike.%${escaped}%,folder.ilike.%${escaped}%,url.ilike.%${escaped}%`,
    );
  }

  const result = await query;

  if (result.error) {
    throw result.error;
  }

  const rows = (result.data ?? []) as MediaRow[];

  return {
    items: rows.map(mapMediaRow),
    pagination: buildPaginationMeta({
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: result.count ?? rows.length,
    }),
  };
}

export async function getAdminMediaById(
  id: string,
): Promise<AdminMediaAsset | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("media_assets")
    .select(MEDIA_SELECT)
    .eq("id", id)
    .maybeSingle<MediaRow>();

  if (result.error) {
    throw result.error;
  }

  return result.data ? mapMediaRow(result.data) : null;
}

export async function createAdminMedia(
  input: TablesInsert<"media_assets">,
): Promise<AdminMediaAsset> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("media_assets")
    .insert(input)
    .select(MEDIA_SELECT)
    .single<MediaRow>();

  if (result.error) {
    throw result.error;
  }

  return mapMediaRow(result.data);
}

export async function updateAdminMedia(
  id: string,
  input: TablesUpdate<"media_assets">,
): Promise<AdminMediaAsset | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("media_assets")
    .update(input)
    .eq("id", id)
    .select(MEDIA_SELECT)
    .maybeSingle<MediaRow>();

  if (result.error) {
    throw result.error;
  }

  return result.data ? mapMediaRow(result.data) : null;
}

export async function deleteAdminMedia(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("media_assets")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (result.error) {
    throw result.error;
  }

  return Boolean(result.data);
}

function mapMediaRow(row: MediaRow): AdminMediaAsset {
  return {
    id: row.id,
    provider: row.provider,
    providerFileId: row.provider_file_id,
    url: row.url,
    thumbnailUrl: row.thumbnail_url,
    resourceType: row.resource_type as MediaResourceType,
    altText: row.alt_text,
    width: row.width,
    height: row.height,
    durationSeconds:
      row.duration_seconds === null ? null : Number(row.duration_seconds),
    bytes: row.bytes === null ? null : Number(row.bytes),
    mimeType: row.mime_type,
    folder: row.folder,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function escapeSearchValue(value: string) {
  return value
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_")
    .replaceAll(",", " ");
}
