-- Business tables stay private; only owner-checked RPCs expose bounded DTOs.
create table stockos_private.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique check (sku ~ '^[A-Z0-9_./-]{3,64}$'),
  name text not null check (name = btrim(name) and length(name) between 1 and 120),
  category text not null check (category = btrim(category) and length(category) between 1 and 120),
  unit text not null check (unit = btrim(unit) and length(unit) between 1 and 30),
  supplier text check (supplier = btrim(supplier) and length(supplier) between 1 and 120),
  shelf_location text check (shelf_location = btrim(shelf_location) and length(shelf_location) between 1 and 80),
  barcode text check (barcode = btrim(barcode) and length(barcode) between 1 and 64),
  description text check (description = btrim(description) and length(description) between 1 and 2000),
  selling_price numeric(13,0) not null check (selling_price between 0 and 1000000000000),
  min_stock bigint not null check (min_stock between 0 and 1000000000),
  current_stock bigint not null default 0 check (current_stock between 0 and 1000000000),
  inventory_cost_value numeric(30,6) not null default 0 check (inventory_cost_value between 0 and 1000000000000000000000),
  archived_at timestamptz,
  metadata_version bigint not null default 1 check (metadata_version > 0),
  stock_version bigint not null default 0 check (stock_version >= 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  check (current_stock <> 0 or inventory_cost_value = 0),
  check (archived_at is null or current_stock = 0)
);
create table stockos_private.mutation_requests (
  request_id uuid primary key,
  actor_id uuid not null references auth.users(id) on delete restrict,
  operation text not null check (operation in ('create_product', 'update_product', 'archive_product', 'reactivate_product', 'record_stock_in', 'record_stock_out', 'record_opname', 'adjust_inventory_cost')),
  payload_hash text not null,
  result jsonb,
  completed_at timestamptz,
  check ((result is null and completed_at is null) or (result is not null and (result -> 'ok' = 'true'::jsonb) is true and completed_at is not null))
);
create table stockos_private.inventory_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references stockos_private.products(id) on delete restrict,
  kind text not null check (kind in ('opening', 'receipt', 'sold', 'opname', 'cost_adjustment')),
  stock_version bigint not null check (stock_version > 0),
  quantity_before bigint not null check (quantity_before between 0 and 1000000000),
  quantity_after bigint not null check (quantity_after between 0 and 1000000000),
  quantity_delta bigint not null,
  cost_before numeric(30,6) not null check (cost_before between 0 and 1000000000000000000000),
  cost_after numeric(30,6) not null check (cost_after between 0 and 1000000000000000000000),
  cost_delta numeric(30,6) not null,
  purchase_total numeric(13,0) check (purchase_total between 0 and 1000000000000),
  counted_quantity bigint check (counted_quantity between 0 and 1000000000),
  carton_count bigint check (carton_count between 1 and 1000000000),
  units_per_carton bigint check (units_per_carton between 1 and 1000000000),
  reference text not null check (length(reference) between 1 and 120),
  note text check (note = btrim(note) and length(note) between 1 and 1000),
  correction_of_event_id uuid,
  actor_id uuid not null references auth.users(id) on delete restrict,
  request_id uuid not null unique references stockos_private.mutation_requests(request_id) on delete restrict,
  sku_snapshot text not null,
  name_snapshot text not null,
  unit_snapshot text not null,
  supplier_snapshot text,
  selling_price_snapshot numeric(13,0) not null,
  recorded_at timestamptz not null default clock_timestamp(),
  unique (product_id, stock_version),
  unique (product_id, id),
  foreign key (product_id, correction_of_event_id) references stockos_private.inventory_events(product_id, id) on delete restrict,
  check (quantity_delta = quantity_after - quantity_before),
  check (cost_delta = cost_after - cost_before),
  check ((quantity_before <> 0 or cost_before = 0) and (quantity_after <> 0 or cost_after = 0)),
  check ((kind in ('opening', 'receipt') and quantity_delta > 0 and purchase_total is not null and cost_delta = purchase_total)
    or (kind = 'sold' and quantity_delta < 0 and purchase_total is null and cost_delta <= 0)
    or (kind = 'opname' and counted_quantity is not null and counted_quantity = quantity_after and ((quantity_before = 0 and quantity_after > 0 and purchase_total is not null and cost_after = purchase_total)
      or ((quantity_before > 0 or quantity_after = 0) and purchase_total is null)))
    or (kind = 'cost_adjustment' and quantity_delta = 0 and purchase_total is null and note is not null)),
  check (kind = 'opname' or counted_quantity is null),
  check ((carton_count is null and units_per_carton is null) or (kind in ('opening', 'receipt') and carton_count is not null and units_per_carton is not null and carton_count::numeric * units_per_carton = quantity_delta)),
  check (correction_of_event_id is null or (kind in ('opname', 'cost_adjustment') and note is not null and correction_of_event_id <> id))
);
-- ponytail: ticket 2 audits products only; add nullable product FK/settings kind with approved settings slice.
create table stockos_private.administrative_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('product_created', 'product_updated', 'product_archived', 'product_reactivated')),
  product_id uuid not null references stockos_private.products(id) on delete restrict,
  actor_id uuid not null references auth.users(id) on delete restrict,
  request_id uuid not null unique references stockos_private.mutation_requests(request_id) on delete restrict,
  changes jsonb not null check (jsonb_typeof(changes) = 'object' and octet_length(changes::text) <= 20000),
  recorded_at timestamptz not null default clock_timestamp()
);
alter table stockos_private.products enable row level security;
alter table stockos_private.inventory_events enable row level security;
alter table stockos_private.mutation_requests enable row level security;
alter table stockos_private.administrative_events enable row level security;
revoke all on stockos_private.products, stockos_private.inventory_events, stockos_private.mutation_requests, stockos_private.administrative_events from public, anon, authenticated;
create index products_active_category on stockos_private.products (category, name, id) where archived_at is null;
create index products_created on stockos_private.products (created_at, id);
create index inventory_product_time on stockos_private.inventory_events (product_id, recorded_at desc, id desc);
create index inventory_time on stockos_private.inventory_events (recorded_at desc, id desc);
create index inventory_kind_time on stockos_private.inventory_events (kind, recorded_at desc, id desc);
create index inventory_correction on stockos_private.inventory_events (correction_of_event_id) where correction_of_event_id is not null;
create index administrative_product_time on stockos_private.administrative_events (product_id, recorded_at desc, id desc);

