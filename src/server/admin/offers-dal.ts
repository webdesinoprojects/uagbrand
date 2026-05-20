import "server-only";

import {
  buildPaginationMeta,
  getPagination,
  type PaginationInput,
} from "@/server/http/pagination";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type {
  AdminOffer,
  AdminOfferListData,
  PublishStatus,
} from "@/types/api";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

type OfferRow = Pick<
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
>;

const OFFER_SELECT =
  "id,label,title,value,code,min_quantity,discount_percent,starts_at,ends_at,status,created_at,updated_at";

export type AdminOfferListInput = PaginationInput & {
  q?: string | null;
  status?: PublishStatus | null;
  productId?: string | null;
};

export async function listAdminOffers(
  input: AdminOfferListInput = {},
): Promise<AdminOfferListData> {
  const pagination = getPagination(input);
  const supabase = await createSupabaseServerClient();

  if (input.productId) {
    return listAdminOffersForProduct(input.productId, pagination);
  }

  let query = supabase
    .from("offers")
    .select(OFFER_SELECT, { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(pagination.from, pagination.to);

  if (input.status) {
    query = query.eq("status", input.status);
  }

  if (input.q?.trim()) {
    const escaped = escapeSearchValue(input.q.trim());
    query = query.or(
      `title.ilike.%${escaped}%,value.ilike.%${escaped}%,label.ilike.%${escaped}%,code.ilike.%${escaped}%`,
    );
  }

  const result = await query;
  if (result.error) throw result.error;

  const rows = (result.data ?? []) as OfferRow[];

  return {
    items: rows.map(mapOfferRow),
    pagination: buildPaginationMeta({
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: result.count ?? rows.length,
    }),
  };
}

export async function getAdminOfferById(
  id: string,
): Promise<AdminOffer | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("offers")
    .select(OFFER_SELECT)
    .eq("id", id)
    .maybeSingle<OfferRow>();

  if (result.error) throw result.error;
  return result.data ? mapOfferRow(result.data) : null;
}

export async function createAdminOffer(
  input: TablesInsert<"offers">,
): Promise<AdminOffer> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("offers")
    .insert(input)
    .select(OFFER_SELECT)
    .single<OfferRow>();

  if (result.error) throw result.error;
  return mapOfferRow(result.data);
}

export async function updateAdminOffer(
  id: string,
  input: TablesUpdate<"offers">,
): Promise<AdminOffer | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("offers")
    .update(input)
    .eq("id", id)
    .select(OFFER_SELECT)
    .maybeSingle<OfferRow>();

  if (result.error) throw result.error;
  return result.data ? mapOfferRow(result.data) : null;
}

export async function deleteAdminOffer(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("offers")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (result.error) throw result.error;
  return Boolean(result.data);
}

export async function linkAdminOfferToProduct(
  productId: string,
  offerId: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("product_offer_links")
    .insert({ product_id: productId, offer_id: offerId });

  if (result.error) {
    throw result.error;
  }
}

export async function unlinkAdminOfferFromProduct(
  productId: string,
  offerId: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("product_offer_links")
    .delete()
    .eq("product_id", productId)
    .eq("offer_id", offerId)
    .select("offer_id")
    .maybeSingle<{ offer_id: string }>();

  if (result.error) throw result.error;
  return Boolean(result.data);
}

export async function getProductSlugById(
  productId: string,
): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .maybeSingle<{ slug: string }>();

  if (result.error) throw result.error;
  return result.data?.slug ?? null;
}

type ProductOfferLinkRow = {
  offers: OfferRow | null;
};

async function listAdminOffersForProduct(
  productId: string,
  pagination: ReturnType<typeof getPagination>,
): Promise<AdminOfferListData> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("product_offer_links")
    .select(`offers(${OFFER_SELECT})`, { count: "exact" })
    .eq("product_id", productId)
    .range(pagination.from, pagination.to);

  if (result.error) throw result.error;

  const rows = (result.data ?? []) as unknown as ProductOfferLinkRow[];
  const offers = rows
    .map((row) => row.offers)
    .filter((offer): offer is OfferRow => Boolean(offer))
    .map(mapOfferRow);

  return {
    items: offers,
    pagination: buildPaginationMeta({
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: result.count ?? offers.length,
    }),
  };
}

function mapOfferRow(row: OfferRow): AdminOffer {
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

function escapeSearchValue(value: string) {
  return value
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_")
    .replaceAll(",", " ");
}
