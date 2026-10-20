-- Monthly AI-feedback usage per learner: counts and tokens only, never the texts. Only the
-- server writes it, through the three functions below with the secret key; the learner can
-- read their own rows to see how many corrections they have left.

create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  month date not null,
  uses int not null default 0 check (uses >= 0),
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  primary key (user_id, month)
);

comment on table public.ai_usage is
  'AI feedback uses and tokens per user and UTC month. Written only by the server.';

alter table public.ai_usage enable row level security;

revoke all on public.ai_usage from anon, authenticated;
grant select on public.ai_usage to authenticated;

create policy "Owners read their usage"
  on public.ai_usage for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Takes one use if the learner is under their cap and the month's spend is under budget.
-- The upsert's WHERE makes two simultaneous requests at the cap let only one through.
create function public.ai_reserve(
  p_user uuid,
  p_cap int,
  p_budget_usd numeric,
  p_in_price numeric,
  p_out_price numeric
) returns table (out_status text, out_month date, out_uses int)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_month date := (date_trunc('month', now() at time zone 'utc'))::date;
  v_spend numeric;
  v_uses int;
begin
  if p_cap <= 0 then
    return query select 'limit'::text, v_month, 0;
    return;
  end if;

  select coalesce(sum(u.input_tokens * p_in_price + u.output_tokens * p_out_price), 0) / 1000000
    into v_spend
    from public.ai_usage u
    where u.month = v_month;
  if v_spend >= p_budget_usd then
    return query select 'budget'::text, v_month, 0;
    return;
  end if;

  insert into public.ai_usage as t (user_id, month, uses)
    values (p_user, v_month, 1)
    on conflict (user_id, month) do update set uses = t.uses + 1
      where t.uses < p_cap
    returning t.uses into v_uses;

  if v_uses is null then
    return query select 'limit'::text, v_month, p_cap;
  else
    return query select 'ok'::text, v_month, v_uses;
  end if;
end;
$$;

create function public.ai_settle(p_user uuid, p_month date, p_in bigint, p_out bigint)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.ai_usage
    set input_tokens = input_tokens + p_in, output_tokens = output_tokens + p_out
    where user_id = p_user and month = p_month;
$$;

-- Gives the use back when the call failed.
create function public.ai_release(p_user uuid, p_month date)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.ai_usage
    set uses = greatest(uses - 1, 0)
    where user_id = p_user and month = p_month;
$$;

revoke execute on function public.ai_reserve(uuid, int, numeric, numeric, numeric)
  from public, anon, authenticated;
revoke execute on function public.ai_settle(uuid, date, bigint, bigint)
  from public, anon, authenticated;
revoke execute on function public.ai_release(uuid, date)
  from public, anon, authenticated;
grant execute on function public.ai_reserve(uuid, int, numeric, numeric, numeric) to service_role;
grant execute on function public.ai_settle(uuid, date, bigint, bigint) to service_role;
grant execute on function public.ai_release(uuid, date) to service_role;
