-- Managed category and supplier taxonomies (ADR 0002): master tables with text-snapshot storage,
-- rename propagation to active products, restrict-delete, and owner-checked durable mutations.
create table stockos_private.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name = btrim(name) and length(name) between 1 and 120),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);
create table stockos_private.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name = btrim(name) and length(name) between 1 and 120),
  phone text check (phone = btrim(phone) and length(phone) between 1 and 40),
  notes text check (notes = btrim(notes) and length(notes) between 1 and 500),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);
insert into stockos_private.categories (name)
  values ('Bahan Pokok'), ('Mi Instan'), ('Minuman'), ('Makanan Ringan'),
         ('Bumbu & Dapur'), ('Perawatan Diri'), ('Kebersihan Rumah'), ('Obat & P3K')
  on conflict (name) do nothing;
-- Adopt free text already in the catalog so no existing product loses its master row.
insert into stockos_private.categories (name)
  select distinct category from stockos_private.products on conflict (name) do nothing;
insert into stockos_private.suppliers (name)
  select distinct supplier from stockos_private.products
  where supplier is not null on conflict (name) do nothing;
alter table stockos_private.categories enable row level security;
alter table stockos_private.suppliers enable row level security;
revoke all on stockos_private.categories, stockos_private.suppliers from public, anon, authenticated;
create unique index categories_name_ci on stockos_private.categories (lower(name));
create unique index suppliers_name_ci on stockos_private.suppliers (lower(name));

