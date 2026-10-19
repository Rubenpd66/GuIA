-- Supabase's "enable RLS automatically" option installs public.rls_auto_enable() for the
-- `ensure_rls` event trigger. The trigger keeps working, but the function must not be callable
-- through the Data API (/rest/v1/rpc), so nobody but the system can run it.
do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
