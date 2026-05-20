-- Phase 3 wishlist foundation.

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists wishlist_items_user_idx
on public.wishlist_items(user_id, created_at desc);

alter table public.wishlist_items enable row level security;

create policy "Users read own wishlist items"
on public.wishlist_items for select
to authenticated
using (user_id = auth.uid() or public.is_support_or_admin());

create policy "Users insert own wishlist items"
on public.wishlist_items for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users delete own wishlist items"
on public.wishlist_items for delete
to authenticated
using (user_id = auth.uid());

create policy "Support manage wishlist items"
on public.wishlist_items for all
to authenticated
using (public.is_support_or_admin())
with check (public.is_support_or_admin());