-- A request reservation may exist only inside its transaction; durable rows are successes.
create function stockos_private.completed_request()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from stockos_private.mutation_requests where request_id = new.request_id
    and (result is null or completed_at is null)) then raise exception 'Incomplete mutation request'; end if;
  return null;
end $$;
create constraint trigger completed_mutation_request after insert or update on stockos_private.mutation_requests
  deferrable initially deferred for each row execute function stockos_private.completed_request();

create function stockos_private.allowed_keys(p_input jsonb, p_keys text[])
returns void language plpgsql set search_path = '' as $$
begin
  if p_input is null or jsonb_typeof(p_input) <> 'object' or octet_length(p_input::text) > 20000 then raise exception 'VALIDATION_ERROR'; end if;
  if exists (select 1 from jsonb_object_keys(p_input) k where not k = any(p_keys)) then raise exception 'VALIDATION_ERROR'; end if;
end $$;
create function stockos_private.input_text(p_input jsonb, p_key text, p_limit integer, p_required boolean default false)
returns text language plpgsql set search_path = '' as $$
declare v text;
begin
  if p_input -> p_key is null or p_input -> p_key = 'null'::jsonb then
    if p_required then raise exception 'VALIDATION_ERROR'; end if;
    return null;
  end if;
  if jsonb_typeof(p_input -> p_key) <> 'string' then raise exception 'VALIDATION_ERROR'; end if;
  v := btrim(p_input ->> p_key);
  if length(v) not between 1 and p_limit then raise exception 'VALIDATION_ERROR'; end if;
  return v;
end $$;
create function stockos_private.input_uuid(p_input jsonb, p_key text, p_required boolean default true)
returns uuid language plpgsql set search_path = '' as $$
declare v text := stockos_private.input_text(p_input, p_key, 36, p_required);
begin
  if v is null then return null; end if;
  if v !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then raise exception 'VALIDATION_ERROR'; end if;
  return v::uuid;
