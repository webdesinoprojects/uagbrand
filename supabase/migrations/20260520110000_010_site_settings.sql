create table public.site_settings (
  id boolean primary key default true,
  site_name text not null default 'ALLEARBUDS.COM',
  logo_media_id uuid references public.media_assets(id) on delete set null,
  contact_email text,
  contact_phone text,
  address_label text,
  footer_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id = true),
  constraint site_settings_site_name_not_blank check (length(btrim(site_name)) > 0)
);

create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

insert into public.site_settings (
  id,
  site_name,
  contact_email,
  contact_phone,
  address_label,
  footer_description
) values (
  true,
  'ALLEARBUDS.COM',
  'support@allearbuds.com',
  '+91 00000 00000',
  'India dispatch center',
  'AllEarbuds is structured as a fast ecommerce storefront for audio, wearables, charging products and daily mobile accessories.'
) on conflict (id) do nothing;

alter table public.site_settings enable row level security;

create policy "Public read site settings"
on public.site_settings for select
to anon, authenticated
using (true);

create policy "Editors manage site settings"
on public.site_settings for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());
