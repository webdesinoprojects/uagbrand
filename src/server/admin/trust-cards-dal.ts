import "server-only";

import {
  buildPaginationMeta,
  getPagination,
  type PaginationInput,
} from "@/server/http/pagination";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type {
  AdminTrustCard,
  AdminTrustCardListData,
  PublishStatus,
} from "@/types/api";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

type Row = Pick<
  Tables<"trust_cards">,
  | "created_at"
  | "description"
  | "id"
  | "metric"
  | "sort_order"
  | "status"
  | "title"
  | "updated_at"
>;

const SELECT =
  "id,title,description,metric,status,sort_order,created_at,updated_at";

export type AdminTrustCardListInput = PaginationInput & {
  q?: string | null;
  status?: PublishStatus | null;
};

export async function listAdminTrustCards(
  input: AdminTrustCardListInput = {},
): Promise<AdminTrustCardListData> {
  const pagination = getPagination(input);
  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("trust_cards")
    .select(SELECT, { count: "exact" })
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true })
    .range(pagination.from, pagination.to);
  if (input.status) q = q.eq("status", input.status);
  if (input.q?.trim()) {
    const e = escape(input.q.trim());
    q = q.or(`title.ilike.%${e}%,description.ilike.%${e}%,metric.ilike.%${e}%`);
  }
  const r = await q;
  if (r.error) throw r.error;
  const rows = (r.data ?? []) as Row[];
  return {
    items: rows.map(map),
    pagination: buildPaginationMeta({
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: r.count ?? rows.length,
    }),
  };
}

export async function getAdminTrustCardById(
  id: string,
): Promise<AdminTrustCard | null> {
  const s = await createSupabaseServerClient();
  const r = await s.from("trust_cards").select(SELECT).eq("id", id).maybeSingle<Row>();
  if (r.error) throw r.error;
  return r.data ? map(r.data) : null;
}

export async function createAdminTrustCard(
  input: TablesInsert<"trust_cards">,
): Promise<AdminTrustCard> {
  const s = await createSupabaseServerClient();
  const r = await s.from("trust_cards").insert(input).select(SELECT).single<Row>();
  if (r.error) throw r.error;
  return map(r.data);
}

export async function updateAdminTrustCard(
  id: string,
  input: TablesUpdate<"trust_cards">,
): Promise<AdminTrustCard | null> {
  const s = await createSupabaseServerClient();
  const r = await s
    .from("trust_cards")
    .update(input)
    .eq("id", id)
    .select(SELECT)
    .maybeSingle<Row>();
  if (r.error) throw r.error;
  return r.data ? map(r.data) : null;
}

export async function deleteAdminTrustCard(id: string): Promise<boolean> {
  const s = await createSupabaseServerClient();
  const r = await s
    .from("trust_cards")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle<{ id: string }>();
  if (r.error) throw r.error;
  return Boolean(r.data);
}

function map(row: Row): AdminTrustCard {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    metric: row.metric,
    status: row.status,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function escape(v: string) {
  return v.replaceAll("%", "\\%").replaceAll("_", "\\_").replaceAll(",", " ");
}