end $$;
create function stockos_private.input_quantity(p_input jsonb, p_key text, p_min bigint default 0, p_default bigint default null)
returns bigint language plpgsql set search_path = '' as $$
declare v text := p_input ->> p_key;
begin
  if not p_input ? p_key and p_default is not null then return p_default; end if;
  if jsonb_typeof(p_input -> p_key) is distinct from 'number' or v !~ '^[0-9]{1,10}$' or v::numeric not between p_min and 1000000000 then raise exception 'VALIDATION_ERROR'; end if;
  return v::bigint;
end $$;
create function stockos_private.input_money(p_input jsonb, p_key text, p_required boolean default true)
returns numeric language plpgsql set search_path = '' as $$
declare v text := p_input ->> p_key;
begin
  if not p_input ? p_key and not p_required then return null; end if;
  if jsonb_typeof(p_input -> p_key) is distinct from 'string' or v !~ '^[0-9]{1,13}$' or v::numeric > 1000000000000 then raise exception 'VALIDATION_ERROR'; end if;
  return v::numeric;
end $$;
create function stockos_private.input_version(p_input jsonb, p_key text)
returns bigint language plpgsql set search_path = '' as $$
declare v text := p_input ->> p_key;
begin
  if jsonb_typeof(p_input -> p_key) is distinct from 'string' or v !~ '^[0-9]{1,19}$' or v::numeric > 9223372036854775807 then raise exception 'VALIDATION_ERROR'; end if;
  return v::bigint;
