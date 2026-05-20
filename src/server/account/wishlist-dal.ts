import "server-only";

import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { WishlistData, WishlistItemData } from "@/types/api";
import type { Tables } from "@/types/supabase";

export class WishlistOperationError extends Error {
  constructor(
    public readonly kind: "not_found" | "conflict",
    message: string,
  ) {
    super(message);
    this.name = "WishlistOperationError";
  }
}

type WishlistRow = Pick<
  Tables<"wishlist_items">,
  "id" | "product_id" | "created_at"
>;

type ProductRow = Pick<Tables<"products">, "id" | "slug" | "title" | "status">;

type VariantRow = Pick<
  Tables<"product_variants">,
  | "id"
  | "product_id"
  | "is_available"
  | "price_amount"
  | "compare_at_amount"
  | "currency"
  | "selected_by_default"
>;

type MediaReferenceRow = {
  product_id: string;
  sort_order: number;
  media: {
    url: string;
    thumbnail_url: string | null;
    alt_text: string | null;
  } | null;
};

export async function listWishlist(userId: string): Promise<WishlistData> {
  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("wishlist_items")
    .select("id,product_id,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (result.error) {
    throw result.error;
  }

  return buildWishlistData((result.data ?? []) as WishlistRow[]);
}

export async function addWishlistItem(userId: string, productId: string) {
  await ensurePublishedProduct(productId);

  const admin = createSupabaseAdminClient();
  const inserted = await admin
    .from("wishlist_items")
    .insert({ user_id: userId, product_id: productId })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (inserted.error && !isUniqueViolation(inserted.error)) {
    throw inserted.error;
  }

  const result = await admin
    .from("wishlist_items")
    .select("id,product_id,created_at")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .single<WishlistRow>();

  if (result.error) {
    throw result.error;
  }

  const data = await buildWishlistData([result.data]);
  return data.items[0];
}

export async function deleteWishlistItem(userId: string, itemId: string) {
  const admin = createSupabaseAdminClient();
  const existing = await admin
    .from("wishlist_items")
    .select("id")
    .eq("id", itemId)
    .eq("user_id", userId)
    .maybeSingle<{ id: string }>();

  if (existing.error) {
    throw existing.error;
  }

  if (!existing.data) {
    throw new WishlistOperationError("not_found", "We could not find that wishlist item.");
  }

  const deleted = await admin
    .from("wishlist_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", userId);

  if (deleted.error) {
    throw deleted.error;
  }

  return { id: itemId, deleted: true };
}

async function ensurePublishedProduct(productId: string) {
  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("status", "published")
    .maybeSingle<{ id: string }>();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    throw new WishlistOperationError("not_found", "We could not find that product.");
  }
}

async function buildWishlistData(rows: WishlistRow[]): Promise<WishlistData> {
  if (rows.length === 0) {
    return { items: [] };
  }

  const admin = createSupabaseAdminClient();
  const productIds = Array.from(new Set(rows.map((row) => row.product_id)));
  const [productsResult, variantsResult, mediaResult] = await Promise.all([
    admin
      .from("products")
      .select("id,slug,title,status")
      .in("id", productIds),
    admin
      .from("product_variants")
      .select(
        "id,product_id,is_available,price_amount,compare_at_amount,currency,selected_by_default",
      )
      .in("product_id", productIds)
      .order("selected_by_default", { ascending: false }),
    admin
      .from("product_media")
      .select("product_id,sort_order,media:media_assets(url,thumbnail_url,alt_text)")
      .in("product_id", productIds)
      .order("sort_order", { ascending: true }),
  ]);

  if (productsResult.error) {
    throw productsResult.error;
  }

  if (variantsResult.error) {
    throw variantsResult.error;
  }

  if (mediaResult.error) {
    throw mediaResult.error;
  }

  const productsById = new Map(
    ((productsResult.data ?? []) as ProductRow[]).map((product) => [product.id, product]),
  );
  const variantsByProductId = new Map<string, VariantRow[]>();

  for (const variant of (variantsResult.data ?? []) as VariantRow[]) {
    const variants = variantsByProductId.get(variant.product_id) ?? [];
    variants.push(variant);
    variantsByProductId.set(variant.product_id, variants);
  }

  const mediaByProductId = new Map<string, MediaReferenceRow["media"]>();
  for (const mediaRow of (mediaResult.data ?? []) as unknown as MediaReferenceRow[]) {
    if (!mediaByProductId.has(mediaRow.product_id)) {
      mediaByProductId.set(mediaRow.product_id, mediaRow.media);
    }
  }

  const items = rows
    .map((row): WishlistItemData | null => {
      const product = productsById.get(row.product_id);
      if (!product) {
        return null;
      }

      const variant = selectWishlistVariant(variantsByProductId.get(product.id) ?? []);
      const media = mediaByProductId.get(product.id) ?? null;

      return {
        id: row.id,
        productId: product.id,
        slug: product.slug,
        title: product.title,
        imageUrl: media?.thumbnail_url ?? media?.url ?? null,
        imageAlt: media?.alt_text ?? product.title,
        availability:
          product.status === "published" && variant?.is_available
            ? "in-stock"
            : "out-of-stock",
        priceAmount: variant?.price_amount ?? null,
        compareAtAmount: variant?.compare_at_amount ?? null,
        currency: variant?.currency ?? "INR",
        createdAt: row.created_at,
      };
    })
    .filter((item): item is WishlistItemData => item !== null);

  return { items };
}

function selectWishlistVariant(variants: VariantRow[]) {
  return (
    variants.find((variant) => variant.selected_by_default) ??
    variants.find((variant) => variant.is_available) ??
    variants[0] ??
    null
  );
}

function isUniqueViolation(error: { code?: string }) {
  return error.code === "23505";
}
