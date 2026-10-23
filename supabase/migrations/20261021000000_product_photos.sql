-- Product photos: bucket objects only; the product row keeps small nullable references.
-- No bytea/base64 ever reaches PostgreSQL (docs/adr/0001-supabase-storage-for-product-photos.md).
alter table stockos_private.products
  add column photo_display_hash text,
  add column photo_display_bytes bigint,
  add column photo_display_width integer,
  add column photo_display_height integer,
  add column photo_thumb_hash text,
  add column photo_thumb_bytes bigint,
  add column photo_thumb_width integer,
  add column photo_thumb_height integer;
-- Content-addressed references: 64 hex chars, <= 128 KiB per variant, <= 512px display / 96px thumb.
alter table stockos_private.products
  add constraint products_photo_display_hash_check check (photo_display_hash is null or photo_display_hash ~ '^[0-9a-f]{64}$'),
  add constraint products_photo_display_bytes_check check (photo_display_bytes is null or photo_display_bytes between 1 and 131072),
  add constraint products_photo_display_width_check check (photo_display_width is null or photo_display_width between 1 and 512),
  add constraint products_photo_display_height_check check (photo_display_height is null or photo_display_height between 1 and 512),
  add constraint products_photo_thumb_hash_check check (photo_thumb_hash is null or photo_thumb_hash ~ '^[0-9a-f]{64}$'),
  add constraint products_photo_thumb_bytes_check check (photo_thumb_bytes is null or photo_thumb_bytes between 1 and 131072),
  add constraint products_photo_thumb_width_check check (photo_thumb_width is null or photo_thumb_width between 1 and 512),
  add constraint products_photo_thumb_height_check check (photo_thumb_height is null or photo_thumb_height between 1 and 512),
  -- Variant reference fields are always all-null or all-set together.
  add constraint products_photo_display_pair_check check (num_nonnulls(photo_display_hash, photo_display_bytes, photo_display_width, photo_display_height) in (0, 4)),
  add constraint products_photo_thumb_pair_check check (num_nonnulls(photo_thumb_hash, photo_thumb_bytes, photo_thumb_width, photo_thumb_height) in (0, 4)),
  add constraint products_photo_both_check check ((photo_display_hash is null) = (photo_thumb_hash is null)),
  add constraint products_photo_thumb_size_check check (photo_thumb_width <= 96 and photo_thumb_height <= 96);

alter table stockos_private.administrative_events drop constraint administrative_events_kind_check;
alter table stockos_private.administrative_events
  add constraint administrative_events_kind_check check (kind in
    ('product_created', 'product_updated', 'product_archived', 'product_reactivated',
     'settings_updated', 'photo_added', 'photo_replaced', 'photo_removed'));

-- Photo patch input: {"photo": {"display": {...}, "thumb": {...}}} to add/replace both variants,
-- or {"photo": null} to remove. Variants always arrive together; partial photos are not kept.
create function stockos_private.input_photo(p_photo jsonb)
returns jsonb language plpgsql set search_path = '' as $$
declare v_variant jsonb; v_key text;
begin
  if p_photo is null or p_photo = 'null'::jsonb then return null; end if;
  perform stockos_private.allowed_keys(p_photo, array['display','thumb']);
  if not (p_photo ? 'display' and p_photo ? 'thumb') then raise exception 'VALIDATION_ERROR'; end if;
  foreach v_key in array array['display','thumb'] loop
    v_variant := p_photo -> v_key;
    perform stockos_private.allowed_keys(v_variant, array['hash','bytes','width','height']);
    if not (v_variant ?& array['hash','bytes','width','height'])
      or jsonb_typeof(v_variant -> 'hash') is distinct from 'string'
      or v_variant ->> 'hash' !~ '^[0-9a-f]{64}$'
      or stockos_private.input_quantity(v_variant, 'bytes', 1) > 131072
      or stockos_private.input_quantity(v_variant, 'width', 1) > (case when v_key = 'display' then 512 else 96 end)
      or stockos_private.input_quantity(v_variant, 'height', 1) > (case when v_key = 'display' then 512 else 96 end) then
      raise exception 'VALIDATION_ERROR';
    end if;
  end loop;
  return p_photo;
end $$;

create function stockos_private.photo_hash(p_variant jsonb)
returns text language sql immutable set search_path = '' as $$
  select case when p_variant is null then null else p_variant ->> 'hash' end;
