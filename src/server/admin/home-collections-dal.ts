import "server-only";

import {
  buildPaginationMeta,
  getPagination,
  type PaginationInput,
} from "@/server/http/pagination";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type {
  AdminCollectionItem,
  AdminCollectionItemListData,
  AdminHomeCollection,
  AdminHomeCollectionListData,
  AdminMediaReference,
  MediaResourceType,
  PublishStatus,
} from "@/types/api";
import type { Json, Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

type EmbeddedMedia = Pick<
  Tables<"media_assets">,
  "alt_text" | "height" | "id" | "resource_type" | "thumbnail_url" | "url" | "width"
> | null;

type EmbeddedProduct = Pick<Tables<"products">, "id" | "slug" | "title"> | null;

type CollectionRow = Pick<
  Tables<"home_collections">,
  | "created_at"
  | "description"
  | "id"
  | "key"
  | "sort_order"
  | "status"
  | "title"
  | "updated_at"
> & {
  collection_items: { id: string }[];
};

type ItemRow = Pick<
  Tables<"collection_items">,
  | "badge"
  | "collection_id"
  | "created_at"
  | "feature"
  | "href"
  | "id"
  | "media_id"
  | "payload"
  | "product_id"
  | "sort_order"
  | "status"
  | "title"
  | "updated_at"
> & {
  products: EmbeddedProduct;
  media_assets: EmbeddedMedia;
};

const COLLECTION_SELECT = `
  id,key,title,description,status,sort_order,created_at,updated_at,
  collection_items(id)
`;

const MEDIA_FIELDS = "id,url,thumbnail_url,resource_type,alt_text,width,height";
const ITEM_SELECT = `
  id,collection_id,product_id,title,badge,feature,href,media_id,payload,status,sort_order,created_at,updated_at,
  products(id,slug,title),
  media_assets(${MEDIA_FIELDS})
`;

export type AdminHomeCollectionListInput = PaginationInput & {
  q?: string | null;
  status?: PublishStatus | null;
};

export async function listAdminHomeCollections(
  input: AdminHomeCollectionListInput = {},
): Promise<AdminHomeCollectionListData> {
  const pagination = getPagination(input);
  const s = await createSupabaseServerClient();
  let q = s
    .from("home_collections")
    .select(COLLECTION_SELECT, { count: "exact" })
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true })
    .range(pagination.from, pagination.to);
  if (input.status) q = q.eq("status", input.status);
  if (input.q?.trim()) {
    const e = escape(input.q.trim());
    q = q.or(`title.ilike.%${e}%,key.ilike.%${e}%,description.ilike.%${e}%`);
  }
  const r = await q;
  if (r.error) throw r.error;
  const rows = (r.data ?? []) as CollectionRow[];
  return {
    items: rows.map(mapCollection),
    pagination: buildPaginationMeta({
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: r.count ?? rows.length,
    }),
  };
}

export async function getAdminHomeCollectionById(
  id: string,
): Promise<AdminHomeCollection | null> {
  const s = await createSupabaseServerClient();
  const r = await s
    .from("home_collections")
    .select(COLLECTION_SELECT)
    .eq("id", id)
    .maybeSingle<CollectionRow>();
  if (r.error) throw r.error;
  return r.data ? mapCollection(r.data) : null;
}

export async function createAdminHomeCollection(
  input: TablesInsert<"home_collections">,
): Promise<AdminHomeCollection> {
  const s = await createSupabaseServerClient();
  const r = await s
    .from("home_collections")
    .insert(input)
    .select(COLLECTION_SELECT)
    .single<CollectionRow>();
  if (r.error) throw r.error;
  return mapCollection(r.data);
}

export async function updateAdminHomeCollection(
  id: string,
  input: TablesUpdate<"home_collections">,
): Promise<AdminHomeCollection | null> {
  const s = await createSupabaseServerClient();
  const r = await s
    .from("home_collections")
    .update(input)
    .eq("id", id)
    .select(COLLECTION_SELECT)
    .maybeSingle<CollectionRow>();
  if (r.error) throw r.error;
  return r.data ? mapCollection(r.data) : null;
}

