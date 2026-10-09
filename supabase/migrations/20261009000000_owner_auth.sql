create schema if not exists stockos_private;
revoke all on schema stockos_private from public, anon, authenticated;
alter default privileges in schema stockos_private revoke all on tables from public, anon, authenticated;
alter default privileges in schema stockos_private revoke execute on functions from public, anon, authenticated;

create table stockos_private.shop_settings (
  id smallint primary key default 1 check (id = 1),
  name text not null check (length(btrim(name)) between 1 and 120),
  owner_name text not null check (length(btrim(owner_name)) between 1 and 120),
  address text check (length(address) <= 500),
  phone text check (length(phone) <= 40),
  timezone text not null check (timezone in ('Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura')),
  default_unit text not null default 'Pcs',
  default_min_stock bigint not null default 15 check (default_min_stock between 0 and 1000000000),
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table stockos_private.owner_registration (
  id smallint primary key default 1 check (id = 1),
  state text not null default 'unclaimed' check (state in ('unclaimed', 'provisioning', 'bound')),
  attempt_id uuid unique,
  email text check (length(email) <= 254 and email = lower(btrim(email))),
  auth_user_id uuid unique references auth.users(id) on delete restrict,
  provisioned_at timestamptz,
  bound_at timestamptz,
  updated_at timestamptz not null default now(),
  check ((state = 'unclaimed' and attempt_id is null and email is null and auth_user_id is null)
    or (state = 'provisioning' and attempt_id is not null and email is not null and auth_user_id is null)
    or (state = 'bound' and attempt_id is not null and email is not null and auth_user_id is not null))
);
insert into stockos_private.owner_registration(id) values (1);
create table stockos_private.auth_throttle (
  bucket text primary key check (length(bucket) <= 100),
  window_started_at timestamptz not null,
  attempts integer not null
);
alter table stockos_private.owner_registration enable row level security;
alter table stockos_private.shop_settings enable row level security;
alter table stockos_private.auth_throttle enable row level security;
revoke all on all tables in schema stockos_private from public, anon, authenticated;

create function public.stockos_auth_throttle(p_bucket text, p_limit integer, p_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_attempts integer;
begin
  if length(p_bucket) > 100 or p_limit not between 1 and 100 or p_seconds not between 1 and 3600 then
    raise exception 'VALIDATION_ERROR';
  end if;
  insert into stockos_private.auth_throttle as t values (p_bucket, clock_timestamp(), 1)
  on conflict (bucket) do update set
    attempts = case when t.window_started_at < clock_timestamp() - make_interval(secs => p_seconds) then 1 else t.attempts + 1 end,
    window_started_at = case when t.window_started_at < clock_timestamp() - make_interval(secs => p_seconds) then clock_timestamp() else t.window_started_at end
  returning attempts into v_attempts;
  return v_attempts <= p_limit;
end $$;

create function public.stockos_claim_owner(p_email text, p_name text, p_shop text, p_timezone text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r stockos_private.owner_registration; v_attempt uuid;
begin
  if p_email is null or p_email <> lower(btrim(p_email)) or length(p_email) not between 3 and 254
    or p_name is null or length(btrim(p_name)) not between 1 and 120
    or p_shop is null or length(btrim(p_shop)) not between 1 and 120
    or p_timezone is null or p_timezone not in ('Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura') then
    raise exception 'VALIDATION_ERROR';
  end if;
  select * into r from stockos_private.owner_registration where id = 1 for update;
  if r.state = 'bound' then return jsonb_build_object('state', 'closed'); end if;
  if r.state = 'provisioning' then
    if r.email <> p_email then return jsonb_build_object('state', 'pending'); end if;
    return jsonb_build_object('state', 'resume', 'attemptId', r.attempt_id, 'email', r.email);
  end if;
  v_attempt := gen_random_uuid();
  update stockos_private.owner_registration set state = 'provisioning', attempt_id = v_attempt,
    email = p_email, updated_at = now() where id = 1;
  insert into stockos_private.shop_settings(id, name, owner_name, timezone)
    values (1, btrim(p_shop), btrim(p_name), p_timezone);
  return jsonb_build_object('state', 'claimed', 'attemptId', v_attempt, 'email', p_email);
end $$;

create function public.stockos_reconcile_owner(p_attempt uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare r stockos_private.owner_registration; v_user uuid;
begin
  select * into r from stockos_private.owner_registration where id = 1 for update;
  if r.attempt_id is distinct from p_attempt then raise exception 'SETUP_PENDING'; end if;
  if r.state = 'bound' then return r.auth_user_id; end if;
  select id into v_user from auth.users where lower(email) = r.email
    and raw_user_meta_data ->> 'stockos_attempt_id' = p_attempt::text and invited_at is not null;
  if v_user is null then return null; end if;
  update stockos_private.owner_registration set state = 'bound', auth_user_id = v_user,
    provisioned_at = now(), bound_at = now(), updated_at = now() where id = 1;
  return v_user;
end $$;

create function public.stockos_pending_owner(p_email text)
returns uuid language sql security definer set search_path = '' as $$
  select r.auth_user_id from stockos_private.owner_registration r join auth.users u on u.id = r.auth_user_id
    where r.id = 1 and r.state = 'bound' and r.email = p_email and u.email_confirmed_at is null;
$$;

create function stockos_private.owner_context(p_password boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_claims jsonb := auth.jwt(); v_session text; v_user uuid := auth.uid(); v_context jsonb;
begin
  v_session := v_claims ->> 'session_id';
  if v_user is null or v_session is null or v_session !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    raise exception 'UNAUTHENTICATED' using errcode = '42501';
  end if;
  if not exists (select 1 from auth.sessions s where s.id = v_session::uuid and s.user_id = v_user
    and (s.not_after is null or s.not_after > now())) then
    raise exception 'UNAUTHENTICATED' using errcode = '42501';
  end if;
  if p_password and not exists (select 1 from jsonb_array_elements(coalesce(v_claims -> 'amr', '[]'::jsonb)) m
    where m ->> 'method' = 'password') then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  select jsonb_build_object('id', u.id, 'email', u.email, 'name', s.owner_name) into v_context
    from stockos_private.owner_registration r join auth.users u on u.id = r.auth_user_id
    join stockos_private.shop_settings s on s.id = r.id
    where r.id = 1 and r.state = 'bound' and r.auth_user_id = v_user and u.email_confirmed_at is not null;
  if v_context is null then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  return v_context;
end $$;

create function public.stockos_owner_session()
returns jsonb language sql security definer set search_path = '' as $$
  select stockos_private.owner_context(true);
$$;
create function public.stockos_owner_invitation()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_context jsonb;
begin
  v_context := stockos_private.owner_context(false);
  if not exists (select 1 from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) m
    where m ->> 'method' = 'otp') then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return v_context;
end $$;

revoke all on function stockos_private.owner_context(boolean) from public, anon, authenticated;
revoke all on function public.stockos_auth_throttle(text, integer, integer),
  public.stockos_claim_owner(text, text, text, text), public.stockos_reconcile_owner(uuid),
  public.stockos_pending_owner(text), public.stockos_owner_session(), public.stockos_owner_invitation()  from public, anon, authenticated;
grant execute on function public.stockos_auth_throttle(text, integer, integer),
  public.stockos_claim_owner(text, text, text, text), public.stockos_reconcile_owner(uuid),
  public.stockos_pending_owner(text) to service_role;
grant execute on function public.stockos_owner_session(), public.stockos_owner_invitation() to authenticated;
