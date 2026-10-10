-- Provider passwords/tokens remain in Auth. App evidence binds verified purpose to a live OTP session.
create table stockos_private.password_purposes (
  session_id uuid primary key references auth.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null check (purpose in ('invite', 'recovery')),
  expires_at timestamptz not null,
  phase text not null default 'ready' check (phase in ('ready', 'updating', 'password_updated'))
);
alter table stockos_private.password_purposes enable row level security;
revoke all on stockos_private.password_purposes from public, anon, authenticated;

create function public.stockos_register_password_purpose(p_user uuid, p_session uuid, p_purpose text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if p_purpose is null or p_purpose not in ('invite', 'recovery') or not exists (
    select 1 from auth.sessions s join auth.users u on u.id = s.user_id
    join stockos_private.owner_registration r on r.auth_user_id = u.id
    where s.id = p_session and u.id = p_user and r.id = 1 and r.state = 'bound'
      and u.email_confirmed_at is not null and (s.not_after is null or s.not_after > now())
      and exists (select 1 from auth.mfa_amr_claims m where m.session_id = s.id and m.authentication_method = 'otp')
      and not exists (select 1 from auth.mfa_amr_claims m where m.session_id = s.id and m.authentication_method = 'password')
  ) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  insert into stockos_private.password_purposes(session_id, user_id, purpose, expires_at)
    values (p_session, p_user, p_purpose, now() + interval '1 hour') on conflict do nothing;
  if not exists (select 1 from stockos_private.password_purposes where session_id=p_session and user_id=p_user and purpose=p_purpose and expires_at > now())
    then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  return true;
end $$;

create function stockos_private.password_context(p_purpose text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_owner jsonb;
begin
  v_owner := stockos_private.owner_context(false);
  if not exists (select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr', '[]'::jsonb)) m where m->>'method' = 'otp')
    or not exists (select 1 from stockos_private.password_purposes where session_id=(auth.jwt()->>'session_id')::uuid
      and user_id=auth.uid() and purpose=p_purpose and expires_at > now())
  then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  return v_owner;
end $$;

create or replace function public.stockos_owner_invitation()
returns jsonb language sql security definer set search_path = '' as $$ select stockos_private.password_context('invite'); $$;
create function public.stockos_owner_recovery()
returns jsonb language sql security definer set search_path = '' as $$ select stockos_private.password_context('recovery'); $$;

create function public.stockos_begin_password_completion(p_purpose text)
returns text language plpgsql security definer set search_path = '' as $$
declare v_phase text;
begin
  perform stockos_private.password_context(p_purpose);
  select phase into v_phase from stockos_private.password_purposes where session_id=(auth.jwt()->>'session_id')::uuid for update;
  if v_phase='ready' then
    update stockos_private.password_purposes set phase='updating' where session_id=(auth.jwt()->>'session_id')::uuid;
    return 'claimed';
  end if;
  return v_phase;
end $$;

create function public.stockos_finish_password_completion(p_user uuid, p_session uuid, p_purpose text, p_updated boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if p_updated is null then raise exception 'VALIDATION_ERROR'; end if;
  update stockos_private.password_purposes set phase=case when p_updated then 'password_updated' else 'ready' end
    where session_id=p_session and user_id=p_user and purpose=p_purpose and phase='updating' and expires_at > now();
  if not found then raise exception 'RECOVERY_INCOMPLETE'; end if;
  return true;
end $$;

create function public.stockos_recovery_owner_email(p_email text)
returns text language sql security definer set search_path = '' as $$
  select u.email from stockos_private.owner_registration r join auth.users u on u.id=r.auth_user_id
    where r.id=1 and r.state='bound' and u.email_confirmed_at is not null and lower(u.email)=p_email;
$$;

revoke all on function stockos_private.password_context(text),
  public.stockos_register_password_purpose(uuid,uuid,text), public.stockos_owner_recovery(),
  public.stockos_begin_password_completion(text), public.stockos_finish_password_completion(uuid,uuid,text,boolean),
  public.stockos_recovery_owner_email(text) from public, anon, authenticated;
grant execute on function public.stockos_register_password_purpose(uuid,uuid,text),
  public.stockos_finish_password_completion(uuid,uuid,text,boolean), public.stockos_recovery_owner_email(text) to service_role;
grant execute on function public.stockos_owner_recovery(), public.stockos_begin_password_completion(text) to authenticated;
