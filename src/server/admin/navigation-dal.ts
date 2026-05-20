import "server-only";

import {
  buildPaginationMeta,
  getPagination,
  type PaginationInput,
} from "@/server/http/pagination";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type {
  AdminNavigationItem,
  AdminNavigationListData,
  PublishStatus,
} from "@/types/api";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

type NavRow = Pick<
  Tables<"navigation_items">,
  | "created_at"
  | "href"
  | "id"
  | "label"
  | "location"
  | "parent_id"
  | "sort_order"
  | "status"
  | "updated_at"
>;

const NAV_SELECT =
  "id,location,parent_id,label,href,status,sort_order,created_at,updated_at";

export type AdminNavigationListInput = PaginationInput & {
  q?: string | null;
  status?: PublishStatus | null;
  location?: string | null;
  parentId?: string | null;
};

export async function listAdminNavigationItems(
  input: AdminNavigationListInput = {},
): Promise<AdminNavigationListData> {
  const pagination = getPagination(input);
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("navigation_items")
    .select(NAV_SELECT, { count: "exact" })
    .order("location", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true })
    .range(pagination.from, pagination.to);

  if (input.status) {
    query = query.eq("status", input.status);
  }

  if (input.location) {
    query = query.eq("location", input.location);
  }

  if (input.parentId === "root") {
    query = query.is("parent_id", null);
  } else if (input.parentId) {
    query = query.eq("parent_id", input.parentId);
  }

  if (input.q?.trim()) {
    const escaped = escapeSearchValue(input.q.trim());
    query = query.or(`label.ilike.%${escaped}%,href.ilike.%${escaped}%`);
  }

  const result = await query;
  if (result.error) throw result.error;

  const rows = (result.data ?? []) as NavRow[];

  return {
    items: rows.map(mapNavRow),
    pagination: buildPaginationMeta({
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: result.count ?? rows.length,
    }),
  };
}

export async function getAdminNavigationItemById(
  id: string,
): Promise<AdminNavigationItem | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("navigation_items")
    .select(NAV_SELECT)
    .eq("id", id)
    .maybeSingle<NavRow>();

  if (result.error) throw result.error;
  return result.data ? mapNavRow(result.data) : null;
}

export async function createAdminNavigationItem(
  input: TablesInsert<"navigation_items">,
): Promise<AdminNavigationItem> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("navigation_items")
    .insert(input)
    .select(NAV_SELECT)
    .single<NavRow>();

  if (result.error) throw result.error;
  return mapNavRow(result.data);
}

export async function updateAdminNavigationItem(
  id: string,
  input: TablesUpdate<"navigation_items">,
): Promise<AdminNavigationItem | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("navigation_items")
    .update(input)
    .eq("id", id)
    .select(NAV_SELECT)
    .maybeSingle<NavRow>();

  if (result.error) throw result.error;
  return result.data ? mapNavRow(result.data) : null;
}

export async function deleteAdminNavigationItem(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  // navigation_items.parent_id has on delete cascade — children are removed
  // automatically when a parent menu item is deleted.
  const result = await supabase
    .from("navigation_items")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (result.error) throw result.error;
  return Boolean(result.data);
}

function mapNavRow(row: NavRow): AdminNavigationItem {
  return {
    id: row.id,
    location: row.location,
    parentId: row.parent_id,
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
