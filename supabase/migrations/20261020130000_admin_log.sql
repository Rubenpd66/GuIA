-- Record of what an administrator did (e.g. deleted an account). Written only by the server
-- with the secret key: RLS is on and no policy exists, and the Data API roles have no grant,
-- so nothing reaches it from a browser. It stores ids, never emails.
create table public.admin_log (
  id bigint generated always as identity primary key,
  admin_id uuid not null,
  action text not null check (action in ('delete_user')),
  target_id uuid,
  created_at timestamptz not null default now()
);

alter table public.admin_log enable row level security;
revoke all on public.admin_log from anon, authenticated;