end $$;
create function stockos_private.product_dto(p stockos_private.products)
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
    'metadataVersion', p.metadata_version::text, 'stockVersion', p.stock_version::text,
    'createdAt', to_char(p.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'updatedAt', to_char(p.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'));
$$;
create function stockos_private.safe_failure(p_error text)
returns jsonb language sql volatile set search_path = '' as $$
  select case when p_error = any(array['VALIDATION_ERROR','UNAUTHENTICATED','EMAIL_UNVERIFIED','FORBIDDEN','NOT_FOUND','SKU_EXISTS','PRODUCT_ARCHIVED','PRODUCT_HAS_STOCK','IDENTITY_LOCKED','INSUFFICIENT_STOCK','VERSION_CONFLICT','REQUEST_ID_CONFLICT','LIMIT_EXCEEDED'])
    then jsonb_build_object('ok', false, 'code', p_error, 'message', p_error)
    else jsonb_build_object('ok', false, 'code', 'INTERNAL_ERROR', 'message', 'Request failed. Retry with the same request ID.', 'traceId', gen_random_uuid()) end;
$$;

create function public.stockos_create_product(p_input jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid; v_request uuid; v_hash text; v_payload jsonb; v_previous stockos_private.mutation_requests;
  p stockos_private.products; v_quantity bigint; v_cost numeric; v_cartons bigint; v_units bigint;
  v_event uuid; v_admin uuid; v_result jsonb;
begin
  v_actor := (stockos_private.owner_context(true) ->> 'id')::uuid;
  perform stockos_private.allowed_keys(p_input, array['requestId','sku','name','category','unit','sellingPrice','minStock','supplier','shelfLocation','barcode','description','openingQuantity','purchaseTotal','cartonCount','unitsPerCarton']);
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
  v_payload := jsonb_build_object('sku', p.sku, 'name', p.name, 'category', p.category, 'unit', p.unit,
    'sellingPrice', p.selling_price::text, 'minStock', p.min_stock, 'supplier', p.supplier, 'shelfLocation', p.shelf_location,
    'barcode', p.barcode, 'description', p.description, 'openingQuantity', v_quantity, 'purchaseTotal', coalesce(v_cost, 0)::text,
    'cartonCount', v_cartons, 'unitsPerCarton', v_units);
  v_hash := encode(sha256(convert_to(v_payload::text, 'UTF8')), 'hex');
  insert into stockos_private.mutation_requests(request_id, actor_id, operation, payload_hash)
    values (v_request, v_actor, 'create_product', v_hash) on conflict (request_id) do nothing;
  select * into v_previous from stockos_private.mutation_requests where request_id = v_request for update;
  if v_previous.actor_id <> v_actor or v_previous.operation <> 'create_product' or v_previous.payload_hash <> v_hash then raise exception 'REQUEST_ID_CONFLICT'; end if;
  if v_previous.result is not null then return v_previous.result || jsonb_build_object('replayed', true); end if;
  begin
    insert into stockos_private.products(sku, name, category, unit, supplier, shelf_location, barcode, description,
      selling_price, min_stock, current_stock, inventory_cost_value, stock_version)
      values (p.sku, p.name, p.category, p.unit, p.supplier, p.shelf_location, p.barcode, p.description,
        p.selling_price, p.min_stock, v_quantity, coalesce(v_cost, 0), case when v_quantity > 0 then 1 else 0 end) returning * into p;
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

create function public.stockos_get_product(p_input jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare p stockos_private.products; v_id uuid;
begin
  perform stockos_private.owner_context(true);
  perform stockos_private.allowed_keys(p_input, array['id']);
  v_id := stockos_private.input_uuid(p_input, 'id');
  select * into p from stockos_private.products where id = v_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  return jsonb_build_object('ok', true, 'data', stockos_private.product_dto(p));
exception when others then return stockos_private.safe_failure(sqlerrm);
end $$;
create function stockos_private.event_dto(e stockos_private.inventory_events)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', e.id, 'productId', e.product_id, 'kind', e.kind, 'stockVersion', e.stock_version::text,
    'quantityBefore', e.quantity_before, 'quantityAfter', e.quantity_after, 'quantityDelta', e.quantity_delta,
    'costBefore', e.cost_before::text, 'costAfter', e.cost_after::text, 'costDelta', e.cost_delta::text,
    'purchaseTotal', e.purchase_total::text, 'countedQuantity', e.counted_quantity,
    'cartonCount', e.carton_count, 'unitsPerCarton', e.units_per_carton, 'reference', e.reference, 'note', e.note,
    'correctionOfEventId', e.correction_of_event_id, 'skuSnapshot', e.sku_snapshot, 'nameSnapshot', e.name_snapshot,
    'unitSnapshot', e.unit_snapshot, 'supplierSnapshot', e.supplier_snapshot, 'sellingPriceSnapshot', e.selling_price_snapshot::text,
    'actorDisplay', (select owner_name from stockos_private.shop_settings where id = 1),
    'recordedAt', to_char(e.recorded_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'));
$$;
create function public.stockos_list_products(p_input jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_search text; v_category text; v_health text; v_archive text; v_sort text; v_direction text;
  v_page bigint; v_size bigint; v_total bigint; v_items jsonb;
begin
  perform stockos_private.owner_context(true);
  perform stockos_private.allowed_keys(p_input, array['search','category','health','archive','sort','direction','page','pageSize']);
  -- Empty search means no search; other optional text must be nonblank.
  if p_input -> 'search' = '""'::jsonb then v_search := null;
  else v_search := stockos_private.input_text(p_input, 'search', 120); end if;
  v_category := stockos_private.input_text(p_input, 'category', 120);
  v_health := coalesce(stockos_private.input_text(p_input, 'health', 20), 'all');
  v_archive := coalesce(stockos_private.input_text(p_input, 'archive', 20), 'active');
  v_sort := coalesce(stockos_private.input_text(p_input, 'sort', 20), 'name');
  v_direction := coalesce(stockos_private.input_text(p_input, 'direction', 4), 'asc');
  v_page := stockos_private.input_quantity(p_input, 'page', 1, 1);
  v_size := stockos_private.input_quantity(p_input, 'pageSize', 1, 25);
  if v_size > 100 or v_health not in ('all','in_stock','low_stock','out_of_stock')
    or v_archive not in ('active','archived','all') or v_sort not in ('name','sku','currentStock','sellingPrice','createdAt')
    or v_direction not in ('asc','desc') then raise exception 'VALIDATION_ERROR'; end if;
  with matching as materialized (
    select p.* from stockos_private.products p
    where (v_search is null or strpos(lower(p.name), lower(v_search)) > 0 or strpos(lower(p.sku), lower(v_search)) > 0)
      and (v_category is null or p.category = v_category)
      and (v_archive = 'all' or (v_archive = 'active' and p.archived_at is null) or (v_archive = 'archived' and p.archived_at is not null))
      and (v_health = 'all' or (v_health = 'out_of_stock' and p.current_stock = 0)
        or (v_health = 'low_stock' and p.current_stock > 0 and p.current_stock <= p.min_stock)
        or (v_health = 'in_stock' and p.current_stock > p.min_stock))
  ), page_rows as (
    select p.* from matching p order by
      case when v_direction = 'asc' and v_sort = 'name' then p.name end asc,
      case when v_direction = 'desc' and v_sort = 'name' then p.name end desc,
      case when v_direction = 'asc' and v_sort = 'sku' then p.sku end asc,
      case when v_direction = 'desc' and v_sort = 'sku' then p.sku end desc,
      case when v_direction = 'asc' and v_sort = 'currentStock' then p.current_stock end asc,
      case when v_direction = 'desc' and v_sort = 'currentStock' then p.current_stock end desc,
      case when v_direction = 'asc' and v_sort = 'sellingPrice' then p.selling_price end asc,
      case when v_direction = 'desc' and v_sort = 'sellingPrice' then p.selling_price end desc,
      case when v_direction = 'asc' and v_sort = 'createdAt' then p.created_at end asc,
      case when v_direction = 'desc' and v_sort = 'createdAt' then p.created_at end desc,
      p.id asc limit v_size offset ((v_page - 1) * v_size)
  ) select (select count(*) from matching), coalesce(jsonb_agg(stockos_private.product_dto(p)), '[]'::jsonb)
    into v_total, v_items from page_rows p;
  return jsonb_build_object('ok', true, 'data', jsonb_build_object('items', v_items, 'total', v_total, 'page', v_page, 'pageSize', v_size));
exception when others then return stockos_private.safe_failure(sqlerrm);
end $$;
create function public.stockos_list_inventory_events(p_input jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_product uuid; v_kind text; v_start text; v_end text; v_timezone text; v_from timestamptz; v_until timestamptz;
  v_page bigint; v_size bigint; v_total bigint; v_items jsonb;
begin
  perform stockos_private.owner_context(true);
  perform stockos_private.allowed_keys(p_input, array['productId','kind','startDate','endDate','page','pageSize']);
  v_product := stockos_private.input_uuid(p_input, 'productId', false);
  v_kind := stockos_private.input_text(p_input, 'kind', 20);
  if v_kind is not null and v_kind not in ('opening','receipt','sold','opname','cost_adjustment') then raise exception 'VALIDATION_ERROR'; end if;
  v_start := stockos_private.input_text(p_input, 'startDate', 10);
  v_end := stockos_private.input_text(p_input, 'endDate', 10);
  if (v_start is null) <> (v_end is null) then raise exception 'VALIDATION_ERROR'; end if;
  if v_start is not null then
    if v_start !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or v_end !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'VALIDATION_ERROR'; end if;
    begin
      if v_start::date >= v_end::date or v_end::date - v_start::date > 366 then raise exception 'VALIDATION_ERROR'; end if;
      select timezone into v_timezone from stockos_private.shop_settings where id = 1;
      v_from := v_start::date::timestamp at time zone v_timezone;
      v_until := v_end::date::timestamp at time zone v_timezone;
    exception when datetime_field_overflow or invalid_datetime_format then raise exception 'VALIDATION_ERROR'; end;
  end if;
  v_page := stockos_private.input_quantity(p_input, 'page', 1, 1);
  v_size := stockos_private.input_quantity(p_input, 'pageSize', 1, 25);
  if v_size > 100 then raise exception 'VALIDATION_ERROR'; end if;
  with matching as materialized (
    select e.* from stockos_private.inventory_events e where (v_product is null or e.product_id = v_product)
      and (v_kind is null or e.kind = v_kind) and (v_from is null or (e.recorded_at >= v_from and e.recorded_at < v_until))
  ), page_rows as (
    select * from matching order by recorded_at desc, id desc limit v_size offset ((v_page - 1) * v_size)
  ) select (select count(*) from matching), coalesce(jsonb_agg(stockos_private.event_dto(e)), '[]'::jsonb)
    into v_total, v_items from page_rows e;
  return jsonb_build_object('ok', true, 'data', jsonb_build_object('items', v_items, 'total', v_total, 'page', v_page, 'pageSize', v_size));
exception when others then return stockos_private.safe_failure(sqlerrm);
end $$;
create function stockos_private.product_mutation(p_operation text, p_input jsonb)
returns jsonb language plpgsql set search_path = '' as $$
declare v_actor uuid; v_request uuid; v_id uuid; v_metadata bigint; v_stock bigint; v_patch jsonb := '{}'::jsonb;
  v_keys text[] := array['sku','name','category','unit','sellingPrice','minStock','supplier','shelfLocation','barcode','description'];
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
      if v_key = 'sellingPrice' then v_patch := v_patch || jsonb_build_object(v_key, stockos_private.input_money(p_input -> 'patch', v_key)::text);
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
create function public.stockos_update_product(p_input jsonb)
returns jsonb language sql security definer set search_path = '' as $$ select stockos_private.product_mutation('update_product', p_input); $$;
create function public.stockos_archive_product(p_input jsonb)
returns jsonb language sql security definer set search_path = '' as $$ select stockos_private.product_mutation('archive_product', p_input); $$;
create function public.stockos_reactivate_product(p_input jsonb)
returns jsonb language sql security definer set search_path = '' as $$ select stockos_private.product_mutation('reactivate_product', p_input); $$;
revoke all on function public.stockos_update_product(jsonb), public.stockos_archive_product(jsonb), public.stockos_reactivate_product(jsonb) from public, anon, authenticated;
grant execute on function public.stockos_update_product(jsonb), public.stockos_archive_product(jsonb), public.stockos_reactivate_product(jsonb) to authenticated;

create function stockos_private.inventory_mutation(p_operation text, p_input jsonb)
returns jsonb language plpgsql set search_path = '' as $$
declare v_actor uuid; v_request uuid; v_id uuid; v_payload jsonb; v_hash text; v_previous stockos_private.mutation_requests;
  p stockos_private.products; v_before_quantity bigint; v_before_cost numeric; v_quantity bigint; v_cost numeric;
  v_version bigint; v_cartons bigint; v_units bigint; v_reference text; v_note text; v_link uuid; v_kind text; v_event uuid; v_result jsonb;
begin
  v_actor := (stockos_private.owner_context(true) ->> 'id')::uuid;
  if p_operation = 'record_stock_in' then
    perform stockos_private.allowed_keys(p_input, array['requestId','productId','quantity','purchaseTotal','reference','note','cartonCount','unitsPerCarton']);
    v_quantity := stockos_private.input_quantity(p_input, 'quantity', 1);
    v_cost := stockos_private.input_money(p_input, 'purchaseTotal');
    v_kind := 'receipt';
    if p_input ? 'cartonCount' or p_input ? 'unitsPerCarton' then
      v_cartons := stockos_private.input_quantity(p_input, 'cartonCount', 1);
      v_units := stockos_private.input_quantity(p_input, 'unitsPerCarton', 1);
      if v_cartons::numeric * v_units <> v_quantity then raise exception 'VALIDATION_ERROR'; end if;
    end if;
    v_payload := jsonb_build_object('quantity', v_quantity, 'purchaseTotal', v_cost::text, 'cartonCount', v_cartons, 'unitsPerCarton', v_units);
  elsif p_operation = 'record_stock_out' then
    perform stockos_private.allowed_keys(p_input, array['requestId','productId','quantity','reference','note']);
    v_quantity := stockos_private.input_quantity(p_input, 'quantity', 1);
    v_kind := 'sold';
    v_payload := jsonb_build_object('quantity', v_quantity);
  elsif p_operation = 'record_opname' then
    perform stockos_private.allowed_keys(p_input, array['requestId','productId','expectedStockVersion','countedQuantity','foundPurchaseTotal','note','correctionOfEventId']);
    v_quantity := stockos_private.input_quantity(p_input, 'countedQuantity');
    v_version := stockos_private.input_version(p_input, 'expectedStockVersion');
    v_cost := stockos_private.input_money(p_input, 'foundPurchaseTotal', false);
    v_link := stockos_private.input_uuid(p_input, 'correctionOfEventId', false);
    v_kind := 'opname';
    v_payload := jsonb_build_object('countedQuantity', v_quantity, 'expectedStockVersion', v_version::text, 'foundPurchaseTotal', v_cost::text, 'correctionOfEventId', v_link);
  elsif p_operation = 'adjust_inventory_cost' then
    perform stockos_private.allowed_keys(p_input, array['requestId','productId','expectedStockVersion','replacementTotalCost','reason','correctionOfEventId']);
    v_version := stockos_private.input_version(p_input, 'expectedStockVersion');
    v_cost := stockos_private.input_money(p_input, 'replacementTotalCost');
    v_note := stockos_private.input_text(p_input, 'reason', 1000, true);
    v_link := stockos_private.input_uuid(p_input, 'correctionOfEventId', false);
    v_kind := 'cost_adjustment';
    v_payload := jsonb_build_object('expectedStockVersion', v_version::text, 'replacementTotalCost', v_cost::text, 'correctionOfEventId', v_link);
  else raise exception 'VALIDATION_ERROR'; end if;
  v_request := stockos_private.input_uuid(p_input, 'requestId');
  v_id := stockos_private.input_uuid(p_input, 'productId');
  if p_operation <> 'adjust_inventory_cost' then v_note := stockos_private.input_text(p_input, 'note', 1000); end if;
  if p_operation in ('record_stock_in','record_stock_out') then v_reference := stockos_private.input_text(p_input, 'reference', 120); end if;
  if v_link is not null and v_note is null then raise exception 'VALIDATION_ERROR'; end if;
  v_payload := v_payload || jsonb_build_object('productId', v_id, 'note', v_note, 'reference', v_reference);
  v_hash := encode(sha256(convert_to(v_payload::text, 'UTF8')), 'hex');
  insert into stockos_private.mutation_requests(request_id, actor_id, operation, payload_hash)
    values (v_request, v_actor, p_operation, v_hash) on conflict (request_id) do nothing;
  select * into v_previous from stockos_private.mutation_requests where request_id = v_request for update;
  if v_previous.actor_id <> v_actor or v_previous.operation <> p_operation or v_previous.payload_hash <> v_hash then raise exception 'REQUEST_ID_CONFLICT'; end if;
  if v_previous.result is not null then return v_previous.result || jsonb_build_object('replayed', true); end if;
  select * into p from stockos_private.products where id = v_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if p.archived_at is not null then raise exception 'PRODUCT_ARCHIVED'; end if;
  if v_version is not null and v_version <> p.stock_version then raise exception 'VERSION_CONFLICT'; end if;
  if v_link is not null and not exists (select 1 from stockos_private.inventory_events where id = v_link and product_id = p.id) then raise exception 'VALIDATION_ERROR'; end if;
  v_before_quantity := p.current_stock;
  v_before_cost := p.inventory_cost_value;
  if v_kind = 'receipt' then
    if p.current_stock + v_quantity > 1000000000 or p.inventory_cost_value + v_cost > 1000000000000000000000 then raise exception 'LIMIT_EXCEEDED'; end if;
    p.current_stock := p.current_stock + v_quantity;
    p.inventory_cost_value := p.inventory_cost_value + v_cost;
  elsif v_kind = 'sold' then
    if v_quantity > p.current_stock then raise exception 'INSUFFICIENT_STOCK'; end if;
    p.inventory_cost_value := case when v_quantity = p.current_stock then 0 else p.inventory_cost_value - round(p.inventory_cost_value * v_quantity / p.current_stock, 6) end;
    p.current_stock := p.current_stock - v_quantity;
  elsif v_kind = 'opname' then
    if p.current_stock = 0 and v_quantity > 0 then
      if v_cost is null then raise exception 'VALIDATION_ERROR'; end if;
      p.inventory_cost_value := v_cost;
    else
      if v_cost is not null then raise exception 'VALIDATION_ERROR'; end if;
      p.inventory_cost_value := case when p.current_stock = 0 or v_quantity = 0 then 0 else round(p.inventory_cost_value * v_quantity / p.current_stock, 6) end;
    end if;
    if p.inventory_cost_value > 1000000000000000000000 then raise exception 'LIMIT_EXCEEDED'; end if;
    p.current_stock := v_quantity;
  else
    if p.current_stock = 0 and v_cost <> 0 then raise exception 'VALIDATION_ERROR'; end if;
    p.inventory_cost_value := v_cost;
  end if;
  update stockos_private.products set current_stock = p.current_stock, inventory_cost_value = p.inventory_cost_value,
    stock_version = stock_version + 1, updated_at = clock_timestamp() where id = p.id returning * into p;
  insert into stockos_private.inventory_events(product_id, kind, stock_version, quantity_before, quantity_after, quantity_delta,
    cost_before, cost_after, cost_delta, purchase_total, counted_quantity, carton_count, units_per_carton,
    reference, note, correction_of_event_id, actor_id, request_id, sku_snapshot, name_snapshot, unit_snapshot, supplier_snapshot, selling_price_snapshot)
    values (p.id, v_kind, p.stock_version, v_before_quantity, p.current_stock, p.current_stock - v_before_quantity,
      v_before_cost, p.inventory_cost_value, p.inventory_cost_value - v_before_cost,
      case when v_kind = 'receipt' or (v_kind = 'opname' and v_before_quantity = 0 and p.current_stock > 0) then v_cost end,
      case when v_kind = 'opname' then v_quantity end, v_cartons, v_units,
      coalesce(v_reference, upper(v_kind) || '-' || v_request::text), v_note, v_link, v_actor, v_request, p.sku, p.name, p.unit, p.supplier, p.selling_price) returning id into v_event;
  v_result := jsonb_build_object('ok', true, 'requestId', v_request, 'replayed', false,
    'data', jsonb_build_object('product', stockos_private.product_dto(p), 'eventId', v_event, 'administrativeEventId', null));
  update stockos_private.mutation_requests set result = v_result, completed_at = clock_timestamp() where request_id = v_request;
  return v_result;
exception when others then return stockos_private.safe_failure(sqlerrm);
end $$;
create function public.stockos_record_stock_in(p_input jsonb)
returns jsonb language sql security definer set search_path = '' as $$ select stockos_private.inventory_mutation('record_stock_in', p_input); $$;
create function public.stockos_record_stock_out(p_input jsonb)
returns jsonb language sql security definer set search_path = '' as $$ select stockos_private.inventory_mutation('record_stock_out', p_input); $$;
create function public.stockos_record_opname(p_input jsonb)
returns jsonb language sql security definer set search_path = '' as $$ select stockos_private.inventory_mutation('record_opname', p_input); $$;
create function public.stockos_adjust_inventory_cost(p_input jsonb)
returns jsonb language sql security definer set search_path = '' as $$ select stockos_private.inventory_mutation('adjust_inventory_cost', p_input); $$;
revoke all on function public.stockos_record_stock_in(jsonb), public.stockos_record_stock_out(jsonb), public.stockos_record_opname(jsonb), public.stockos_adjust_inventory_cost(jsonb) from public, anon, authenticated;
grant execute on function public.stockos_record_stock_in(jsonb), public.stockos_record_stock_out(jsonb), public.stockos_record_opname(jsonb), public.stockos_adjust_inventory_cost(jsonb) to authenticated;
revoke all on all functions in schema stockos_private from public, anon, authenticated;
revoke all on function public.stockos_create_product(jsonb), public.stockos_get_product(jsonb), public.stockos_list_products(jsonb), public.stockos_list_inventory_events(jsonb) from public, anon, authenticated;
grant execute on function public.stockos_create_product(jsonb), public.stockos_get_product(jsonb), public.stockos_list_products(jsonb), public.stockos_list_inventory_events(jsonb) to authenticated;
