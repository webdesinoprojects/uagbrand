import "server-only";

import {
  clearGuestCartToken,
  ensureGuestCartToken,
  getGuestCartToken,
} from "@/server/cart/cart-cookie";
import { getCurrentCustomerSession } from "@/server/auth/customer-session";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type {
  CartData,
  CartItemData,
  CartPersonalizationValue,
} from "@/types/api";
import type { Json, Tables } from "@/types/supabase";

export const MAX_CART_ITEM_QUANTITY = 20;

type CartOperationKind = "conflict" | "not_found";

export class CartOperationError extends Error {
  constructor(
    public readonly kind: CartOperationKind,
    message: string,
  ) {
    super(message);
    this.name = "CartOperationError";
  }
}

type CartRow = Pick<
  Tables<"carts">,
  "id" | "user_id" | "guest_token" | "status" | "created_at" | "updated_at"
>;

type CartItemRow = Pick<
  Tables<"cart_items">,
  | "id"
  | "cart_id"
  | "product_id"
  | "variant_id"
  | "quantity"
  | "personalization"
  | "created_at"
  | "updated_at"
>;

type VariantRow = Pick<
  Tables<"product_variants">,
  | "id"
  | "product_id"
  | "sku"
  | "color_name"
  | "color_swatch"
  | "is_available"
  | "price_amount"
  | "compare_at_amount"
  | "currency"
  | "selected_by_default"
>;

type ProductRow = Pick<Tables<"products">, "id" | "slug" | "title" | "status">;

type ProductWithVariantsRow = ProductRow & {
  product_variants: VariantRow[];
};

type MediaReferenceRow = {
  product_id: string;
  sort_order: number;
  media: {
    url: string;
    thumbnail_url: string | null;
    alt_text: string | null;
  } | null;
};

type CartContext = {
  authenticated: boolean;
  userId: string | null;
  guestToken: string | null;
};

export type AddCartItemInput = {
  productId: string;
  variantId?: string | null;
  quantity: number;
  personalization?: Record<string, CartPersonalizationValue>;
};

export async function getCartForRequest(): Promise<CartData> {
  const context = await getCartContext();

  if (context.userId && context.guestToken) {
    await mergeGuestCartIntoUserCart(context.userId, context.guestToken);
    context.guestToken = null;
  }

  const cart = await getActiveCartForContext(context);
  if (!cart) {
    return emptyCart(context.authenticated);
  }

  return buildCartData(cart, context.authenticated);
}

export async function addCartItem(input: AddCartItemInput): Promise<CartData> {
  const quantity = clampQuantity(input.quantity);
  const personalization = normalizePersonalization(input.personalization ?? {});
  const context = await getCartContext({ createGuestToken: true });

  if (context.userId && context.guestToken) {
    await mergeGuestCartIntoUserCart(context.userId, context.guestToken);
    context.guestToken = null;
  }

  const cart = await ensureActiveCartForContext(context);
  const selected = await getPublishedVariantForCart({
    productId: input.productId,
    variantId: input.variantId ?? null,
  });

  await addCartItemAtomic({
    cartId: cart.id,
    productId: selected.product.id,
    variantId: selected.variant.id,
    quantity,
    personalization,
  });

  return buildCartData(cart, context.authenticated);
}

export async function updateCartItemQuantity(
  itemId: string,
  quantity: number,
): Promise<CartData> {
  const context = await getCartContext();
  const item = await getOwnedCartItem(itemId, context);

  if (!item) {
    throw new CartOperationError("not_found", "We could not find that cart item.");
  }

  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("cart_items")
    .update({ quantity: clampQuantity(quantity) })
    .eq("id", item.id);

  if (result.error) {
    throw result.error;
  }

  const cart = await getCartById(item.cart_id);
  return cart ? buildCartData(cart, context.authenticated) : emptyCart(context.authenticated);
}