export async function deleteAdminHomeCollection(id: string): Promise<boolean> {
  const s = await createSupabaseServerClient();
  // collection_items.collection_id has on delete cascade in migration 001.
  const r = await s
    .from("home_collections")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle<{ id: string }>();
  if (r.error) throw r.error;
  return Boolean(r.data);
}

export type AdminCollectionItemListInput = PaginationInput & {
  q?: string | null;
  status?: PublishStatus | null;
};

export async function listAdminCollectionItems(
  collectionId: string,
  input: AdminCollectionItemListInput = {},
): Promise<AdminCollectionItemListData> {
  const pagination = getPagination(input);
  const s = await createSupabaseServerClient();
  let q = s
    .from("collection_items")
    .select(ITEM_SELECT, { count: "exact" })
    .eq("collection_id", collectionId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .range(pagination.from, pagination.to);
  if (input.status) q = q.eq("status", input.status);
  if (input.q?.trim()) {
    const e = escape(input.q.trim());
    q = q.or(`title.ilike.%${e}%,badge.ilike.%${e}%,feature.ilike.%${e}%,href.ilike.%${e}%`);
  }
  const r = await q;
  if (r.error) throw r.error;
  const rows = (r.data ?? []) as unknown as ItemRow[];
  return {
    items: rows.map(mapItem),
    pagination: buildPaginationMeta({
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: r.count ?? rows.length,
    }),
  };
}

export async function getAdminCollectionItemById(
  collectionId: string,
  itemId: string,
): Promise<AdminCollectionItem | null> {
  const s = await createSupabaseServerClient();
  const r = await s
    .from("collection_items")
    .select(ITEM_SELECT)
    .eq("collection_id", collectionId)
    .eq("id", itemId)
    .maybeSingle<ItemRow>();
  if (r.error) throw r.error;
  return r.data ? mapItem(r.data) : null;
}

export async function createAdminCollectionItem(
  input: TablesInsert<"collection_items">,
): Promise<AdminCollectionItem> {
  const s = await createSupabaseServerClient();
  const r = await s
    .from("collection_items")
    .insert(input)
    .select(ITEM_SELECT)
    .single<ItemRow>();
  if (r.error) throw r.error;
  return mapItem(r.data);
}

export async function updateAdminCollectionItem(
  collectionId: string,
  itemId: string,
  input: TablesUpdate<"collection_items">,
): Promise<AdminCollectionItem | null> {
  const s = await createSupabaseServerClient();
  const r = await s
    .from("collection_items")
    .update(input)
    .eq("collection_id", collectionId)
    .eq("id", itemId)
    .select(ITEM_SELECT)
    .maybeSingle<ItemRow>();
  if (r.error) throw r.error;
  return r.data ? mapItem(r.data) : null;
}

export async function deleteAdminCollectionItem(
  collectionId: string,
  itemId: string,
): Promise<boolean> {
  const s = await createSupabaseServerClient();
  const r = await s
    .from("collection_items")
    .delete()
    .eq("collection_id", collectionId)
    .eq("id", itemId)
    .select("id")
    .maybeSingle<{ id: string }>();
  if (r.error) throw r.error;
  return Boolean(r.data);
}

function mapCollection(row: CollectionRow): AdminHomeCollection {
  return {
    id: row.id,
    key: row.key,
    title: row.title,
    description: row.description,
    status: row.status,
    sortOrder: row.sort_order,
    itemCount: (row.collection_items ?? []).length,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapItem(row: ItemRow): AdminCollectionItem {
  return {
    id: row.id,
    collectionId: row.collection_id,
    productId: row.product_id,
    product: row.products
      ? { id: row.products.id, slug: row.products.slug, title: row.products.title }
      : null,
    title: row.title,
    badge: row.badge,
    feature: row.feature,
    href: row.href,
    mediaId: row.media_id,
    media: mapMedia(row.media_assets),
    payload: row.payload as unknown,
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

export function asJsonObject(value: unknown): Json {
  if (value === undefined || value === null) return {} as Json;
  return JSON.parse(JSON.stringify(value)) as Json;
}

function escape(v: string) {
  return v.replaceAll("%", "\\%").replaceAll("_", "\\_").replaceAll(",", " ");
}
