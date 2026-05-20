-- 002_followups
-- Adds reviews, addresses, newsletter_subscribers, contact_messages,
-- support_tickets, and support_messages. Does not modify any existing table,
-- index, function, trigger, or RLS policy from migration 001.

create extension if not exists "citext";

-- ============================================================================
-- reviews
-- ============================================================================

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  rating integer not null,
  title text,
  body text,
  status public.publish_status not null default 'draft',
  verified_purchase boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_rating_range check (rating between 1 and 5)
);

create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

create index reviews_product_status_created_idx
  on public.reviews(product_id, status, created_at desc);

create index reviews_user_created_idx
  on public.reviews(user_id, created_at desc);

alter table public.reviews enable row level security;

create policy "Public read published reviews"
on public.reviews for select
to anon, authenticated
using (status = 'published' or public.is_support_or_admin());

create policy "Users insert own reviews"
on public.reviews for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users update own reviews"
on public.reviews for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users delete own reviews"
on public.reviews for delete
to authenticated
using (user_id = auth.uid());

create policy "Support manages reviews"
on public.reviews for all
to authenticated
using (public.is_support_or_admin())
with check (public.is_support_or_admin());

-- ============================================================================
-- addresses
-- ============================================================================

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text,
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  country text not null default 'IN',
  is_default_shipping boolean not null default false,
  is_default_billing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger addresses_set_updated_at
before update on public.addresses
for each row execute function public.set_updated_at();

create index addresses_user_idx on public.addresses(user_id);

alter table public.addresses enable row level security;

create policy "Users read own addresses"
on public.addresses for select
to authenticated
using (user_id = auth.uid() or public.is_support_or_admin());

create policy "Users insert own addresses"
on public.addresses for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users update own addresses"
on public.addresses for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users delete own addresses"
on public.addresses for delete
to authenticated
using (user_id = auth.uid());

create policy "Support manage addresses"
on public.addresses for all
to authenticated
using (public.is_support_or_admin())
with check (public.is_support_or_admin());

-- ============================================================================
-- newsletter_subscribers
-- ============================================================================

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  status text not null default 'pending',
  confirmation_token text,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint newsletter_subscribers_status_check
    check (status in ('pending', 'confirmed', 'unsubscribed', 'bounced'))
);

create trigger newsletter_subscribers_set_updated_at
before update on public.newsletter_subscribers
for each row execute function public.set_updated_at();

create index newsletter_subscribers_status_idx
  on public.newsletter_subscribers(status, created_at desc);

alter table public.newsletter_subscribers enable row level security;

create policy "Anyone can subscribe to newsletter"
on public.newsletter_subscribers for insert
to anon, authenticated
with check (true);

create policy "Editors manage newsletter"
on public.newsletter_subscribers for all
to authenticated
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

-- ============================================================================
-- contact_messages
-- ============================================================================

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'new',
  assigned_to uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_messages_status_check
    check (status in ('new', 'in_progress', 'resolved', 'spam'))
);

create trigger contact_messages_set_updated_at
before update on public.contact_messages
for each row execute function public.set_updated_at();

create index contact_messages_status_created_idx
  on public.contact_messages(status, created_at desc);

alter table public.contact_messages enable row level security;

create policy "Anyone can send a contact message"
on public.contact_messages for insert
to anon, authenticated
with check (true);

create policy "Support manages contact messages"
on public.contact_messages for all
to authenticated
using (public.is_support_or_admin())
with check (public.is_support_or_admin());

-- ============================================================================
-- support_tickets
-- ============================================================================

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  customer_email text not null,
  customer_name text,
  subject text not null,
  category text,
  status text not null default 'open',
  priority text not null default 'normal',
  assigned_to uuid references public.profiles(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_tickets_status_check
    check (status in ('open', 'pending', 'resolved', 'closed')),
  constraint support_tickets_priority_check
    check (priority in ('low', 'normal', 'high', 'urgent'))
);

create trigger support_tickets_set_updated_at
before update on public.support_tickets
for each row execute function public.set_updated_at();

create index support_tickets_user_created_idx
  on public.support_tickets(user_id, created_at desc);

create index support_tickets_status_created_idx
  on public.support_tickets(status, created_at desc);

create index support_tickets_assigned_idx
  on public.support_tickets(assigned_to);

alter table public.support_tickets enable row level security;

create policy "Users read own support tickets"
on public.support_tickets for select
to authenticated
using (user_id = auth.uid() or public.is_support_or_admin());

create policy "Users create own support tickets"
on public.support_tickets for insert
to authenticated
with check (user_id = auth.uid());

create policy "Support manages tickets"
on public.support_tickets for all
to authenticated
using (public.is_support_or_admin())
with check (public.is_support_or_admin());

-- ============================================================================
-- support_messages
-- ============================================================================

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  author_email text,
  body text not null,
  is_internal boolean not null default false,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index support_messages_ticket_created_idx
  on public.support_messages(ticket_id, created_at);

alter table public.support_messages enable row level security;

create policy "Users read non-internal messages on own tickets"
on public.support_messages for select
to authenticated
using (
  exists (
    select 1 from public.support_tickets t
    where t.id = support_messages.ticket_id
      and (
        public.is_support_or_admin()
        or (t.user_id = auth.uid() and is_internal = false)
      )
  )
);

create policy "Users post non-internal replies on own tickets"
on public.support_messages for insert
to authenticated
with check (
  is_internal = false
  and exists (
    select 1 from public.support_tickets t
    where t.id = support_messages.ticket_id
      and t.user_id = auth.uid()
  )
);

create policy "Support manages support messages"
on public.support_messages for all
to authenticated
using (public.is_support_or_admin())
with check (public.is_support_or_admin());
