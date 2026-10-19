-- Study data synced from the browser: one row per user and store (progress, flashcards,
-- exam date, mock exam). The browser stays the source of truth while offline; these rows let
-- a signed-in learner carry it between devices.

create table public.user_data (
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null check (key in ('progress', 'flashcards', 'exam-date', 'mock')),
  value jsonb not null,
  -- When the device saved it (ms since epoch), used to merge two copies.
  updated_at bigint not null,
  -- When the server received it.
  saved_at timestamptz not null default now(),
  primary key (user_id, key),
  -- Keeps the table from becoming free file storage (the real data is a few tens of KB).
  constraint user_data_value_size check (pg_column_size(value) <= 524288)
);

comment on table public.user_data is
  'Per-user study data synced from the browser. Owner-only access through RLS.';

alter table public.user_data enable row level security;

-- New tables are not exposed to the Data API automatically: grant only what the app uses.
revoke all on public.user_data from anon, authenticated;
grant select, insert, update, delete on public.user_data to authenticated;

create policy "Owners read their study data"
  on public.user_data for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Owners add their study data"
  on public.user_data for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Owners update their study data"
  on public.user_data for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Owners delete their study data"
  on public.user_data for delete
  to authenticated
  using ((select auth.uid()) = user_id);
