create extension if not exists "pgcrypto";

create type public.admin_role as enum (
  'customer',
  'support',
  'editor',
  'admin'
);

create type public.publish_status as enum (
  'draft',
  'published',
  'archived'
);

create type public.media_resource_type as enum (
  'image',
  'video',
  'gif',
  'file'
);

create type public.order_status as enum (
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned'
);

create type public.payment_status as enum (
  'pending',
  'paid',
  'failed',
  'refunded',
  'cancelled'
);

create type public.stock_movement_type as enum (
  'adjustment',
  'reservation',
  'release',
  'sale',
  'return'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  phone text,
  role public.admin_role not null default 'customer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

create or replace function public.is_editor_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('editor', 'admin')
      and is_active = true
  );
$$;

create or replace function public.is_support_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('support', 'admin')
      and is_active = true
  );
$$;

create table public.admin_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role public.admin_role not null,
  invited_by uuid references public.profiles(id),
  accepted_by uuid references public.profiles(id),
  accepted_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint admin_invites_admin_role_check check (role in ('support', 'editor', 'admin'))
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_table text,
  entity_id uuid,
  before jsonb,
  after jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'imagekit',
  provider_file_id text,
  url text not null,
  thumbnail_url text,
  resource_type public.media_resource_type not null default 'image',
  alt_text text,
  width integer,
  height integer,
  duration_seconds numeric(10, 2),
  bytes bigint,
  mime_type text,
  folder text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger media_assets_set_updated_at
before update on public.media_assets
for each row execute function public.set_updated_at();

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  deal text,
  logo_media_id uuid references public.media_assets(id) on delete set null,
  status public.publish_status not null default 'draft',
  sort_order integer not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger brands_set_updated_at
before update on public.brands
for each row execute function public.set_updated_at();

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_name text not null,
  description text,
  image_media_id uuid references public.media_assets(id) on delete set null,
  hover_media_id uuid references public.media_assets(id) on delete set null,
  status public.publish_status not null default 'draft',
  sort_order integer not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  brand_id uuid not null references public.brands(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  title text not null,
  badge text,
  feature text,
  tagline text,
  description text,
  rating numeric(3, 2) not null default 0,
  rating_count integer not null default 0,
  status public.publish_status not null default 'draft',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  color_name text,
  color_swatch text,
  is_available boolean not null default true,
  price_amount integer not null,
  compare_at_amount integer,
  currency text not null default 'INR',
  selected_by_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_price_positive check (price_amount >= 0),
  constraint product_variants_compare_positive check (compare_at_amount is null or compare_at_amount >= 0)
);

