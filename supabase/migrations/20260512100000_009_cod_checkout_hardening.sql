-- Phase 3 COD checkout hardening.
-- India-first validation, explicit payment_method snapshot, and stronger
-- checkout RPC guards. Online provider payment tables remain deferred until
-- the provider is final.

alter table public.orders
add column if not exists payment_method text not null default 'cod';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_payment_method_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
    add constraint orders_payment_method_check
    check (payment_method in ('cod', 'manual', 'razorpay', 'stripe'))
    not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'addresses_country_iso2_check'
      and conrelid = 'public.addresses'::regclass
  ) then
    alter table public.addresses
    add constraint addresses_country_iso2_check
    check (country ~ '^[A-Z]{2}$')
    not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'addresses_in_phone_check'
      and conrelid = 'public.addresses'::regclass
  ) then
    alter table public.addresses
    add constraint addresses_in_phone_check
    check (country <> 'IN' or phone ~ '^[6-9][0-9]{9}$')
    not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'addresses_in_pincode_check'
      and conrelid = 'public.addresses'::regclass
  ) then
    alter table public.addresses
    add constraint addresses_in_pincode_check
    check (country <> 'IN' or pincode ~ '^[1-9][0-9]{5}$')
    not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_indian_phone_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_indian_phone_check
    check (phone is null or phone ~ '^[6-9][0-9]{9}$')
    not valid;
  end if;
end $$;

