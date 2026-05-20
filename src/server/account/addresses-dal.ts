import "server-only";

import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type {
  CustomerAddressData,
  CustomerAddressListData,
} from "@/types/api";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

export class AddressOperationError extends Error {
  constructor(
    public readonly kind: "not_found" | "conflict",
    message: string,
  ) {
    super(message);
    this.name = "AddressOperationError";
  }
}

type AddressRow = Tables<"addresses">;

export type CustomerAddressInput = {
  label?: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
};

export type CustomerAddressUpdateInput = Partial<CustomerAddressInput>;

export async function listCustomerAddresses(
  userId: string,
): Promise<CustomerAddressListData> {
  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default_shipping", { ascending: false })
    .order("is_default_billing", { ascending: false })
    .order("updated_at", { ascending: false });

  if (result.error) {
    throw result.error;
  }

  return {
    items: ((result.data ?? []) as AddressRow[]).map(mapAddressRow),
  };
}

export async function getCustomerAddressById(userId: string, addressId: string) {
  const row = await getAddressRow(userId, addressId);
  return row ? mapAddressRow(row) : null;
}

export async function createCustomerAddress(
  userId: string,
  input: CustomerAddressInput,
) {
  const admin = createSupabaseAdminClient();
  const count = await admin
    .from("addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count.error) {
    throw count.error;
  }

  const isFirstAddress = (count.count ?? 0) === 0;
  const insert: TablesInsert<"addresses"> = {
    user_id: userId,
    label: input.label ?? null,
    full_name: input.fullName,
    phone: input.phone,
    line1: input.line1,
    line2: input.line2 ?? null,
    city: input.city,
    state: input.state,
    pincode: input.pincode,
    country: input.country ?? "IN",
    is_default_shipping: false,
    is_default_billing: false,
  };

  const created = await admin
    .from("addresses")
    .insert(insert)
    .select("*")
    .single<AddressRow>();

  if (created.error) {
    throw created.error;
  }

  const defaultShipping = input.isDefaultShipping ?? isFirstAddress;
  const defaultBilling = input.isDefaultBilling ?? isFirstAddress;

  await setAddressDefaults({
    userId,
    addressId: created.data.id,
    isDefaultShipping: defaultShipping,
    isDefaultBilling: defaultBilling,
  });

  const saved = await getAddressRow(userId, created.data.id);
  if (!saved) {
    throw new AddressOperationError("not_found", "We could not find that address.");
  }

  return mapAddressRow(saved);
}

export async function updateCustomerAddress(
  userId: string,
  addressId: string,
  input: CustomerAddressUpdateInput,
) {
  const existing = await getAddressRow(userId, addressId);
  if (!existing) {
    throw new AddressOperationError("not_found", "We could not find that address.");
  }

  const admin = createSupabaseAdminClient();
  const update = toAddressUpdate(input);

  if (Object.keys(update).length > 0) {
    const result = await admin
      .from("addresses")
      .update(update)
      .eq("id", addressId)
      .eq("user_id", userId);

    if (result.error) {
      throw result.error;
    }
  }

  if (
    input.isDefaultShipping !== undefined ||
    input.isDefaultBilling !== undefined
  ) {
    await setAddressDefaults({
      userId,
      addressId,
      isDefaultShipping: input.isDefaultShipping ?? existing.is_default_shipping,
      isDefaultBilling: input.isDefaultBilling ?? existing.is_default_billing,
    });
  }

  const saved = await getAddressRow(userId, addressId);
  if (!saved) {
    throw new AddressOperationError("not_found", "We could not find that address.");
  }

  return mapAddressRow(saved);
}

export async function deleteCustomerAddress(userId: string, addressId: string) {
  const existing = await getAddressRow(userId, addressId);
  if (!existing) {
    throw new AddressOperationError("not_found", "We could not find that address.");
  }

  const admin = createSupabaseAdminClient();
  const deleted = await admin
    .from("addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", userId);

  if (deleted.error) {
    throw deleted.error;
  }

  await promoteReplacementDefault(userId, {
    shipping: existing.is_default_shipping,
    billing: existing.is_default_billing,
  });

  return { id: addressId, deleted: true };
}

async function getAddressRow(userId: string, addressId: string) {
  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("addresses")
    .select("*")
    .eq("id", addressId)
    .eq("user_id", userId)
    .maybeSingle<AddressRow>();

  if (result.error) {
    throw result.error;
  }

  return result.data;
}

async function setAddressDefaults(input: {
  userId: string;
  addressId: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}) {
  const admin = createSupabaseAdminClient();
  const result = await admin.rpc("set_customer_address_defaults", {
    p_user_id: input.userId,
    p_address_id: input.addressId,
    p_default_shipping: input.isDefaultShipping,
    p_default_billing: input.isDefaultBilling,
  });

  if (result.error) {
    throw result.error;
  }
}

async function promoteReplacementDefault(
  userId: string,
  deletedDefaults: { shipping: boolean; billing: boolean },
) {
  if (!deletedDefaults.shipping && !deletedDefaults.billing) {
    return;
  }

  const admin = createSupabaseAdminClient();
  const replacement = await admin
    .from("addresses")
    .select("id,is_default_shipping,is_default_billing")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<Pick<
      AddressRow,
      "id" | "is_default_shipping" | "is_default_billing"
    >>();

  if (replacement.error) {
    throw replacement.error;
  }

  if (!replacement.data) {
    return;
  }

  await setAddressDefaults({
    userId,
    addressId: replacement.data.id,
    isDefaultShipping:
      deletedDefaults.shipping || replacement.data.is_default_shipping,
    isDefaultBilling: deletedDefaults.billing || replacement.data.is_default_billing,
  });
}

function toAddressUpdate(input: CustomerAddressUpdateInput) {
  const update: TablesUpdate<"addresses"> = {};

  if (input.label !== undefined) {
    update.label = input.label;
  }

  if (input.fullName !== undefined) {
    update.full_name = input.fullName;
  }

  if (input.phone !== undefined) {
    update.phone = input.phone;
  }

  if (input.line1 !== undefined) {
    update.line1 = input.line1;
  }

  if (input.line2 !== undefined) {
    update.line2 = input.line2;
  }

  if (input.city !== undefined) {
    update.city = input.city;
  }

  if (input.state !== undefined) {
    update.state = input.state;
  }

  if (input.pincode !== undefined) {
    update.pincode = input.pincode;
  }

  if (input.country !== undefined) {
    update.country = input.country;
  }

  return update;
}

function mapAddressRow(row: AddressRow): CustomerAddressData {
  return {
    id: row.id,
    label: row.label,
    fullName: row.full_name,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    country: row.country,
    isDefaultShipping: row.is_default_shipping,
    isDefaultBilling: row.is_default_billing,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
