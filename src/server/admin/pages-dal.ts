import "server-only";

import {
  buildPaginationMeta,
  getPagination,
  type PaginationInput,
} from "@/server/http/pagination";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type {
  AdminPage,
  AdminPageListData,
  PublishStatus,
} from "@/types/api";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

type PageRow = Pick<
  Tables<"pages">,
  | "body"
  | "created_at"
  | "excerpt"
  | "id"
  | "seo_description"
  | "seo_title"
  | "slug"
  | "status"
  | "title"
  | "updated_at"
>;

const PAGE_SELECT =
  "id,slug,title,excerpt,body,status,seo_title,seo_description,created_at,updated_at";

export type AdminPageListInput = PaginationInput & {
  q?: string | null;
  status?: PublishStatus | null;
};

export async function listAdminPages(
  input: AdminPageListInput = {},
): Promise<AdminPageListData> {
  const pagination = getPagination(input);
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("pages")
    .select(PAGE_SELECT, { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(pagination.from, pagination.to);

  if (input.status) {
    query = query.eq("status", input.status);
  }

  if (input.q?.trim()) {
    const escaped = escapeSearchValue(input.q.trim());
    query = query.or(
      `title.ilike.%${escaped}%,slug.ilike.%${escaped}%,excerpt.ilike.%${escaped}%`,
    );
  }

  const result = await query;
  if (result.error) throw result.error;

  const rows = (result.data ?? []) as PageRow[];

  return {
    items: rows.map(mapPageRow),
    pagination: buildPaginationMeta({
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: result.count ?? rows.length,
    }),
  };
}

export async function getAdminPageById(id: string): Promise<AdminPage | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("pages")
    .select(PAGE_SELECT)
    .eq("id", id)
    .maybeSingle<PageRow>();

  if (result.error) throw result.error;
  return result.data ? mapPageRow(result.data) : null;
}

export async function createAdminPage(
  input: TablesInsert<"pages">,
): Promise<AdminPage> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("pages")
    .insert(input)
    .select(PAGE_SELECT)
    .single<PageRow>();

  if (result.error) throw result.error;
  return mapPageRow(result.data);
}

export async function updateAdminPage(
  id: string,
  input: TablesUpdate<"pages">,
): Promise<AdminPage | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("pages")
    .update(input)
    .eq("id", id)
    .select(PAGE_SELECT)
    .maybeSingle<PageRow>();

  if (result.error) throw result.error;
  return result.data ? mapPageRow(result.data) : null;
}

export async function deleteAdminPage(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("pages")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (result.error) throw result.error;
  return Boolean(result.data);
}

function mapPageRow(row: PageRow): AdminPage {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    status: row.status,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
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
