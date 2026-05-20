import "server-only";

import {
  buildPaginationMeta,
  getPagination,
  type PaginationInput,
} from "@/server/http/pagination";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type {
  CartPersonalizationValue,
  CustomerOrderDetailData,
  CustomerOrderItemData,
  CustomerOrderListData,
  CustomerOrderSummaryData,
} from "@/types/api";
import type { Json, Tables } from "@/types/supabase";

type OrderRow = Tables<"orders">;
type OrderItemRow = Tables<"order_items">;

type OrderSummaryRow = Pick<
  OrderRow,
  | "id"
  | "order_number"
  | "payment_method"
  | "status"
  | "payment_status"
  | "total_amount"
  | "currency"
  | "created_at"
  | "updated_at"
>;

export async function listCustomerOrders(
  userId: string,
  pageInput: PaginationInput = {},
): Promise<CustomerOrderListData> {
  const pagination = getPagination(pageInput);
  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("orders")
    .select(
      "id,order_number,payment_method,status,payment_status,total_amount,currency,created_at,updated_at",
      { count: "exact" },
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(pagination.from, pagination.to);

  if (result.error) {
    throw result.error;
  }

  const rows = (result.data ?? []) as OrderSummaryRow[];
  const itemCounts = await getOrderItemCounts(rows.map((row) => row.id));

  return {
    items: rows.map((row) => mapOrderSummaryRow(row, itemCounts.get(row.id) ?? 0)),
    pagination: buildPaginationMeta({
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: result.count ?? rows.length,
    }),
  };
}

export async function getCustomerOrderById(userId: string, orderId: string) {
  const admin = createSupabaseAdminClient();
  const orderResult = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle<OrderRow>();

  if (orderResult.error) {
    throw orderResult.error;
  }

  if (!orderResult.data) {
    return null;
  }

  const itemsResult = await admin
    .from("order_items")
    .select("*")
    .eq("order_id", orderResult.data.id)
    .order("created_at", { ascending: true });

  if (itemsResult.error) {
    throw itemsResult.error;
  }

  return mapOrderDetailRow(
    orderResult.data,
    ((itemsResult.data ?? []) as OrderItemRow[]).map(mapOrderItemRow),
  );
}

async function getOrderItemCounts(orderIds: string[]) {
  const counts = new Map<string, number>();

  if (orderIds.length === 0) {
    return counts;
  }

  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("order_items")
    .select("order_id,quantity")
    .in("order_id", orderIds);

  if (result.error) {
    throw result.error;
  }

  for (const item of (result.data ?? []) as Pick<OrderItemRow, "order_id" | "quantity">[]) {
    counts.set(item.order_id, (counts.get(item.order_id) ?? 0) + item.quantity);
  }

  return counts;
}

function mapOrderSummaryRow(
  row: OrderSummaryRow,
  itemCount: number,
): CustomerOrderSummaryData {
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: normalizePaymentMethod(row.payment_method),
    itemCount,
    totalAmount: row.total_amount,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrderDetailRow(
  row: OrderRow,
  items: CustomerOrderItemData[],
): CustomerOrderDetailData {
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: normalizePaymentMethod(row.payment_method),
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    totalAmount: row.total_amount,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    subtotalAmount: row.subtotal_amount,
    discountAmount: row.discount_amount,
    shippingAmount: row.shipping_amount,
    shippingAddress: row.shipping_address,
    billingAddress: normalizeNullableJson(row.billing_address),
    items,
  };
}

function normalizePaymentMethod(value: string) {
  if (
    value === "manual" ||
    value === "razorpay" ||
    value === "stripe" ||
    value === "cod"
  ) {
    return value;
  }

  return "cod";
}

function mapOrderItemRow(row: OrderItemRow): CustomerOrderItemData {
  return {
    id: row.id,
    productId: row.product_id,
    variantId: row.variant_id,
    title: row.title_snapshot,
    sku: row.sku_snapshot,
    unitPriceAmount: row.unit_price_amount,
    quantity: row.quantity,
    totalAmount: row.total_amount,
    personalization: toPersonalizationRecord(row.personalization),
    createdAt: row.created_at,
  };
}

function normalizeNullableJson(value: Json | null) {
  return value === undefined ? null : value;
}

function toPersonalizationRecord(value: Json): Record<string, CartPersonalizationValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, CartPersonalizationValue] =>
        isCartPersonalizationValue(entry[1]),
    ),
  );
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