export async function deleteCartItem(itemId: string): Promise<CartData> {
  const context = await getCartContext();
  const item = await getOwnedCartItem(itemId, context);

  if (!item) {
    throw new CartOperationError("not_found", "We could not find that cart item.");
  }

  const admin = createSupabaseAdminClient();
  const result = await admin.from("cart_items").delete().eq("id", item.id);

  if (result.error) {
    throw result.error;
  }

  const cart = await getCartById(item.cart_id);
  return cart ? buildCartData(cart, context.authenticated) : emptyCart(context.authenticated);
}

export async function clearCartForRequest(): Promise<CartData> {
  const context = await getCartContext();
  const cart = await getActiveCartForContext(context);

  if (cart) {
    const admin = createSupabaseAdminClient();
    const result = await admin.from("carts").delete().eq("id", cart.id);

    if (result.error) {
      throw result.error;
    }
  }

  if (!context.userId) {
    await clearGuestCartToken();
  }

  return emptyCart(context.authenticated);
}

export async function mergeCurrentGuestCartIntoUserCart(userId: string) {
  const guestToken = await getGuestCartToken();
  if (!guestToken) {
    return;
  }

  await mergeGuestCartIntoUserCart(userId, guestToken);
}

async function getCartContext(options: { createGuestToken?: boolean } = {}) {
  const session = await getCurrentCustomerSession();
  const userId = session.user?.id ?? null;
  const guestToken = userId
    ? await getGuestCartToken()
    : options.createGuestToken
      ? await ensureGuestCartToken()
      : await getGuestCartToken();

  return {
    authenticated: session.authenticated,
    userId,
    guestToken,
  } satisfies CartContext;
}

async function getActiveCartForContext(context: CartContext) {
  if (context.userId) {
    return getActiveUserCart(context.userId);
  }

  if (context.guestToken) {
    return getActiveGuestCart(context.guestToken);
  }

  return null;
}

async function ensureActiveCartForContext(context: CartContext) {
  if (context.userId) {
    return ensureUserCart(context.userId);
  }

  if (!context.guestToken) {
    throw new CartOperationError("conflict", "Please refresh and try again.");
  }

  return ensureGuestCart(context.guestToken);
}

