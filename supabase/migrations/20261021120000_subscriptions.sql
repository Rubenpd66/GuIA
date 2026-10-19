-- A learner's paid plan, one row per user. Only the server writes it (the Stripe webhook and
-- account deletion, with the secret key); the learner can read their own row so the browser
-- can show which content is unlocked. Access itself is always decided on the server.

create table public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tier text not null check (tier in ('b1', 'b2', 'c1')),
  interval text not null check (interval in ('month', 'year')),
  -- Stripe's subscription status (active, trialing, past_due, canceled, unpaid…).
  status text not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  updated_at timestamptz not null default now()
);

comment on table public.subscriptions is
  'Paid plan per user, written only by the server. Owner-read access through RLS.';

alter table public.subscriptions enable row level security;

-- New tables are not exposed to the Data API automatically: grant only reading.
revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;

create policy "Owners read their subscription"
  on public.subscriptions for select
  to authenticated
  using ((select auth.uid()) = user_id);