create trigger product_variants_set_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  media_id uuid not null references public.media_assets(id) on delete restrict,
  role text not null default 'gallery',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.product_specifications (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,
  value text not null,
  group_name text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger product_specifications_set_updated_at
before update on public.product_specifications
for each row execute function public.set_updated_at();

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  label text,
  title text not null,
  value text not null,
  code text,
  min_quantity integer,
  discount_percent numeric(5, 2),
  starts_at timestamptz,
  ends_at timestamptz,
  status public.publish_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger offers_set_updated_at
before update on public.offers
for each row execute function public.set_updated_at();

create table public.product_offer_links (
  product_id uuid not null references public.products(id) on delete cascade,
  offer_id uuid not null references public.offers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (product_id, offer_id)
);

create table public.inventory_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pincode text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger inventory_locations_set_updated_at
before update on public.inventory_locations
for each row execute function public.set_updated_at();

create table public.inventory_stock (
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  location_id uuid not null references public.inventory_locations(id) on delete cascade,
  quantity_available integer not null default 0,
  quantity_reserved integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (variant_id, location_id),
  constraint inventory_stock_available_non_negative check (quantity_available >= 0),
  constraint inventory_stock_reserved_non_negative check (quantity_reserved >= 0)
);

create trigger inventory_stock_set_updated_at
before update on public.inventory_stock
for each row execute function public.set_updated_at();

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  location_id uuid references public.inventory_locations(id) on delete set null,
  movement_type public.stock_movement_type not null,
  quantity integer not null,
  reason text,
  reference_id uuid,
  actor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.home_sections (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text,
  eyebrow text,
  description text,
  payload jsonb not null default '{}'::jsonb,
  status public.publish_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger home_sections_set_updated_at
before update on public.home_sections
for each row execute function public.set_updated_at();

create table public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  eyebrow text,
  description text,
  offer text,
  cta_label text,
  href text,
  media_id uuid references public.media_assets(id) on delete set null,
  status public.publish_status not null default 'draft',
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger hero_slides_set_updated_at
before update on public.hero_slides
for each row execute function public.set_updated_at();

create table public.home_collections (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  description text,
  status public.publish_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger home_collections_set_updated_at
before update on public.home_collections
for each row execute function public.set_updated_at();

create table public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.home_collections(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  title text,
  badge text,
  feature text,
  href text,
  media_id uuid references public.media_assets(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  status public.publish_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger collection_items_set_updated_at
before update on public.collection_items
for each row execute function public.set_updated_at();

create table public.warehouse_slides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  href text,
  media_id uuid references public.media_assets(id) on delete set null,
  status public.publish_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger warehouse_slides_set_updated_at
before update on public.warehouse_slides
for each row execute function public.set_updated_at();

create table public.brand_collabs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete set null,
  title text not null,
  subtitle text,
  media_id uuid references public.media_assets(id) on delete set null,
  status public.publish_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger brand_collabs_set_updated_at
before update on public.brand_collabs
for each row execute function public.set_updated_at();

create table public.trust_cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  metric text,
  status public.publish_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trust_cards_set_updated_at
before update on public.trust_cards
for each row execute function public.set_updated_at();

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text,
  status public.publish_status not null default 'draft',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger pages_set_updated_at
before update on public.pages
for each row execute function public.set_updated_at();

create table public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  location text not null,
  parent_id uuid references public.navigation_items(id) on delete cascade,
  label text not null,
  href text not null,
  status public.publish_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger navigation_items_set_updated_at
before update on public.navigation_items
for each row execute function public.set_updated_at();

create table public.footer_columns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status public.publish_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger footer_columns_set_updated_at
before update on public.footer_columns
for each row execute function public.set_updated_at();

create table public.footer_links (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references public.footer_columns(id) on delete cascade,
  label text not null,
  href text not null,
  status public.publish_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger footer_links_set_updated_at
before update on public.footer_links
for each row execute function public.set_updated_at();

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  guest_token text unique,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_owner_check check (user_id is not null or guest_token is not null)
);

create trigger carts_set_updated_at
before update on public.carts
for each row execute function public.set_updated_at();

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  quantity integer not null,
  personalization jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_items_quantity_positive check (quantity > 0),
  unique (cart_id, variant_id, personalization)
);

create trigger cart_items_set_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  customer_email text not null,
  customer_phone text,
  shipping_address jsonb not null,
  billing_address jsonb,
  subtotal_amount integer not null,
  discount_amount integer not null default 0,
  shipping_amount integer not null default 0,
  total_amount integer not null,
  currency text not null default 'INR',
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_amounts_non_negative check (
    subtotal_amount >= 0
    and discount_amount >= 0
    and shipping_amount >= 0
    and total_amount >= 0
  )
);

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  title_snapshot text not null,
  sku_snapshot text,
  unit_price_amount integer not null,
  quantity integer not null,
  total_amount integer not null,
  created_at timestamptz not null default now(),
  constraint order_items_amounts_positive check (
    unit_price_amount >= 0
    and quantity > 0
    and total_amount >= 0
  )
);

create or replace function public.reserve_inventory(
  p_variant_id uuid,
  p_location_id uuid,
  p_quantity integer,
  p_reference_id uuid default null,
  p_actor_id uuid default null
)
returns table(success boolean, remaining integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Invalid reservation quantity';
  end if;

  update public.inventory_stock
  set
    quantity_available = quantity_available - p_quantity,
    quantity_reserved = quantity_reserved + p_quantity
  where variant_id = p_variant_id
    and location_id = p_location_id
    and quantity_available >= p_quantity
  returning quantity_available into remaining;

  if not found then
    success := false;
    remaining := null;
    return next;
    return;
  end if;

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
    p_variant_id,
    p_location_id,
    'reservation',
    -p_quantity,
    'Checkout stock reservation',
    p_reference_id,
    p_actor_id
  );

  success := true;
  return next;
end;
$$;

create index brands_status_sort_idx on public.brands(status, sort_order, name);
create index categories_status_sort_idx on public.categories(status, sort_order, name);
create index products_brand_category_status_idx on public.products(brand_id, category_id, status);
create index products_status_updated_idx on public.products(status, updated_at desc);
create index product_variants_product_idx on public.product_variants(product_id);
create index product_media_product_sort_idx on public.product_media(product_id, sort_order);
create index product_specifications_product_sort_idx on public.product_specifications(product_id, sort_order);
create index inventory_stock_location_idx on public.inventory_stock(location_id);
create index stock_movements_variant_created_idx on public.stock_movements(variant_id, created_at desc);
create index carts_user_status_idx on public.carts(user_id, status);
create index carts_guest_status_idx on public.carts(guest_token, status);
create index cart_items_cart_idx on public.cart_items(cart_id);
create index orders_user_created_idx on public.orders(user_id, created_at desc);
create index orders_status_created_idx on public.orders(status, created_at desc);
create index media_assets_folder_idx on public.media_assets(folder);
create index pages_slug_status_idx on public.pages(slug, status);
create index navigation_items_location_status_sort_idx on public.navigation_items(location, status, sort_order);

alter table public.profiles enable row level security;
alter table public.admin_invites enable row level security;
alter table public.audit_logs enable row level security;
alter table public.media_assets enable row level security;
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_media enable row level security;
alter table public.product_specifications enable row level security;
alter table public.offers enable row level security;
alter table public.product_offer_links enable row level security;
alter table public.inventory_locations enable row level security;
alter table public.inventory_stock enable row level security;
alter table public.stock_movements enable row level security;
alter table public.home_sections enable row level security;
alter table public.hero_slides enable row level security;
alter table public.home_collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.warehouse_slides enable row level security;
alter table public.brand_collabs enable row level security;
alter table public.trust_cards enable row level security;
alter table public.pages enable row level security;
alter table public.navigation_items enable row level security;
alter table public.footer_columns enable row level security;
alter table public.footer_links enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "Profiles can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "Profiles can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "Admins manage profiles"
on public.profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage admin invites"
on public.admin_invites for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins read audit logs"
on public.audit_logs for select
to authenticated
using (public.is_admin());

create policy "Admins insert audit logs"
on public.audit_logs for insert
to authenticated
with check (public.is_editor_or_admin() or public.is_support_or_admin());

create policy "Public read media"
on public.media_assets for select
to anon, authenticated
using (true);

create policy "Editors manage media"
on public.media_assets for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

create policy "Public read published brands"
on public.brands for select
to anon, authenticated
using (status = 'published' or public.is_editor_or_admin());

create policy "Editors manage brands"
on public.brands for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

create policy "Public read published categories"
on public.categories for select
to anon, authenticated
using (status = 'published' or public.is_editor_or_admin());

create policy "Editors manage categories"
on public.categories for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

create policy "Public read published products"
on public.products for select
to anon, authenticated
using (status = 'published' or public.is_editor_or_admin());

create policy "Editors manage products"
on public.products for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

create policy "Public read published product variants"
on public.product_variants for select
to anon, authenticated
using (
  exists (
    select 1 from public.products
    where products.id = product_variants.product_id
      and (products.status = 'published' or public.is_editor_or_admin())
  )
);

create policy "Editors manage product variants"
on public.product_variants for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

create policy "Public read product media"
on public.product_media for select
to anon, authenticated
using (
  exists (
    select 1 from public.products
    where products.id = product_media.product_id
      and (products.status = 'published' or public.is_editor_or_admin())
  )
);

create policy "Editors manage product media"
on public.product_media for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

create policy "Public read product specifications"
on public.product_specifications for select
to anon, authenticated
using (
  exists (
    select 1 from public.products
    where products.id = product_specifications.product_id
      and (products.status = 'published' or public.is_editor_or_admin())
  )
);

create policy "Editors manage product specifications"
on public.product_specifications for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

create policy "Public read published offers"
on public.offers for select
to anon, authenticated
using (status = 'published' or public.is_editor_or_admin());

create policy "Editors manage offers"
on public.offers for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

create policy "Public read product offer links"
on public.product_offer_links for select
to anon, authenticated
using (true);

create policy "Editors manage product offer links"
on public.product_offer_links for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

create policy "Editors manage inventory locations"
on public.inventory_locations for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

create policy "Editors manage inventory stock"
on public.inventory_stock for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

create policy "Editors read stock movements"
on public.stock_movements for select
to authenticated
using (public.is_editor_or_admin());

create policy "Editors insert stock movements"
on public.stock_movements for insert
to authenticated
with check (public.is_editor_or_admin());

create policy "Public read published home sections"
on public.home_sections for select
to anon, authenticated
using (status = 'published' or public.is_editor_or_admin());

create policy "Editors manage home sections"
on public.home_sections for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

create policy "Public read published hero slides"
on public.hero_slides for select
to anon, authenticated
using (status = 'published' or public.is_editor_or_admin());

create policy "Editors manage hero slides"
on public.hero_slides for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

create policy "Public read published home collections"
on public.home_collections for select
to anon, authenticated
using (status = 'published' or public.is_editor_or_admin());

create policy "Editors manage home collections"
on public.home_collections for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

create policy "Public read published collection items"
on public.collection_items for select
to anon, authenticated
using (status = 'published' or public.is_editor_or_admin());

create policy "Editors manage collection items"
on public.collection_items for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

create policy "Public read published warehouse slides"
on public.warehouse_slides for select
to anon, authenticated
using (status = 'published' or public.is_editor_or_admin());

create policy "Editors manage warehouse slides"
on public.warehouse_slides for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

create policy "Public read published brand collabs"
on public.brand_collabs for select
to anon, authenticated
using (status = 'published' or public.is_editor_or_admin());

create policy "Editors manage brand collabs"
on public.brand_collabs for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

create policy "Public read published trust cards"
on public.trust_cards for select
to anon, authenticated
using (status = 'published' or public.is_editor_or_admin());

create policy "Editors manage trust cards"
on public.trust_cards for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

create policy "Public read published pages"
on public.pages for select
to anon, authenticated
using (status = 'published' or public.is_editor_or_admin());

create policy "Editors manage pages"
on public.pages for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

create policy "Public read published navigation"
on public.navigation_items for select
to anon, authenticated
using (status = 'published' or public.is_editor_or_admin());

create policy "Editors manage navigation"
on public.navigation_items for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

create policy "Public read published footer columns"
on public.footer_columns for select
to anon, authenticated
using (status = 'published' or public.is_editor_or_admin());

create policy "Editors manage footer columns"
on public.footer_columns for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

create policy "Public read published footer links"
on public.footer_links for select
to anon, authenticated
using (status = 'published' or public.is_editor_or_admin());

create policy "Editors manage footer links"
on public.footer_links for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

create policy "Users read own carts"
on public.carts for select
to authenticated
using (user_id = auth.uid() or public.is_support_or_admin());

create policy "Users manage own carts"
on public.carts for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users read own cart items"
on public.cart_items for select
to authenticated
using (
  exists (
    select 1 from public.carts
    where carts.id = cart_items.cart_id
      and (carts.user_id = auth.uid() or public.is_support_or_admin())
  )
);

create policy "Users manage own cart items"
on public.cart_items for all
to authenticated
using (
  exists (
    select 1 from public.carts
    where carts.id = cart_items.cart_id
      and carts.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.carts
    where carts.id = cart_items.cart_id
      and carts.user_id = auth.uid()
  )
);

create policy "Users read own orders"
on public.orders for select
to authenticated
using (user_id = auth.uid() or public.is_support_or_admin());

create policy "Support manage orders"
on public.orders for all
to authenticated
using (public.is_support_or_admin())
with check (public.is_support_or_admin());

create policy "Users read own order items"
on public.order_items for select
to authenticated
using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and (orders.user_id = auth.uid() or public.is_support_or_admin())
  )
);

create policy "Support manage order items"
on public.order_items for all
to authenticated
using (public.is_support_or_admin())
with check (public.is_support_or_admin());
