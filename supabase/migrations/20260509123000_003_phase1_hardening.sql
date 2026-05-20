-- 003_phase1_hardening
-- Tightens Phase 1 RLS/data-integrity rules before Phase 2 starts.
-- No table drops, no column drops, and no data rewrites.

-- Customers can submit reviews, but moderation state must stay controlled by
-- support/admin paths. Remove direct customer update/delete access so a browser
-- session cannot self-publish or mark a review as verified.
drop policy if exists "Users update own reviews" on public.reviews;
drop policy if exists "Users delete own reviews" on public.reviews;

-- Customers can reply to their own ticket, but cannot spoof another profile or
-- visible email snapshot. Internal notes remain support/admin only.
drop policy if exists "Users post non-internal replies on own tickets"
on public.support_messages;

create policy "Users post non-internal replies on own tickets"
on public.support_messages for insert
to authenticated
with check (
  is_internal = false
  and author_id = auth.uid()
  and (
    author_email is null
    or lower(author_email) = lower(auth.jwt() ->> 'email')
  )
  and exists (
    select 1
    from public.support_tickets t
    where t.id = support_messages.ticket_id
      and t.user_id = auth.uid()
  )
);

-- Keep checkout/address selection deterministic. The future address API should
-- unset the old default before setting a new default for the same user.
create unique index if not exists addresses_user_default_shipping_unique
on public.addresses(user_id)
where is_default_shipping = true;

create unique index if not exists addresses_user_default_billing_unique
on public.addresses(user_id)
where is_default_billing = true;