create function stockos_private.taxonomy_dto_category(r stockos_private.categories)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', r.id, 'name', r.name, 'productCount',
    (select count(*) from stockos_private.products where category = r.name and archived_at is null),
    'createdAt', to_char(r.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'updatedAt', to_char(r.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'));
$$;
create function stockos_private.taxonomy_dto_supplier(r stockos_private.suppliers)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', r.id, 'name', r.name, 'phone', r.phone, 'notes', r.notes, 'productCount',
    (select count(*) from stockos_private.products where supplier = r.name and archived_at is null),
    'createdAt', to_char(r.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'updatedAt', to_char(r.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'));
$$;

alter table stockos_private.mutation_requests drop constraint mutation_requests_operation_check;
alter table stockos_private.mutation_requests add constraint mutation_requests_operation_check check (operation in (
  'create_product', 'update_product', 'archive_product', 'reactivate_product', 'delete_product',
  'record_stock_in', 'record_stock_out', 'record_opname', 'adjust_inventory_cost', 'update_shop_settings',
  'create_category', 'update_category', 'delete_category', 'create_supplier', 'update_supplier', 'delete_supplier'
));
alter table stockos_private.administrative_events drop constraint administrative_events_kind_check;
alter table stockos_private.administrative_events add constraint administrative_events_kind_check check (kind in (
  'product_created', 'product_updated', 'product_archived', 'product_reactivated', 'product_deleted',
  'settings_updated', 'photo_added', 'photo_replaced', 'photo_removed',
  'category_created', 'category_updated', 'category_deleted', 'supplier_created', 'supplier_updated', 'supplier_deleted'
));
alter table stockos_private.administrative_events drop constraint administrative_events_product_kind_match;
alter table stockos_private.administrative_events add constraint administrative_events_product_kind_match check (
  (kind = 'settings_updated' and product_id is null) or
  (kind in ('category_created', 'category_updated', 'category_deleted', 'supplier_created', 'supplier_updated', 'supplier_deleted') and product_id is null) or
  (kind not in ('settings_updated', 'category_created', 'category_updated', 'category_deleted', 'supplier_created', 'supplier_updated', 'supplier_deleted') and (product_id is not null or
    (jsonb_typeof(changes -> 'deletedProduct') = 'object' and
      jsonb_typeof(changes -> 'deletedProduct' -> 'id') = 'string' and
      changes -> 'deletedProduct' ->> 'id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') is true))
);

-- Widen the failure whitelist without rewriting historic durable results.
create or replace function stockos_private.safe_failure(p_error text)
returns jsonb language sql volatile set search_path = '' as $$
  select case when p_error = any(array['VALIDATION_ERROR','UNAUTHENTICATED','EMAIL_UNVERIFIED','FORBIDDEN','NOT_FOUND','SKU_EXISTS','PRODUCT_ARCHIVED','PRODUCT_HAS_STOCK','PRODUCT_HAS_HISTORY','IDENTITY_LOCKED','INSUFFICIENT_STOCK','VERSION_CONFLICT','REQUEST_ID_CONFLICT','LIMIT_EXCEEDED','TAXONOMY_EXISTS','TAXONOMY_IN_USE'])
    then jsonb_build_object('ok', false, 'code', p_error, 'message', p_error)
    else jsonb_build_object('ok', false, 'code', 'INTERNAL_ERROR', 'message', 'Request failed. Retry with the same request ID.', 'traceId', gen_random_uuid()) end;
$$;

create function stockos_private.taxonomy_mutation(p_operation text, p_input jsonb)
returns jsonb language plpgsql set search_path = '' as $$
declare
  v_actor uuid; v_request uuid; v_id uuid; v_name text; v_phone text; v_notes text;
  v_payload jsonb; v_hash text; v_previous stockos_private.mutation_requests;
  v_before jsonb; v_after jsonb; v_changes jsonb; v_admin uuid; v_result jsonb; v_kind text; v_table text;
  v_category stockos_private.categories; v_supplier stockos_private.suppliers;
begin
  v_actor := (stockos_private.owner_context(true) ->> 'id')::uuid;
  if p_operation in ('create_category','update_category','delete_category') then v_table := 'categories'; else v_table := 'suppliers'; end if;
  if p_operation = 'create_category' then
    perform stockos_private.allowed_keys(p_input, array['requestId','name']);
    v_name := stockos_private.input_text(p_input, 'name', 120, true);
    v_kind := 'category_created';
  elsif p_operation = 'create_supplier' then
    perform stockos_private.allowed_keys(p_input, array['requestId','name','phone','notes']);
    v_name := stockos_private.input_text(p_input, 'name', 120, true);
    v_phone := stockos_private.input_text(p_input, 'phone', 40);
    v_notes := stockos_private.input_text(p_input, 'notes', 500);
    v_kind := 'supplier_created';
  elsif p_operation = 'update_category' then
    perform stockos_private.allowed_keys(p_input, array['requestId','id','name']);
    v_id := stockos_private.input_uuid(p_input, 'id');
    v_name := stockos_private.input_text(p_input, 'name', 120, true);
    v_kind := 'category_updated';
  elsif p_operation = 'update_supplier' then
    perform stockos_private.allowed_keys(p_input, array['requestId','id','name','phone','notes']);
    v_id := stockos_private.input_uuid(p_input, 'id');
    v_name := stockos_private.input_text(p_input, 'name', 120, true);
    v_phone := stockos_private.input_text(p_input, 'phone', 40);
    v_notes := stockos_private.input_text(p_input, 'notes', 500);
    v_kind := 'supplier_updated';
  elsif p_operation = 'delete_category' or p_operation = 'delete_supplier' then
    perform stockos_private.allowed_keys(p_input, array['requestId','id']);
    v_id := stockos_private.input_uuid(p_input, 'id');
    v_kind := case v_table when 'categories' then 'category_deleted' else 'supplier_deleted' end;
  else raise exception 'VALIDATION_ERROR'; end if;

  v_request := stockos_private.input_uuid(p_input, 'requestId');
  v_payload := jsonb_build_object('kind', v_table, 'id', v_id, 'name', v_name, 'phone', v_phone, 'notes', v_notes);
  v_hash := encode(sha256(convert_to(v_payload::text, 'UTF8')), 'hex');
  insert into stockos_private.mutation_requests(request_id, actor_id, operation, payload_hash)
    values (v_request, v_actor, p_operation, v_hash) on conflict (request_id) do nothing;
  select * into v_previous from stockos_private.mutation_requests where request_id = v_request for update;
  if v_previous.actor_id <> v_actor or v_previous.operation <> p_operation or v_previous.payload_hash <> v_hash then raise exception 'REQUEST_ID_CONFLICT'; end if;
  -- Replay before lookup: the original master row disappears after a committed rename/delete.
  if v_previous.result is not null then return v_previous.result || jsonb_build_object('replayed', true); end if;

  if p_operation = 'create_category' then
    insert into stockos_private.categories(name) values (v_name) returning * into v_category;
    v_after := stockos_private.taxonomy_dto_category(v_category);
  elsif p_operation = 'create_supplier' then
    insert into stockos_private.suppliers(name, phone, notes) values (v_name, v_phone, v_notes) returning * into v_supplier;
    v_after := stockos_private.taxonomy_dto_supplier(v_supplier);
  else
    if v_table = 'categories' then
      select * into v_category from stockos_private.categories where id = v_id for update;
    else
      select * into v_supplier from stockos_private.suppliers where id = v_id for update;
    end if;
    if not found then raise exception 'NOT_FOUND'; end if;
    v_before := case v_table when 'categories' then stockos_private.taxonomy_dto_category(v_category) else stockos_private.taxonomy_dto_supplier(v_supplier) end;
    if p_operation = 'update_category' or p_operation = 'update_supplier' then
      -- Propagate the rename to active products in this same transaction; event snapshots stay immutable.
      if v_table = 'categories' then
        update stockos_private.products set category = v_name where category = v_category.name and archived_at is null;
        update stockos_private.categories set name = v_name, updated_at = clock_timestamp() where id = v_id returning * into v_category;
      else
        update stockos_private.products set supplier = v_name where supplier = v_supplier.name and archived_at is null;
        update stockos_private.suppliers set name = v_name, phone = v_phone, notes = v_notes, updated_at = clock_timestamp() where id = v_id returning * into v_supplier;
      end if;
      v_after := case v_table when 'categories' then stockos_private.taxonomy_dto_category(v_category) else stockos_private.taxonomy_dto_supplier(v_supplier) end;
    else
      if exists (select 1 from stockos_private.products
        where (v_table = 'categories' and category = v_category.name) or (v_table = 'suppliers' and supplier = v_supplier.name)) then
        raise exception 'TAXONOMY_IN_USE';
      end if;
      if v_table = 'categories' then delete from stockos_private.categories where id = v_id;
      else delete from stockos_private.suppliers where id = v_id; end if;
      v_after := null;
    end if;
  end if;
  v_changes := case when v_before is null then jsonb_build_object('before', null, 'after', v_after)
    else jsonb_build_object('before', v_before, 'after', v_after) end;
  insert into stockos_private.administrative_events(kind, product_id, actor_id, request_id, changes)
    values (v_kind, null, v_actor, v_request, v_changes) returning id into v_admin;
  v_result := jsonb_build_object('ok', true, 'requestId', v_request, 'replayed', false,
    'data', jsonb_build_object(case v_table when 'categories' then 'category' else 'supplier' end, v_after, 'administrativeEventId', v_admin));
  update stockos_private.mutation_requests set result = v_result, completed_at = clock_timestamp() where request_id = v_request;
  return v_result;
exception
  when unique_violation then
    return stockos_private.safe_failure('TAXONOMY_EXISTS');
  when others then
    return stockos_private.safe_failure(sqlerrm);
end $$;

create function public.stockos_create_category(p_input jsonb)
returns jsonb language sql security definer set search_path = '' as $$ select stockos_private.taxonomy_mutation('create_category', p_input); $$;
create function public.stockos_update_category(p_input jsonb)
returns jsonb language sql security definer set search_path = '' as $$ select stockos_private.taxonomy_mutation('update_category', p_input); $$;
create function public.stockos_delete_category(p_input jsonb)
returns jsonb language sql security definer set search_path = '' as $$ select stockos_private.taxonomy_mutation('delete_category', p_input); $$;
create function public.stockos_create_supplier(p_input jsonb)
returns jsonb language sql security definer set search_path = '' as $$ select stockos_private.taxonomy_mutation('create_supplier', p_input); $$;
create function public.stockos_update_supplier(p_input jsonb)
returns jsonb language sql security definer set search_path = '' as $$ select stockos_private.taxonomy_mutation('update_supplier', p_input); $$;
create function public.stockos_delete_supplier(p_input jsonb)
returns jsonb language sql security definer set search_path = '' as $$ select stockos_private.taxonomy_mutation('delete_supplier', p_input); $$;

create function public.stockos_list_categories(p_input jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_items jsonb;
begin
  perform stockos_private.owner_context(true);
  perform stockos_private.allowed_keys(p_input, array[]::text[]);
  select coalesce(jsonb_agg(stockos_private.taxonomy_dto_category(r) order by r.name collate "C"), '[]'::jsonb)
    into v_items from stockos_private.categories r;
  return jsonb_build_object('ok', true, 'data', v_items);
exception when others then return stockos_private.safe_failure(sqlerrm);
end $$;

create function public.stockos_list_suppliers(p_input jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_items jsonb;
begin
  perform stockos_private.owner_context(true);
  perform stockos_private.allowed_keys(p_input, array[]::text[]);
  select coalesce(jsonb_agg(stockos_private.taxonomy_dto_supplier(r) order by r.name collate "C"), '[]'::jsonb)
    into v_items from stockos_private.suppliers r;
  return jsonb_build_object('ok', true, 'data', v_items);
exception when others then return stockos_private.safe_failure(sqlerrm);
end $$;

revoke all on function public.stockos_create_category(jsonb), public.stockos_update_category(jsonb), public.stockos_delete_category(jsonb), public.stockos_create_supplier(jsonb), public.stockos_update_supplier(jsonb), public.stockos_delete_supplier(jsonb), public.stockos_list_categories(jsonb), public.stockos_list_suppliers(jsonb) from public, anon, authenticated;
grant execute on function public.stockos_create_category(jsonb), public.stockos_update_category(jsonb), public.stockos_delete_category(jsonb), public.stockos_create_supplier(jsonb), public.stockos_update_supplier(jsonb), public.stockos_delete_supplier(jsonb), public.stockos_list_categories(jsonb), public.stockos_list_suppliers(jsonb) to authenticated;
