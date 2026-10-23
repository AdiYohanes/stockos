-- Only unused products may be deleted; stock evidence remains protected by its restrictive FK.
alter table stockos_private.mutation_requests drop constraint mutation_requests_operation_check;
alter table stockos_private.mutation_requests add constraint mutation_requests_operation_check check (operation in (
  'create_product', 'update_product', 'archive_product', 'reactivate_product', 'delete_product',
  'record_stock_in', 'record_stock_out', 'record_opname', 'adjust_inventory_cost', 'update_shop_settings'
));
alter table stockos_private.administrative_events drop constraint administrative_events_kind_check;
alter table stockos_private.administrative_events add constraint administrative_events_kind_check check (kind in (
  'product_created', 'product_updated', 'product_archived', 'product_reactivated', 'product_deleted',
  'settings_updated', 'photo_added', 'photo_replaced', 'photo_removed'
));
alter table stockos_private.administrative_events drop constraint administrative_events_product_kind_match;
alter table stockos_private.administrative_events add constraint administrative_events_product_kind_match check (
  (kind = 'settings_updated' and product_id is null) or
  (kind <> 'settings_updated' and (product_id is not null or
    (jsonb_typeof(changes -> 'deletedProduct') = 'object' and
      jsonb_typeof(changes -> 'deletedProduct' -> 'id') = 'string' and
      changes -> 'deletedProduct' ->> 'id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') is true))
);

create function public.stockos_delete_product(p_input jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid; v_request uuid; v_id uuid; v_metadata bigint; v_stock bigint;
  v_hash text; v_payload jsonb; v_previous stockos_private.mutation_requests;
  p stockos_private.products; v_snapshot jsonb; v_admin uuid; v_result jsonb;
begin
  v_actor := (stockos_private.owner_context(true) ->> 'id')::uuid;
  perform stockos_private.allowed_keys(p_input, array['requestId','productId','expectedMetadataVersion','expectedStockVersion']);
  v_request := stockos_private.input_uuid(p_input, 'requestId');
  v_id := stockos_private.input_uuid(p_input, 'productId');
  v_metadata := stockos_private.input_version(p_input, 'expectedMetadataVersion');
  v_stock := stockos_private.input_version(p_input, 'expectedStockVersion');
  if v_metadata is null or v_stock is null then raise exception 'VALIDATION_ERROR'; end if;
  v_payload := jsonb_build_object('productId', v_id, 'expectedMetadataVersion', v_metadata::text, 'expectedStockVersion', v_stock::text);
  v_hash := encode(sha256(convert_to(v_payload::text, 'UTF8')), 'hex');
  insert into stockos_private.mutation_requests(request_id, actor_id, operation, payload_hash)
    values (v_request, v_actor, 'delete_product', v_hash) on conflict (request_id) do nothing;
  select * into v_previous from stockos_private.mutation_requests where request_id = v_request for update;
  if v_previous.actor_id <> v_actor or v_previous.operation <> 'delete_product' or v_previous.payload_hash <> v_hash then
    raise exception 'REQUEST_ID_CONFLICT';
  end if;
  -- Replay before lookup: the original product no longer exists after a committed deletion.
  if v_previous.result is not null then return v_previous.result || jsonb_build_object('replayed', true); end if;
  select * into p from stockos_private.products where id = v_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if p.metadata_version <> v_metadata or p.stock_version <> v_stock then raise exception 'VERSION_CONFLICT'; end if;
  if p.current_stock <> 0 then raise exception 'PRODUCT_HAS_STOCK'; end if;
  if p.stock_version <> 0 or exists (select 1 from stockos_private.inventory_events where product_id = p.id) then
    raise exception 'PRODUCT_HAS_HISTORY';
  end if;
  v_snapshot := stockos_private.product_dto(p);
  -- Keep original administrative changes and identity, rather than cascading away evidence.
  update stockos_private.administrative_events
    set product_id = null, changes = changes || jsonb_build_object('deletedProduct', v_snapshot)
    where product_id = p.id;
  insert into stockos_private.administrative_events(kind, product_id, actor_id, request_id, changes)
    values ('product_deleted', null, v_actor, v_request, jsonb_build_object('deletedProduct', v_snapshot)) returning id into v_admin;
  delete from stockos_private.products where id = p.id;
  v_result := jsonb_build_object('ok', true, 'requestId', v_request, 'replayed', false,
    'data', jsonb_build_object('product', v_snapshot, 'eventId', null, 'administrativeEventId', v_admin));
  update stockos_private.mutation_requests set result = v_result, completed_at = clock_timestamp() where request_id = v_request;
  return v_result;
exception when others then
  if sqlerrm = 'PRODUCT_HAS_HISTORY' then
    return jsonb_build_object('ok', false, 'code', 'PRODUCT_HAS_HISTORY', 'message', 'PRODUCT_HAS_HISTORY');
  end if;
  return stockos_private.safe_failure(sqlerrm);
end $$;
revoke all on function public.stockos_delete_product(jsonb) from public, anon, authenticated;
grant execute on function public.stockos_delete_product(jsonb) to authenticated;