create or replace function public.create_cod_order_from_cart(
  p_user_id uuid,
  p_shipping_address_id uuid,
  p_billing_address_id uuid default null
)
returns table(order_id uuid, order_number text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart_id uuid;
  v_profile record;
  v_shipping_address jsonb;
  v_billing_address jsonb;
  v_customer_phone text;
  v_item_count integer;
  v_valid_count integer;
  v_currency_count integer;
  v_subtotal integer;
  v_currency text;
  v_order_id uuid := gen_random_uuid();
  v_order_number text;
  v_item record;
  v_location_id uuid;
begin
  if p_user_id is null or p_shipping_address_id is null then
    raise exception 'CHECKOUT_INVALID_REQUEST';
  end if;

  select id
  into v_cart_id
  from public.carts
  where user_id = p_user_id
    and status = 'active'
  for update;

  if v_cart_id is null then
    raise exception 'CHECKOUT_CART_NOT_FOUND';
  end if;

  select count(*)
  into v_item_count
  from public.cart_items
  where cart_id = v_cart_id;

  if v_item_count = 0 then
    raise exception 'CHECKOUT_EMPTY_CART';
  end if;

  select count(*)
  into v_valid_count
  from public.cart_items ci
  join public.products p on p.id = ci.product_id
  join public.product_variants pv
    on pv.id = ci.variant_id
    and pv.product_id = p.id
  where ci.cart_id = v_cart_id
    and p.status = 'published'
    and pv.is_available = true;

  if v_valid_count <> v_item_count then
    raise exception 'CHECKOUT_ITEM_UNAVAILABLE';
  end if;

  select
    count(distinct pv.currency),
    min(pv.currency),
    sum(ci.quantity * pv.price_amount)::integer
  into v_currency_count, v_currency, v_subtotal
  from public.cart_items ci
  join public.product_variants pv on pv.id = ci.variant_id
  where ci.cart_id = v_cart_id;

  if v_currency_count <> 1 or v_subtotal is null or v_currency <> 'INR' then
    raise exception 'CHECKOUT_CURRENCY_MISMATCH';
  end if;

  select id, email, phone
  into v_profile
  from public.profiles
  where id = p_user_id
    and is_active = true;

  if v_profile.id is null then
    raise exception 'CHECKOUT_PROFILE_NOT_FOUND';
  end if;

  select jsonb_build_object(
    'id', id,
    'label', label,
    'fullName', full_name,
    'phone', phone,
    'line1', line1,
    'line2', line2,
    'city', city,
    'state', state,
    'pincode', pincode,
    'country', country
  )
  into v_shipping_address
  from public.addresses
  where id = p_shipping_address_id
    and user_id = p_user_id;

  if v_shipping_address is null then
    raise exception 'CHECKOUT_ADDRESS_NOT_FOUND';
  end if;

  if coalesce(v_shipping_address ->> 'country', '') <> 'IN'
    or not coalesce(v_shipping_address ->> 'phone', '') ~ '^[6-9][0-9]{9}$'
    or not coalesce(v_shipping_address ->> 'pincode', '') ~ '^[1-9][0-9]{5}$'
  then
    raise exception 'CHECKOUT_ADDRESS_INVALID';
  end if;

  if p_billing_address_id is null then
    v_billing_address := v_shipping_address;
  else
    select jsonb_build_object(
      'id', id,
      'label', label,
      'fullName', full_name,
      'phone', phone,
      'line1', line1,
      'line2', line2,
      'city', city,
      'state', state,
      'pincode', pincode,
      'country', country
    )
    into v_billing_address
    from public.addresses
    where id = p_billing_address_id
      and user_id = p_user_id;

    if v_billing_address is null then
      raise exception 'CHECKOUT_ADDRESS_NOT_FOUND';
    end if;

    if coalesce(v_billing_address ->> 'country', '') <> 'IN'
      or not coalesce(v_billing_address ->> 'phone', '') ~ '^[6-9][0-9]{9}$'
      or not coalesce(v_billing_address ->> 'pincode', '') ~ '^[1-9][0-9]{5}$'
    then
      raise exception 'CHECKOUT_ADDRESS_INVALID';
    end if;
  end if;

  v_customer_phone := case
    when v_profile.phone ~ '^[6-9][0-9]{9}$' then v_profile.phone
    else v_shipping_address ->> 'phone'
  end;

  v_order_number := concat(
    'AEB-',
    to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS'),
    '-',
    upper(substr(replace(v_order_id::text, '-', ''), 1, 6))
  );

  insert into public.orders (
    id,
    order_number,
    user_id,
    customer_email,
    customer_phone,
    shipping_address,
    billing_address,
    subtotal_amount,
    discount_amount,
    shipping_amount,
    total_amount,
    currency,
    payment_method,
    status,
    payment_status
  )
  values (
    v_order_id,
    v_order_number,
    p_user_id,
    v_profile.email,
    v_customer_phone,
    v_shipping_address,
    v_billing_address,
    v_subtotal,
    0,
    0,
    v_subtotal,
    v_currency,
    'cod',
    'confirmed',
    'pending'
  );

  for v_item in
    select
      ci.product_id,
      ci.variant_id,
      ci.quantity,
      ci.personalization,
      p.title,
      pv.sku,
      pv.price_amount
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    join public.product_variants pv on pv.id = ci.variant_id
    where ci.cart_id = v_cart_id
    order by ci.variant_id
  loop
    select s.location_id
    into v_location_id
    from public.inventory_stock s
    join public.inventory_locations l on l.id = s.location_id
    where s.variant_id = v_item.variant_id
      and l.is_active = true
      and s.quantity_available >= v_item.quantity
    order by s.quantity_available desc, s.location_id
    limit 1
    for update of s;

    if v_location_id is null then
      raise exception 'CHECKOUT_OUT_OF_STOCK';
    end if;

    update public.inventory_stock
    set quantity_available = quantity_available - v_item.quantity
    where variant_id = v_item.variant_id
      and location_id = v_location_id;

    insert into public.stock_movements (
      variant_id,
      location_id,
      movement_type,
      quantity,
      reason,
      reference_id,
      actor_id
    )
    values (
      v_item.variant_id,
      v_location_id,
      'sale',
      -v_item.quantity,
      'COD order sale',
      v_order_id,
      p_user_id
    );

    insert into public.order_items (
      order_id,
      product_id,
      variant_id,
      title_snapshot,
      sku_snapshot,
      unit_price_amount,
      quantity,
      total_amount,
      personalization
    )
    values (
      v_order_id,
      v_item.product_id,
      v_item.variant_id,
      v_item.title,
      v_item.sku,
      v_item.price_amount,
      v_item.quantity,
      v_item.price_amount * v_item.quantity,
      coalesce(v_item.personalization, '{}'::jsonb)
    );

    v_location_id := null;
  end loop;

  update public.carts
  set status = 'converted'
  where id = v_cart_id;

  order_id := v_order_id;
  order_number := v_order_number;
  return next;
end;
$$;

revoke all on function public.create_cod_order_from_cart(uuid, uuid, uuid) from public;
grant execute on function public.create_cod_order_from_cart(uuid, uuid, uuid) to service_role;
