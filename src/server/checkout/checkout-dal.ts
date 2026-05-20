import "server-only";

import { mergeCurrentGuestCartIntoUserCart } from "@/server/cart/cart-dal";
import { getCustomerOrderById } from "@/server/account/orders-dal";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { CustomerOrderDetailData } from "@/types/api";

export class CheckoutOperationError extends Error {
  constructor(
    public readonly kind: "not_found" | "conflict",
    message: string,
  ) {
    super(message);
    this.name = "CheckoutOperationError";
  }
}

export type CreateCodCheckoutInput = {
  userId: string;
  shippingAddressId: string;
  billingAddressId?: string | null;
};

type CheckoutRpcRow = {
  order_id: string;
  order_number: string;
};

export async function createCodCheckoutOrder(
  input: CreateCodCheckoutInput,
): Promise<CustomerOrderDetailData> {
  await mergeCurrentGuestCartIntoUserCart(input.userId);

  const admin = createSupabaseAdminClient();
  const result = await admin.rpc("create_cod_order_from_cart", {
    p_user_id: input.userId,
    p_shipping_address_id: input.shippingAddressId,
    p_billing_address_id: input.billingAddressId ?? undefined,
  });

  if (result.error) {
    throw mapCheckoutRpcError(result.error.message);
  }

  const row = ((result.data ?? []) as CheckoutRpcRow[])[0];
  if (!row?.order_id) {
    throw new CheckoutOperationError(
      "conflict",
      "We could not create the order. Please review your cart.",
    );
  }

  const order = await getCustomerOrderById(input.userId, row.order_id);
  if (!order) {
    throw new CheckoutOperationError(
      "conflict",
      "We could not load the order. Please refresh and check your orders.",
    );
  }

  return order;
}

function mapCheckoutRpcError(message: string) {
  if (message.includes("CHECKOUT_CART_NOT_FOUND")) {
    return new CheckoutOperationError("conflict", "Your cart is empty.");
  }

  if (message.includes("CHECKOUT_EMPTY_CART")) {
    return new CheckoutOperationError("conflict", "Your cart is empty.");
  }

  if (message.includes("CHECKOUT_ADDRESS_NOT_FOUND")) {
    return new CheckoutOperationError(
      "not_found",
      "Choose a valid delivery address.",
    );
  }

  if (message.includes("CHECKOUT_ADDRESS_INVALID")) {
    return new CheckoutOperationError(
      "conflict",
      "Use a valid Indian delivery address with a 10-digit mobile number and 6-digit PIN code.",
    );
  }

  if (message.includes("CHECKOUT_CURRENCY_MISMATCH")) {
    return new CheckoutOperationError(
      "conflict",
      "Cash on Delivery is available only for INR orders right now.",
    );
  }

  if (
    message.includes("CHECKOUT_ITEM_UNAVAILABLE") ||
    message.includes("CHECKOUT_OUT_OF_STOCK")
  ) {
    return new CheckoutOperationError(
      "conflict",
      "Some items are no longer available. Please review your cart.",
    );
  }

  if (message.includes("CHECKOUT_PROFILE_NOT_FOUND")) {
    return new CheckoutOperationError(
      "conflict",
      "Please sign in again before checkout.",
    );
  }

  return new CheckoutOperationError(
    "conflict",
    "We could not create the order. Please review your cart.",
  );
}
