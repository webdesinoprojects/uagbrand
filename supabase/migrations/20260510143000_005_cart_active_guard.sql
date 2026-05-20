-- Phase 3 cart hardening.
-- Keep one active cart per signed-in user so guest-cart merge and checkout have
-- one canonical cart to operate on.

create unique index if not exists carts_active_user_unique
on public.carts(user_id)
where user_id is not null and status = 'active';

create or replace function public.add_cart_item(
  p_cart_id uuid,
  p_product_id uuid,
  p_variant_id uuid,
  p_quantity integer,
  p_personalization jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_id uuid;
begin
  if p_quantity < 1 or p_quantity > 20 then
    raise exception 'invalid quantity';
  end if;

  insert into public.cart_items (
    cart_id,
    product_id,
    variant_id,
    quantity,
    personalization
  )
  values (
    p_cart_id,
    p_product_id,
    p_variant_id,
    p_quantity,
    coalesce(p_personalization, '{}'::jsonb)
  )
  on conflict (cart_id, variant_id, personalization)
  do update set
    quantity = least(public.cart_items.quantity + excluded.quantity, 20),
    updated_at = now()
  returning id into v_item_id;

  return v_item_id;
end;
$$;

revoke all on function public.add_cart_item(uuid, uuid, uuid, integer, jsonb) from public;
grant execute on function public.add_cart_item(uuid, uuid, uuid, integer, jsonb) to service_role;
