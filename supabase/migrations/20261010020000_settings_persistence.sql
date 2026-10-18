-- Ticket 6 Settings Persistence: allows updating shop_settings, records administrative audit events, and exposes secure owner RPCs.
alter table stockos_private.mutation_requests
  drop constraint if exists mutation_requests_operation_check;

alter table stockos_private.mutation_requests
  add constraint mutation_requests_operation_check
  check (operation in (
    'create_product', 'update_product', 'archive_product', 'reactivate_product',
    'record_stock_in', 'record_stock_out', 'record_opname', 'adjust_inventory_cost',
    'update_shop_settings'
  ));

alter table stockos_private.administrative_events
  drop constraint if exists administrative_events_kind_check;

alter table stockos_private.administrative_events
  alter column product_id drop not null;

alter table stockos_private.administrative_events
  add constraint administrative_events_kind_check
  check (kind in (
    'product_created', 'product_updated', 'product_archived', 'product_reactivated',
    'settings_updated'
  ));

alter table stockos_private.administrative_events
  drop constraint if exists administrative_events_product_kind_match;

alter table stockos_private.administrative_events
  add constraint administrative_events_product_kind_match
  check (
    (kind = 'settings_updated' and product_id is null) or
    (kind <> 'settings_updated' and product_id is not null)
  );

create or replace function stockos_private.shop_settings_dto(s stockos_private.shop_settings)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'name', s.name,
    'ownerName', s.owner_name,
    'address', s.address,
    'phone', s.phone,
    'timezone', s.timezone,
    'defaultUnit', s.default_unit,
    'defaultMinStock', s.default_min_stock,
    'version', s.version::text,
    'createdAt', to_char(s.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'updatedAt', to_char(s.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
  );
$$;

create or replace function public.stockos_get_shop_settings(p_input jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  s stockos_private.shop_settings;
begin
  perform stockos_private.owner_context(true);
  perform stockos_private.allowed_keys(p_input, array[]::text[]);
  select * into s from stockos_private.shop_settings where id = 1;
  if not found then raise exception 'NOT_FOUND'; end if;
  return jsonb_build_object('ok', true, 'data', stockos_private.shop_settings_dto(s));
exception when others then return stockos_private.safe_failure(sqlerrm);
end $$;

create or replace function public.stockos_update_shop_settings(p_input jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid;
  v_request uuid;
  v_expected_version bigint;
  v_name text;
  v_owner_name text;
  v_address text;
  v_phone text;
  v_timezone text;
  v_default_unit text;
  v_default_min_stock bigint;
  v_payload jsonb;
  v_hash text;
  v_previous stockos_private.mutation_requests;
  s stockos_private.shop_settings;
  v_before_payload jsonb;
  v_after_payload jsonb;
  v_admin uuid;
  v_result jsonb;
begin
  v_actor := (stockos_private.owner_context(true) ->> 'id')::uuid;
  perform stockos_private.allowed_keys(p_input, array['requestId', 'expectedVersion', 'name', 'ownerName', 'address', 'phone', 'timezone', 'defaultUnit', 'defaultMinStock']);
  v_request := stockos_private.input_uuid(p_input, 'requestId');
  v_expected_version := stockos_private.input_version(p_input, 'expectedVersion');
  v_name := stockos_private.input_text(p_input, 'name', 120, true);
  v_owner_name := stockos_private.input_text(p_input, 'ownerName', 120, true);
  v_address := stockos_private.input_text(p_input, 'address', 500);
  v_phone := stockos_private.input_text(p_input, 'phone', 40);
  v_timezone := stockos_private.input_text(p_input, 'timezone', 40, true);
  if v_timezone not in ('Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura') then
    raise exception 'VALIDATION_ERROR';
  end if;
  v_default_unit := stockos_private.input_text(p_input, 'defaultUnit', 30, true);
  v_default_min_stock := stockos_private.input_quantity(p_input, 'defaultMinStock', 0);

  v_payload := jsonb_build_object(
    'expectedVersion', v_expected_version::text,
    'name', v_name,
    'ownerName', v_owner_name,
    'address', v_address,
    'phone', v_phone,
    'timezone', v_timezone,
    'defaultUnit', v_default_unit,
    'defaultMinStock', v_default_min_stock
  );
  v_hash := encode(sha256(convert_to(v_payload::text, 'UTF8')), 'hex');

  insert into stockos_private.mutation_requests(request_id, actor_id, operation, payload_hash)
    values (v_request, v_actor, 'update_shop_settings', v_hash)
    on conflict (request_id) do nothing;

  select * into v_previous from stockos_private.mutation_requests where request_id = v_request for update;
  if v_previous.actor_id <> v_actor or v_previous.operation <> 'update_shop_settings' or v_previous.payload_hash <> v_hash then
    raise exception 'REQUEST_ID_CONFLICT';
  end if;

  if v_previous.result is not null then
    return v_previous.result || jsonb_build_object('replayed', true);
  end if;

  select * into s from stockos_private.shop_settings where id = 1 for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if s.version <> v_expected_version then raise exception 'VERSION_CONFLICT'; end if;

  v_before_payload := jsonb_build_object(
    'name', s.name,
    'ownerName', s.owner_name,
    'address', s.address,
    'phone', s.phone,
    'timezone', s.timezone,
    'defaultUnit', s.default_unit,
    'defaultMinStock', s.default_min_stock,
    'version', s.version::text
  );

  update stockos_private.shop_settings
    set name = v_name,
        owner_name = v_owner_name,
        address = v_address,
        phone = v_phone,
        timezone = v_timezone,
        default_unit = v_default_unit,
        default_min_stock = v_default_min_stock,
        version = s.version + 1,
        updated_at = clock_timestamp()
    where id = 1
    returning * into s;

  v_after_payload := jsonb_build_object(
    'name', s.name,
    'ownerName', s.owner_name,
    'address', s.address,
    'phone', s.phone,
    'timezone', s.timezone,
    'defaultUnit', s.default_unit,
    'defaultMinStock', s.default_min_stock,
    'version', s.version::text
  );

  insert into stockos_private.administrative_events(kind, product_id, actor_id, request_id, changes)
    values ('settings_updated', null, v_actor, v_request, jsonb_build_object('before', v_before_payload, 'after', v_after_payload))
    returning id into v_admin;

  v_result := jsonb_build_object(
    'ok', true,
    'requestId', v_request,
    'replayed', false,
    'data', jsonb_build_object(
      'settings', stockos_private.shop_settings_dto(s),
      'administrativeEventId', v_admin
    )
  );

  update stockos_private.mutation_requests
    set result = v_result, completed_at = clock_timestamp()
    where request_id = v_request;

  return v_result;
exception when others then
  return stockos_private.safe_failure(sqlerrm);
end $$;

revoke all on function public.stockos_get_shop_settings(jsonb), public.stockos_update_shop_settings(jsonb) from public, anon, authenticated;
grant execute on function public.stockos_get_shop_settings(jsonb), public.stockos_update_shop_settings(jsonb) to authenticated;