$$;

-- Full replacement of the creation seam: attributes + optional photo references.
create or replace function public.stockos_create_product(p_input jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid; v_request uuid; v_hash text; v_payload jsonb; v_previous stockos_private.mutation_requests; v_photo jsonb;
  p stockos_private.products; v_quantity bigint; v_cost numeric; v_cartons bigint; v_units bigint;
  v_event uuid; v_admin uuid; v_result jsonb;
begin
  v_actor := (stockos_private.owner_context(true) ->> 'id')::uuid;
  perform stockos_private.allowed_keys(p_input, array['requestId','sku','name','category','unit','sellingPrice','minStock','supplier','shelfLocation','barcode','description','openingQuantity','purchaseTotal','cartonCount','unitsPerCarton','photo']);
  v_request := stockos_private.input_uuid(p_input, 'requestId');
  p.sku := upper(stockos_private.input_text(p_input, 'sku', 64, true));
  if p.sku !~ '^[A-Z0-9_./-]{3,64}$' then raise exception 'VALIDATION_ERROR'; end if;
  p.name := stockos_private.input_text(p_input, 'name', 120, true);
  p.category := stockos_private.input_text(p_input, 'category', 120, true);
  p.unit := stockos_private.input_text(p_input, 'unit', 30, true);
  p.supplier := stockos_private.input_text(p_input, 'supplier', 120);
  p.shelf_location := stockos_private.input_text(p_input, 'shelfLocation', 80);
  p.barcode := stockos_private.input_text(p_input, 'barcode', 64);
  p.description := stockos_private.input_text(p_input, 'description', 2000);
  p.selling_price := stockos_private.input_money(p_input, 'sellingPrice');
  p.min_stock := stockos_private.input_quantity(p_input, 'minStock');
  v_quantity := stockos_private.input_quantity(p_input, 'openingQuantity', 0, 0);
  v_cost := stockos_private.input_money(p_input, 'purchaseTotal', v_quantity > 0);
  if v_quantity = 0 and coalesce(v_cost, 0) <> 0 then raise exception 'VALIDATION_ERROR'; end if;
  if p_input ? 'cartonCount' or p_input ? 'unitsPerCarton' then
    v_cartons := stockos_private.input_quantity(p_input, 'cartonCount', 1);
    v_units := stockos_private.input_quantity(p_input, 'unitsPerCarton', 1);
    if v_cartons::numeric * v_units <> v_quantity then raise exception 'VALIDATION_ERROR'; end if;
  end if;
  v_photo := stockos_private.input_photo(p_input -> 'photo');
  v_payload := jsonb_build_object('sku', p.sku, 'name', p.name, 'category', p.category, 'unit', p.unit,
    'sellingPrice', p.selling_price::text, 'minStock', p.min_stock, 'supplier', p.supplier, 'shelfLocation', p.shelf_location,
    'barcode', p.barcode, 'description', p.description, 'openingQuantity', v_quantity, 'purchaseTotal', coalesce(v_cost, 0)::text,
    'cartonCount', v_cartons, 'unitsPerCarton', v_units);
  if v_photo is not null then v_payload := v_payload || jsonb_build_object('photo', v_photo); end if;
  v_hash := encode(sha256(convert_to(v_payload::text, 'UTF8')), 'hex');
  insert into stockos_private.mutation_requests(request_id, actor_id, operation, payload_hash)
    values (v_request, v_actor, 'create_product', v_hash) on conflict (request_id) do nothing;
  select * into v_previous from stockos_private.mutation_requests where request_id = v_request for update;
  if v_previous.actor_id <> v_actor or v_previous.operation <> 'create_product' or v_previous.payload_hash <> v_hash then raise exception 'REQUEST_ID_CONFLICT'; end if;
  if v_previous.result is not null then return v_previous.result || jsonb_build_object('replayed', true); end if;
  begin
    insert into stockos_private.products(sku, name, category, unit, supplier, shelf_location, barcode, description,
      selling_price, min_stock, current_stock, inventory_cost_value, stock_version,
      photo_display_hash, photo_display_bytes, photo_display_width, photo_display_height,
      photo_thumb_hash, photo_thumb_bytes, photo_thumb_width, photo_thumb_height)
      values (p.sku, p.name, p.category, p.unit, p.supplier, p.shelf_location, p.barcode, p.description,
        p.selling_price, p.min_stock, v_quantity, coalesce(v_cost, 0), case when v_quantity > 0 then 1 else 0 end,
        stockos_private.photo_hash(v_photo -> 'display'), (v_photo -> 'display' ->> 'bytes')::bigint,
        (v_photo -> 'display' ->> 'width')::integer, (v_photo -> 'display' ->> 'height')::integer,
        stockos_private.photo_hash(v_photo -> 'thumb'), (v_photo -> 'thumb' ->> 'bytes')::bigint,
        (v_photo -> 'thumb' ->> 'width')::integer, (v_photo -> 'thumb' ->> 'height')::integer) returning * into p;
  exception when unique_violation then raise exception 'SKU_EXISTS'; end;
  insert into stockos_private.administrative_events(kind, product_id, actor_id, request_id, changes)
    values ('product_created', p.id, v_actor, v_request, jsonb_build_object('before', null, 'after', v_payload)) returning id into v_admin;
  if v_quantity > 0 then
    insert into stockos_private.inventory_events(product_id, kind, stock_version, quantity_before, quantity_after, quantity_delta,
      cost_before, cost_after, cost_delta, purchase_total, carton_count, units_per_carton, reference, actor_id, request_id,
      sku_snapshot, name_snapshot, unit_snapshot, supplier_snapshot, selling_price_snapshot)
      values (p.id, 'opening', 1, 0, v_quantity, v_quantity, 0, v_cost, v_cost, v_cost, v_cartons, v_units,
        'OPEN-' || v_request::text, v_actor, v_request, p.sku, p.name, p.unit, p.supplier, p.selling_price) returning id into v_event;
  end if;
  v_result := jsonb_build_object('ok', true, 'requestId', v_request, 'replayed', false,
    'data', jsonb_build_object('product', stockos_private.product_dto(p), 'eventId', v_event, 'administrativeEventId', v_admin));
  update stockos_private.mutation_requests set result = v_result, completed_at = clock_timestamp() where request_id = v_request;
  return v_result;
exception when others then
  -- This block rolls back the reservation, balance and evidence before returning.
  return stockos_private.safe_failure(sqlerrm);
end $$;

create or replace function stockos_private.product_dto(p stockos_private.products)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', p.id, 'sku', p.sku, 'name', p.name, 'category', p.category, 'unit', p.unit,
    'supplier', p.supplier, 'shelfLocation', p.shelf_location, 'barcode', p.barcode, 'description', p.description,
    'sellingPrice', p.selling_price::text, 'minStock', p.min_stock, 'currentStock', p.current_stock,
    'inventoryCostValue', p.inventory_cost_value::text,
    'averagePurchaseCost', case when p.current_stock > 0 then round(p.inventory_cost_value / p.current_stock, 6)::text else null end,
    'potentialSellingValue', (p.current_stock::numeric * p.selling_price)::text,
    'potentialGrossProfit', (p.current_stock::numeric * p.selling_price - p.inventory_cost_value)::text,
    'stockStatus', case when p.current_stock = 0 then 'out_of_stock' when p.current_stock <= p.min_stock then 'low_stock' else 'in_stock' end,
    'archivedAt', case when p.archived_at is not null then to_char(p.archived_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') end,
    'photo', case when p.photo_display_hash is null then null else jsonb_build_object(
      'display', jsonb_build_object('hash', p.photo_display_hash, 'bytes', p.photo_display_bytes,
        'width', p.photo_display_width, 'height', p.photo_display_height),
      'thumb', jsonb_build_object('hash', p.photo_thumb_hash, 'bytes', p.photo_thumb_bytes,
        'width', p.photo_thumb_width, 'height', p.photo_thumb_height)) end,
    'metadataVersion', p.metadata_version::text, 'stockVersion', p.stock_version::text,
    'createdAt', to_char(p.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'updatedAt', to_char(p.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'));
$$;

create or replace function stockos_private.product_mutation(p_operation text, p_input jsonb)
returns jsonb language plpgsql set search_path = '' as $$
declare v_actor uuid; v_request uuid; v_id uuid; v_metadata bigint; v_stock bigint; v_patch jsonb := '{}'::jsonb;
  v_keys text[] := array['sku','name','category','unit','sellingPrice','minStock','supplier','shelfLocation','barcode','description','photo'];
  v_key text; v_text text; v_limit integer; v_payload jsonb; v_hash text; v_previous stockos_private.mutation_requests;
  p stockos_private.products; v_before jsonb; v_changes jsonb; v_admin uuid; v_result jsonb; v_kind text;
begin
  v_actor := (stockos_private.owner_context(true) ->> 'id')::uuid;
  if p_operation = 'update_product' then
    perform stockos_private.allowed_keys(p_input, array['requestId','productId','expectedMetadataVersion','patch']);
    perform stockos_private.allowed_keys(p_input -> 'patch', v_keys);
    if p_input -> 'patch' = '{}'::jsonb then raise exception 'VALIDATION_ERROR'; end if;
    foreach v_key in array v_keys loop
      if not (p_input -> 'patch') ? v_key then continue; end if;
      if v_key = 'photo' then
        v_patch := v_patch || jsonb_build_object('photo', stockos_private.input_photo(p_input -> 'patch' -> 'photo'));
      elsif v_key = 'sellingPrice' then v_patch := v_patch || jsonb_build_object(v_key, stockos_private.input_money(p_input -> 'patch', v_key)::text);
      elsif v_key = 'minStock' then v_patch := v_patch || jsonb_build_object(v_key, stockos_private.input_quantity(p_input -> 'patch', v_key));
      else
        v_limit := case v_key when 'sku' then 64 when 'unit' then 30 when 'shelfLocation' then 80 when 'barcode' then 64 when 'description' then 2000 else 120 end;
        v_text := stockos_private.input_text(p_input -> 'patch', v_key, v_limit, v_key in ('sku','name','category','unit'));
        if v_key = 'sku' then
          v_text := upper(v_text);
          if v_text !~ '^[A-Z0-9_./-]{3,64}$' then raise exception 'VALIDATION_ERROR'; end if;
        end if;
        v_patch := v_patch || jsonb_build_object(v_key, v_text);
      end if;
    end loop;
    v_kind := 'product_updated';
  elsif p_operation = 'archive_product' then
    perform stockos_private.allowed_keys(p_input, array['requestId','productId','expectedMetadataVersion','expectedStockVersion']);
    v_stock := stockos_private.input_version(p_input, 'expectedStockVersion');
    v_kind := 'product_archived';
  elsif p_operation = 'reactivate_product' then
    perform stockos_private.allowed_keys(p_input, array['requestId','productId','expectedMetadataVersion']);
    v_kind := 'product_reactivated';
  else raise exception 'VALIDATION_ERROR'; end if;
  v_request := stockos_private.input_uuid(p_input, 'requestId');
  v_id := stockos_private.input_uuid(p_input, 'productId');
  v_metadata := stockos_private.input_version(p_input, 'expectedMetadataVersion');
  v_payload := jsonb_build_object('productId', v_id, 'expectedMetadataVersion', v_metadata::text, 'expectedStockVersion', v_stock::text, 'patch', v_patch);
  v_hash := encode(sha256(convert_to(v_payload::text, 'UTF8')), 'hex');
  insert into stockos_private.mutation_requests(request_id, actor_id, operation, payload_hash)
    values (v_request, v_actor, p_operation, v_hash) on conflict (request_id) do nothing;
  select * into v_previous from stockos_private.mutation_requests where request_id = v_request for update;
  if v_previous.actor_id <> v_actor or v_previous.operation <> p_operation or v_previous.payload_hash <> v_hash then raise exception 'REQUEST_ID_CONFLICT'; end if;
  if v_previous.result is not null then return v_previous.result || jsonb_build_object('replayed', true); end if;
  select * into p from stockos_private.products where id = v_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if p_operation <> 'reactivate_product' and p.archived_at is not null then raise exception 'PRODUCT_ARCHIVED'; end if;
  if p.metadata_version <> v_metadata or (v_stock is not null and p.stock_version <> v_stock) then raise exception 'VERSION_CONFLICT'; end if;
  v_before := stockos_private.product_dto(p);
  if p_operation = 'update_product' then
    if ((v_patch ? 'sku' and v_patch ->> 'sku' <> p.sku) or (v_patch ? 'unit' and v_patch ->> 'unit' <> p.unit))
      and exists (select 1 from stockos_private.inventory_events where product_id = p.id) then raise exception 'IDENTITY_LOCKED'; end if;
    p.sku := coalesce(v_patch ->> 'sku', p.sku);
    p.name := coalesce(v_patch ->> 'name', p.name);
    p.category := coalesce(v_patch ->> 'category', p.category);
    p.unit := coalesce(v_patch ->> 'unit', p.unit);
    p.selling_price := coalesce((v_patch ->> 'sellingPrice')::numeric, p.selling_price);
    p.min_stock := coalesce((v_patch ->> 'minStock')::bigint, p.min_stock);
    if v_patch ? 'supplier' then p.supplier := v_patch ->> 'supplier'; end if;
    if v_patch ? 'shelfLocation' then p.shelf_location := v_patch ->> 'shelfLocation'; end if;
    if v_patch ? 'barcode' then p.barcode := v_patch ->> 'barcode'; end if;
    if v_patch ? 'description' then p.description := v_patch ->> 'description'; end if;
    if v_patch ? 'photo' then
      -- Photo add/replace/remove follows the same optimistic-concurrency and audit rules as text metadata.
      if v_patch -> 'photo' -> 'display' is not null then
        if p.photo_display_hash is null then v_kind := 'photo_added';
        elsif p.photo_display_hash = (v_patch -> 'photo' -> 'display' ->> 'hash') and p.photo_thumb_hash = (v_patch -> 'photo' -> 'thumb' ->> 'hash') then
          v_kind := 'product_updated';
        else v_kind := 'photo_replaced'; end if;
        p.photo_display_hash := v_patch -> 'photo' -> 'display' ->> 'hash';
        p.photo_display_bytes := (v_patch -> 'photo' -> 'display' ->> 'bytes')::bigint;
        p.photo_display_width := (v_patch -> 'photo' -> 'display' ->> 'width')::integer;
        p.photo_display_height := (v_patch -> 'photo' -> 'display' ->> 'height')::integer;
        p.photo_thumb_hash := v_patch -> 'photo' -> 'thumb' ->> 'hash';
        p.photo_thumb_bytes := (v_patch -> 'photo' -> 'thumb' ->> 'bytes')::bigint;
        p.photo_thumb_width := (v_patch -> 'photo' -> 'thumb' ->> 'width')::integer;
        p.photo_thumb_height := (v_patch -> 'photo' -> 'thumb' ->> 'height')::integer;
      elsif p.photo_display_hash is not null then
        v_kind := 'photo_removed';
        p.photo_display_hash := null; p.photo_display_bytes := null; p.photo_display_width := null; p.photo_display_height := null;
        p.photo_thumb_hash := null; p.photo_thumb_bytes := null; p.photo_thumb_width := null; p.photo_thumb_height := null;
      end if;
    end if;
  elsif p_operation = 'archive_product' then
    if p.current_stock <> 0 then raise exception 'PRODUCT_HAS_STOCK'; end if;
    p.archived_at := clock_timestamp();
  else
    if p.archived_at is null then raise exception 'VERSION_CONFLICT'; end if;
    p.archived_at := null;
  end if;
  begin
    update stockos_private.products set sku = p.sku, name = p.name, category = p.category, unit = p.unit,
      selling_price = p.selling_price, min_stock = p.min_stock, supplier = p.supplier, shelf_location = p.shelf_location,
      barcode = p.barcode, description = p.description, archived_at = p.archived_at,
      photo_display_hash = p.photo_display_hash, photo_display_bytes = p.photo_display_bytes,
      photo_display_width = p.photo_display_width, photo_display_height = p.photo_display_height,
      photo_thumb_hash = p.photo_thumb_hash, photo_thumb_bytes = p.photo_thumb_bytes,
      photo_thumb_width = p.photo_thumb_width, photo_thumb_height = p.photo_thumb_height,
      metadata_version = metadata_version + 1, updated_at = clock_timestamp() where id = p.id returning * into p;
  exception when unique_violation then raise exception 'SKU_EXISTS'; end;
  if p_operation = 'update_product' then
    select jsonb_object_agg(k, jsonb_build_object('before', v_before -> k, 'after', stockos_private.product_dto(p) -> k))
      into v_changes from jsonb_object_keys(v_patch) k;
  else v_changes := jsonb_build_object('archivedAt', jsonb_build_object('before', v_before -> 'archivedAt', 'after', stockos_private.product_dto(p) -> 'archivedAt')); end if;
  insert into stockos_private.administrative_events(kind, product_id, actor_id, request_id, changes)
    values (v_kind, p.id, v_actor, v_request, v_changes) returning id into v_admin;
  v_result := jsonb_build_object('ok', true, 'requestId', v_request, 'replayed', false,
    'data', jsonb_build_object('product', stockos_private.product_dto(p), 'eventId', null, 'administrativeEventId', v_admin));
  update stockos_private.mutation_requests set result = v_result, completed_at = clock_timestamp() where request_id = v_request;
  return v_result;
exception when others then return stockos_private.safe_failure(sqlerrm);
end $$;

-- Read seam for lazy replacement cleanup: owner lists which photo hashes no product references anymore.
create function public.stockos_release_photo(p_input jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_hash text; v_value jsonb; v_free text[] := '{}';
begin
  perform stockos_private.owner_context(true);
  perform stockos_private.allowed_keys(p_input, array['hashes']);
  if jsonb_typeof(p_input -> 'hashes') is distinct from 'array' then raise exception 'VALIDATION_ERROR'; end if;
  if jsonb_array_length(p_input -> 'hashes') > 10 then raise exception 'VALIDATION_ERROR'; end if;
  for v_value in select value from jsonb_array_elements(p_input -> 'hashes') loop
    if jsonb_typeof(v_value) is distinct from 'string' or (v_value #>> '{}') !~ '^[0-9a-f]{64}$' then raise exception 'VALIDATION_ERROR'; end if;
    v_hash := v_value #>> '{}';
    if not exists (select 1 from stockos_private.products
      where photo_display_hash = v_hash or photo_thumb_hash = v_hash) then
      v_free := v_free || v_hash;
    end if;
  end loop;
  return jsonb_build_object('ok', true, 'data', jsonb_build_object('unreferenced', to_jsonb(v_free)));
exception when others then return stockos_private.safe_failure(sqlerrm);
end $$;

revoke all on function public.stockos_release_photo(jsonb) from public, anon, authenticated;
grant execute on function public.stockos_release_photo(jsonb) to authenticated;

-- No client bucket policies: bytes cross only independently authorized server boundaries.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('product-photos', 'product-photos', false, 131072, array['image/webp']);

-- Serialize attachment and object deletion on the same key, not a check-then-delete race.
create function stockos_private.guard_product_photo()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_variant text; v_hash text; v_bytes bigint; v_name text;
begin
  foreach v_variant in array array['display','thumb'] loop
    v_hash := case when v_variant = 'display' then new.photo_display_hash else new.photo_thumb_hash end;
    if v_hash is null then continue; end if;
    v_bytes := case when v_variant = 'display' then new.photo_display_bytes else new.photo_thumb_bytes end;
    v_name := 'products/' || v_variant || '/' || v_hash;
    perform pg_advisory_xact_lock(hashtextextended('product-photos/' || v_name, 0));
    if not exists (select 1 from storage.objects where bucket_id = 'product-photos' and name = v_name
      and (metadata ->> 'size')::bigint = v_bytes and metadata ->> 'mimetype' = 'image/webp') then
      raise exception 'VALIDATION_ERROR';
    end if;
  end loop;
  return new;
end $$;
create trigger guard_product_photo before insert or update of photo_display_hash, photo_thumb_hash,
  photo_display_bytes, photo_thumb_bytes on stockos_private.products
  for each row execute function stockos_private.guard_product_photo();

create function stockos_private.guard_photo_delete()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_hash text;
begin
  if old.bucket_id <> 'product-photos' then return old; end if;
  perform pg_advisory_xact_lock(hashtextextended('product-photos/' || old.name, 0));
  v_hash := split_part(old.name, '/', 3);
  if exists (select 1 from stockos_private.products where
    (old.name = 'products/display/' || v_hash and photo_display_hash = v_hash) or
    (old.name = 'products/thumb/' || v_hash and photo_thumb_hash = v_hash)) then
    raise exception 'PHOTO_REFERENCED';
  end if;
  return old;
end $$;
create trigger guard_photo_delete before delete on storage.objects
  for each row execute function stockos_private.guard_photo_delete();
revoke all on function stockos_private.input_photo(jsonb), stockos_private.photo_hash(jsonb),
  stockos_private.guard_product_photo(), stockos_private.guard_photo_delete() from public, anon, authenticated;
