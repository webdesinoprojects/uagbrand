import "server-only";

import {
  buildPaginationMeta,
  getPagination,
  type PaginationInput,
} from "@/server/http/pagination";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type {
  AdminFooterColumn,
  AdminFooterColumnListData,
  AdminFooterLink,
  AdminFooterLinkListData,
  PublishStatus,
} from "@/types/api";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

type ColumnRow = Pick<
  Tables<"footer_columns">,
  "created_at" | "id" | "sort_order" | "status" | "title" | "updated_at"
>;

type LinkRow = Pick<
  Tables<"footer_links">,
  | "column_id"
  | "created_at"
  | "href"
  | "id"
  | "label"
  | "sort_order"
  | "status"
  | "updated_at"
>;

const COLUMN_SELECT = "id,title,status,sort_order,created_at,updated_at";
const LINK_SELECT =
  "id,column_id,label,href,status,sort_order,created_at,updated_at";

export type AdminFooterColumnListInput = PaginationInput & {
  q?: string | null;
  status?: PublishStatus | null;
};

export async function listAdminFooterColumns(
  input: AdminFooterColumnListInput = {},
): Promise<AdminFooterColumnListData> {
  const pagination = getPagination(input);
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("footer_columns")
    .select(COLUMN_SELECT, { count: "exact" })
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true })
    .range(pagination.from, pagination.to);

  if (input.status) {
    query = query.eq("status", input.status);
  }

  if (input.q?.trim()) {
    const escaped = escapeSearchValue(input.q.trim());
    query = query.ilike("title", `%${escaped}%`);
  }

  const result = await query;
  if (result.error) throw result.error;

  const rows = (result.data ?? []) as ColumnRow[];

  return {
    items: rows.map(mapColumnRow),
    pagination: buildPaginationMeta({
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: result.count ?? rows.length,
    }),
  };
}

export async function getAdminFooterColumnById(
  id: string,
): Promise<AdminFooterColumn | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("footer_columns")
    .select(COLUMN_SELECT)
    .eq("id", id)
    .maybeSingle<ColumnRow>();

  if (result.error) throw result.error;
  return result.data ? mapColumnRow(result.data) : null;
}

export async function createAdminFooterColumn(
  input: TablesInsert<"footer_columns">,
): Promise<AdminFooterColumn> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("footer_columns")
    .insert(input)
    .select(COLUMN_SELECT)
    .single<ColumnRow>();

  if (result.error) throw result.error;
  return mapColumnRow(result.data);
}

export async function updateAdminFooterColumn(
  id: string,
  input: TablesUpdate<"footer_columns">,
): Promise<AdminFooterColumn | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("footer_columns")
    .update(input)
    .eq("id", id)
    .select(COLUMN_SELECT)
    .maybeSingle<ColumnRow>();

  if (result.error) throw result.error;
  return result.data ? mapColumnRow(result.data) : null;
}

export async function deleteAdminFooterColumn(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  // footer_links.column_id has on delete cascade — links removed automatically.
  const result = await supabase
    .from("footer_columns")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (result.error) throw result.error;
  return Boolean(result.data);
}

export type AdminFooterLinkListInput = PaginationInput & {
  q?: string | null;
  status?: PublishStatus | null;
};

export async function listAdminFooterLinksForColumn(
  columnId: string,
  input: AdminFooterLinkListInput = {},
): Promise<AdminFooterLinkListData> {
  const pagination = getPagination(input);
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("footer_links")
    .select(LINK_SELECT, { count: "exact" })
    .eq("column_id", columnId)
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true })
    .range(pagination.from, pagination.to);

  if (input.status) {
    query = query.eq("status", input.status);
  }

  if (input.q?.trim()) {
    const escaped = escapeSearchValue(input.q.trim());
    query = query.or(`label.ilike.%${escaped}%,href.ilike.%${escaped}%`);
  }

  const result = await query;
  if (result.error) throw result.error;

  const rows = (result.data ?? []) as LinkRow[];

  return {
    items: rows.map(mapLinkRow),
    pagination: buildPaginationMeta({
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: result.count ?? rows.length,
    }),
  };
}

export async function getAdminFooterLinkById(
  columnId: string,
  linkId: string,
): Promise<AdminFooterLink | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("footer_links")
    .select(LINK_SELECT)
    .eq("column_id", columnId)
    .eq("id", linkId)
    .maybeSingle<LinkRow>();

  if (result.error) throw result.error;
  return result.data ? mapLinkRow(result.data) : null;
}

export async function createAdminFooterLink(
  input: TablesInsert<"footer_links">,
): Promise<AdminFooterLink> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("footer_links")
    .insert(input)
    .select(LINK_SELECT)
    .single<LinkRow>();

  if (result.error) throw result.error;
  return mapLinkRow(result.data);
}

export async function updateAdminFooterLink(
  columnId: string,
  linkId: string,
  input: TablesUpdate<"footer_links">,
): Promise<AdminFooterLink | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("footer_links")
    .update(input)
    .eq("column_id", columnId)
    .eq("id", linkId)
    .select(LINK_SELECT)
    .maybeSingle<LinkRow>();

  if (result.error) throw result.error;
  return result.data ? mapLinkRow(result.data) : null;
}

export async function deleteAdminFooterLink(
  columnId: string,
  linkId: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("footer_links")
    .delete()
    .eq("column_id", columnId)
    .eq("id", linkId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (result.error) throw result.error;
  return Boolean(result.data);
}

function mapColumnRow(row: ColumnRow): AdminFooterColumn {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLinkRow(row: LinkRow): AdminFooterLink {
  return {
    id: row.id,
    columnId: row.column_id,
    label: row.label,
    href: row.href,
    status: row.status,
    sortOrder: row.sort_order,
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