async function getActiveUserCart(userId: string) {
  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("carts")
    .select("id,user_id,guest_token,status,created_at,updated_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<CartRow>();

  if (result.error) {
    throw result.error;
  }

  return result.data;
}

async function getActiveGuestCart(guestToken: string) {
  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("carts")
    .select("id,user_id,guest_token,status,created_at,updated_at")
    .eq("guest_token", guestToken)
    .eq("status", "active")
    .maybeSingle<CartRow>();

  if (result.error) {
    throw result.error;
  }

  return result.data;
}

async function getCartById(cartId: string) {
  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("carts")
    .select("id,user_id,guest_token,status,created_at,updated_at")
    .eq("id", cartId)
    .maybeSingle<CartRow>();

  if (result.error) {
    throw result.error;
  }

  return result.data;
}

async function ensureUserCart(userId: string) {
  const existing = await getActiveUserCart(userId);
  if (existing) {
    return existing;
  }

  const admin = createSupabaseAdminClient();
  const created = await admin
    .from("carts")
    .insert({ user_id: userId, status: "active" })
    .select("id,user_id,guest_token,status,created_at,updated_at")
    .single<CartRow>();

  if (created.error) {
    if (isUniqueViolation(created.error)) {
      const cart = await getActiveUserCart(userId);
      if (cart) {
        return cart;
      }
    }

    throw created.error;
  }

  return created.data;
}

async function ensureGuestCart(guestToken: string) {
  const existing = await getActiveGuestCart(guestToken);
  if (existing) {
    return existing;
  }

  const admin = createSupabaseAdminClient();
  const created = await admin
    .from("carts")
    .insert({ guest_token: guestToken, status: "active" })
    .select("id,user_id,guest_token,status,created_at,updated_at")
    .single<CartRow>();

  if (created.error) {
    if (isUniqueViolation(created.error)) {
      const cart = await getActiveGuestCart(guestToken);
      if (cart) {
        return cart;
      }
    }

    throw created.error;
  }

  return created.data;
}

async function mergeGuestCartIntoUserCart(userId: string, guestToken: string) {
  const guestCart = await getActiveGuestCart(guestToken);
  if (!guestCart) {
    await clearGuestCartToken();
    return;
  }

  const userCart = await ensureUserCart(userId);
  const admin = createSupabaseAdminClient();
  const items = await admin
    .from("cart_items")
    .select("id,cart_id,product_id,variant_id,quantity,personalization,created_at,updated_at")
    .eq("cart_id", guestCart.id);

  if (items.error) {
    throw items.error;
  }

  for (const item of (items.data ?? []) as CartItemRow[]) {
    await addCartItemAtomic({
      cartId: userCart.id,
      productId: item.product_id,
      variantId: item.variant_id,
      quantity: Math.min(item.quantity, MAX_CART_ITEM_QUANTITY),
      personalization: normalizePersonalization(toPersonalizationRecord(item.personalization)),
    });
  }

  const deleted = await admin.from("carts").delete().eq("id", guestCart.id);
  if (deleted.error) {
    throw deleted.error;
  }

  await clearGuestCartToken();
}

async function getPublishedVariantForCart(input: {
  productId: string;
  variantId: string | null;
}) {
  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("products")
    .select(
      `
        id,
        slug,
        title,
        status,
        product_variants(
          id,
          product_id,
          sku,
          color_name,
          color_swatch,
          is_available,
          price_amount,
          compare_at_amount,
          currency,
          selected_by_default
        )
      `,
    )
    .eq("id", input.productId)
    .eq("status", "published")
    .maybeSingle<ProductWithVariantsRow>();

  if (result.error) {
    throw result.error;
  }

  const product = result.data;
  if (!product) {
    throw new CartOperationError("not_found", "We could not find that product.");
  }

  const variants = product.product_variants ?? [];
  const variant = input.variantId
    ? variants.find((item) => item.id === input.variantId)
    : variants.find((item) => item.selected_by_default && item.is_available) ??
      variants.find((item) => item.is_available) ??
      variants.find((item) => item.selected_by_default) ??
      variants[0];

  if (!variant) {
    throw new CartOperationError("not_found", "This product is not ready to buy yet.");
  }

  if (variant.product_id !== product.id || !variant.is_available) {
    throw new CartOperationError("conflict", "This option is currently out of stock.");
  }

  return { product, variant };
}

async function addCartItemAtomic(input: {
  cartId: string;
  productId: string;
  variantId: string;
  quantity: number;
  personalization: Record<string, CartPersonalizationValue>;
}) {
  const admin = createSupabaseAdminClient();
  const result = await admin.rpc("add_cart_item", {
    p_cart_id: input.cartId,
    p_product_id: input.productId,
    p_variant_id: input.variantId,
    p_quantity: input.quantity,
    p_personalization: input.personalization as Json,
  });

  if (result.error) {
    throw result.error;
  }

  return result.data;
}

async function getOwnedCartItem(itemId: string, context: CartContext) {
  const admin = createSupabaseAdminClient();
  const itemResult = await admin
    .from("cart_items")
    .select("id,cart_id,product_id,variant_id,quantity,personalization,created_at,updated_at")
    .eq("id", itemId)
    .maybeSingle<CartItemRow>();

  if (itemResult.error) {
    throw itemResult.error;
  }

  if (!itemResult.data) {
    return null;
  }

  const cart = await getCartById(itemResult.data.cart_id);
  if (!cart || !cartBelongsToContext(cart, context)) {
    return null;
  }

  return itemResult.data;
}

async function buildCartData(
  cart: CartRow,
  authenticated: boolean,
): Promise<CartData> {
  const admin = createSupabaseAdminClient();
  const itemResult = await admin
    .from("cart_items")
    .select("id,cart_id,product_id,variant_id,quantity,personalization,created_at,updated_at")
    .eq("cart_id", cart.id)
    .order("created_at", { ascending: true });

  if (itemResult.error) {
    throw itemResult.error;
  }

  const rows = (itemResult.data ?? []) as CartItemRow[];
  if (rows.length === 0) {
    return emptyCart(authenticated, cart.id);
  }

  const productIds = Array.from(new Set(rows.map((item) => item.product_id)));
  const variantIds = Array.from(new Set(rows.map((item) => item.variant_id)));
  const [productsResult, variantsResult, mediaResult] = await Promise.all([
    admin
      .from("products")
      .select("id,slug,title,status")
      .in("id", productIds),
    admin
      .from("product_variants")
      .select(
        "id,product_id,sku,color_name,color_swatch,is_available,price_amount,compare_at_amount,currency,selected_by_default",
      )
      .in("id", variantIds),
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
  const variantsById = new Map(
    ((variantsResult.data ?? []) as VariantRow[]).map((variant) => [variant.id, variant]),
  );
  const mediaByProductId = new Map<string, MediaReferenceRow["media"]>();

  for (const mediaRow of (mediaResult.data ?? []) as unknown as MediaReferenceRow[]) {
    if (!mediaByProductId.has(mediaRow.product_id)) {
      mediaByProductId.set(mediaRow.product_id, mediaRow.media);
    }
  }

  const items: CartItemData[] = rows
    .map((item): CartItemData | null => {
      const product = productsById.get(item.product_id);
      const variant = variantsById.get(item.variant_id);

      if (!product || !variant) {
        return null;
      }

      const media = mediaByProductId.get(product.id) ?? null;

      return {
        id: item.id,
        productId: product.id,
        variantId: variant.id,
        slug: product.slug,
        title: product.title,
        imageUrl: media?.thumbnail_url ?? media?.url ?? null,
        imageAlt: media?.alt_text ?? product.title,
        quantity: item.quantity,
        personalization: toPersonalizationRecord(item.personalization),
        variant: {
          sku: variant.sku,
          colorName: variant.color_name,
          colorSwatch: variant.color_swatch,
          isAvailable: product.status === "published" && variant.is_available,
          priceAmount: variant.price_amount,
          compareAtAmount: variant.compare_at_amount,
          currency: variant.currency,
        },
        lineTotalAmount: variant.price_amount * item.quantity,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      } satisfies CartItemData;
    })
    .filter((item): item is CartItemData => item !== null);

  const currency = items[0]?.variant.currency ?? "INR";

  return {
    id: cart.id,
    authenticated,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotalAmount: items.reduce((total, item) => total + item.lineTotalAmount, 0),
    currency,
    items,
  };
}

function cartBelongsToContext(cart: CartRow, context: CartContext) {
  if (context.userId && cart.user_id === context.userId) {
    return true;
  }

  return Boolean(context.guestToken && cart.guest_token === context.guestToken);
}

function emptyCart(authenticated: boolean, id: string | null = null): CartData {
  return {
    id,
    authenticated,
    itemCount: 0,
    subtotalAmount: 0,
    currency: "INR",
    items: [],
  };
}

function clampQuantity(quantity: number) {
  return Math.max(1, Math.min(quantity, MAX_CART_ITEM_QUANTITY));
}

function normalizePersonalization(
  input: Record<string, CartPersonalizationValue>,
) {
  return Object.fromEntries(
    Object.entries(input)
      .filter(([key]) => key.trim().length > 0)
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function toPersonalizationRecord(value: Json): Record<string, CartPersonalizationValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const entries = Object.entries(value).filter(
    (entry): entry is [string, CartPersonalizationValue] =>
      isCartPersonalizationValue(entry[1]),
  );

  return normalizePersonalization(Object.fromEntries(entries));
}

function isCartPersonalizationValue(
  value: Json | undefined,
): value is CartPersonalizationValue {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function isUniqueViolation(error: { code?: string }) {
  return error.code === "23505";
}
