-- Phase 3 account address helpers.
-- Serializes default-address changes per user so the partial unique indexes from
-- migration 003 stay deterministic under concurrent requests.

create or replace function public.set_customer_address_defaults(
  p_user_id uuid,
  p_address_id uuid,
  p_default_shipping boolean,
  p_default_billing boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform 1
  from public.profiles
  where id = p_user_id
  for update;

  if not exists (
    select 1
    from public.addresses
    where id = p_address_id
      and user_id = p_user_id
  ) then
    raise exception 'address not found';
  end if;

  if p_default_shipping then
    update public.addresses
    set is_default_shipping = false
    where user_id = p_user_id
      and id <> p_address_id
      and is_default_shipping = true;
  end if;

  if p_default_billing then
    update public.addresses
    set is_default_billing = false
    where user_id = p_user_id
      and id <> p_address_id
      and is_default_billing = true;
  end if;

  update public.addresses
  set
    is_default_shipping = p_default_shipping,
    is_default_billing = p_default_billing
  where id = p_address_id
    and user_id = p_user_id;
end;
$$;

revoke all on function public.set_customer_address_defaults(uuid, uuid, boolean, boolean) from public;
grant execute on function public.set_customer_address_defaults(uuid, uuid, boolean, boolean) to service_role;
