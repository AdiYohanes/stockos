-- Bounded detail, whole-filter summaries, and export overflow denial share one statement snapshot.
create or replace function public.stockos_get_valuation_report(p_input jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_mode text; v_page bigint := 1; v_size bigint := 25;
  v_search text; v_category text; v_data jsonb;
begin
  perform stockos_private.owner_context(true);
  v_mode := coalesce(stockos_private.input_text(p_input, 'mode', 10), 'screen');
  if v_mode not in ('screen','summary','export') then raise exception 'VALIDATION_ERROR'; end if;
  if v_mode = 'screen' then
    perform stockos_private.allowed_keys(p_input, array['mode','search','category','page','pageSize']);
    v_page := stockos_private.input_quantity(p_input, 'page', 1, 1);
    v_size := stockos_private.input_quantity(p_input, 'pageSize', 1, 25);
    if v_size > 100 then raise exception 'VALIDATION_ERROR'; end if;
  else perform stockos_private.allowed_keys(p_input, array['mode','search','category']); end if;
  if p_input -> 'search' = '""'::jsonb then v_search := null;
  else v_search := stockos_private.input_text(p_input, 'search', 120); end if;
  v_category := stockos_private.input_text(p_input, 'category', 120);

  with matching as materialized (
    select p.* from stockos_private.products p where archived_at is null
      and (v_search is null or strpos(lower(p.name), lower(v_search)) > 0 or strpos(lower(p.sku), lower(v_search)) > 0)
      and (v_category is null or category = v_category)
  ), totals as (
    select count(*) as skus, coalesce(sum(current_stock),0) as units,
      coalesce(sum(inventory_cost_value),0) as cost,
      coalesce(sum(current_stock * selling_price),0::numeric) as retail from matching
  ), categories as materialized (
    select category, count(*) as items, sum(current_stock) as qty,
      sum(inventory_cost_value) as cost, sum(current_stock * selling_price) as retail
    from matching group by category
  ), candidates as materialized (
    select c.* from categories c where v_mode <> 'summary'
    order by category collate "C"
    limit case when v_mode = 'export' then 10001 else v_size end
    offset case when v_mode = 'screen' then (v_page - 1) * v_size else 0 end
  ), probe as (select count(*) as n from candidates),
  detail as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'categoryName', c.category, 'itemCount', c.items, 'stockQty', c.qty,
      'totalCost', c.cost::text, 'totalRetailValue', c.retail::text, 'grossMargin', (c.retail-c.cost)::text,
      'marginPercent', case when c.retail>0 then round((c.retail-c.cost)/c.retail*100,2)::text else '0.00' end,
      'ratioPercent', case when t.retail>0 then round(c.retail/t.retail*100,1)::text else '0.0' end
    ) order by c.category collate "C"), '[]'::jsonb) as rows
    from candidates c cross join totals t where v_mode <> 'export' or (select n from probe)<=10000
  )
  select case when v_mode='export' and (select n from probe)>10000 then null else
    jsonb_build_object('mode',v_mode,'total',jsonb_build_object(
      'totalSKUs',t.skus,'totalUnits',t.units,'totalCost',t.cost::text,'totalValuation',t.retail::text,
      'grossMargin',(t.retail-t.cost)::text,
      'marginPercent',case when t.retail>0 then round((t.retail-t.cost)/t.retail*100,2)::text else '0.00' end,
      'asOf',to_jsonb(statement_timestamp())
    )) || case when v_mode='summary' then '{}'::jsonb else jsonb_build_object('categories',(select rows from detail),'count',(select count(*) from categories)) end
      || case when v_mode='screen' then jsonb_build_object('page',v_page,'pageSize',v_size) else '{}'::jsonb end
    end into v_data from totals t;
  if v_data is null then raise exception 'LIMIT_EXCEEDED'; end if;
  return jsonb_build_object('ok',true,'data',v_data);
exception when others then return stockos_private.safe_failure(sqlerrm);
end $$;

create or replace function public.stockos_get_movement_report(p_input jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_mode text; v_page bigint := 1; v_size bigint := 25;
  v_start text; v_end text; v_timezone text; v_category text; v_search text; v_product uuid;
  v_data jsonb; v_timezone_matches boolean;
begin
  perform stockos_private.owner_context(true);
  v_mode := coalesce(stockos_private.input_text(p_input, 'mode', 10), 'screen');
  if v_mode not in ('screen','summary','export') then raise exception 'VALIDATION_ERROR'; end if;
  if v_mode='screen' then
    perform stockos_private.allowed_keys(p_input,array['mode','startDate','endDate','expectedTimezone','search','category','productId','page','pageSize']);
    v_page := stockos_private.input_quantity(p_input,'page',1,1);
    v_size := stockos_private.input_quantity(p_input,'pageSize',1,25);
    if v_size>100 then raise exception 'VALIDATION_ERROR'; end if;
  else perform stockos_private.allowed_keys(p_input,array['mode','startDate','endDate','expectedTimezone','search','category','productId']); end if;
  v_start := stockos_private.input_text(p_input,'startDate',10,true);
  v_end := stockos_private.input_text(p_input,'endDate',10,true);
  v_timezone := stockos_private.input_text(p_input,'expectedTimezone',30,true);
  if v_timezone not in ('Asia/Jakarta','Asia/Makassar','Asia/Jayapura')
    or v_start !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or v_end !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'VALIDATION_ERROR'; end if;
  begin
    if v_start::date>=v_end::date or v_end::date-v_start::date>366 then raise exception 'VALIDATION_ERROR'; end if;
  exception when datetime_field_overflow or invalid_datetime_format then raise exception 'VALIDATION_ERROR'; end;
  v_category := stockos_private.input_text(p_input,'category',120);
  v_product := stockos_private.input_uuid(p_input,'productId',false);
  if p_input -> 'search' = '""'::jsonb then v_search := null;
  else v_search := stockos_private.input_text(p_input,'search',120); end if;

  with settings as materialized (select timezone=v_timezone as matches from stockos_private.shop_settings where id=1),
  events as materialized (
    select e.*, p.sku, p.name, p.category, p.current_stock
    from stockos_private.inventory_events e join stockos_private.products p on p.id=e.product_id
    where (select matches from settings)
      and e.recorded_at >= (v_start::date::timestamp at time zone v_timezone)
      and e.recorded_at < (v_end::date::timestamp at time zone v_timezone)
      and (v_category is null or p.category=v_category) and (v_product is null or p.id=v_product)
      and (v_search is null or strpos(lower(p.name),lower(v_search))>0 or strpos(lower(p.sku),lower(v_search))>0)
  ), totals as (
    select coalesce(sum(quantity_delta) filter(where kind='opening'),0) as opening,
      coalesce(sum(quantity_delta) filter(where kind='receipt'),0) as receipt,
      coalesce(sum(-quantity_delta) filter(where kind='sold'),0) as sold,
      coalesce(sum(quantity_delta) filter(where kind='opname'),0) as delta,
      count(*) filter(where kind='opname') as opname,
      count(*) filter(where kind='cost_adjustment') as cost,
      count(distinct product_id) as products, count(*) as events from events
  ), products as materialized (
    select product_id, sku, name, category, current_stock,
      coalesce(sum(quantity_delta) filter(where kind='opening'),0) as opening,
      coalesce(sum(quantity_delta) filter(where kind='receipt'),0) as receipt,
      coalesce(sum(-quantity_delta) filter(where kind='sold'),0) as sold,
      coalesce(sum(quantity_delta) filter(where kind='opname'),0) as delta,
      count(*) filter(where kind='opname') as opname, count(*) filter(where kind='cost_adjustment') as cost,
      max(recorded_at) as last_movement from events group by product_id,sku,name,category,current_stock
  ), candidates as materialized (
    select p.* from products p where v_mode<>'summary' order by name collate "C",product_id
    limit case when v_mode='export' then 10001 else v_size end
    offset case when v_mode='screen' then (v_page-1)*v_size else 0 end
  ), probe as (select count(*) as n from candidates),
  detail as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'productId',product_id,'sku',sku,'name',name,'category',category,'currentStock',current_stock,
      'openingQty',opening,'stockInQty',receipt,'stockOutQty',sold,'opnameDelta',delta,
      'opnameCount',opname,'costAdjustmentCount',cost,'lastMovementDate',to_jsonb(last_movement)
    ) order by name collate "C",product_id),'[]'::jsonb) as rows
    from candidates where v_mode<>'export' or (select n from probe)<=10000
  ), daily as (
    select to_char(recorded_at at time zone v_timezone,'YYYY-MM-DD') as day,
      coalesce(sum(quantity_delta) filter(where kind in('opening','receipt')),0) as inbound,
      coalesce(sum(-quantity_delta) filter(where kind='sold'),0) as outbound
    from events where v_mode='screen' group by day
  )
  select (select matches from settings),
    case when v_mode='export' and (select n from probe)>10000 then null else
      jsonb_build_object('mode',v_mode,'summary',jsonb_build_object(
        'startDate',v_start,'endDate',v_end,'timezone',v_timezone,'totalOpeningQty',t.opening,'totalStockInQty',t.receipt,
        'totalStockOutQty',t.sold,'totalOpnameDelta',t.delta,'totalOpnameCount',t.opname,
        'totalCostAdjustmentCount',t.cost,'distinctProductsCount',t.products,'totalEventsCount',t.events
      )) || case when v_mode='summary' then '{}'::jsonb else jsonb_build_object('items',(select rows from detail),'count',t.products) end
      || case when v_mode='screen' then jsonb_build_object('page',v_page,'pageSize',v_size,
        'trends',(select coalesce(jsonb_agg(jsonb_build_object('date',day,'stockIn',inbound,'stockOut',outbound,'netFlow',inbound-outbound) order by day),'[]'::jsonb) from daily)) else '{}'::jsonb end
    end into v_timezone_matches,v_data from totals t;
  if v_timezone_matches is distinct from true then raise exception 'VERSION_CONFLICT'; end if;
  if v_data is null then raise exception 'LIMIT_EXCEEDED'; end if;
  return jsonb_build_object('ok',true,'data',v_data);
exception when others then return stockos_private.safe_failure(sqlerrm);
end $$;

create or replace function public.stockos_get_low_stock_report(p_input jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_mode text; v_page bigint := 1; v_size bigint := 25;
  v_search text; v_category text; v_data jsonb;
begin
  perform stockos_private.owner_context(true);
  v_mode := coalesce(stockos_private.input_text(p_input,'mode',10),'screen');
  if v_mode not in ('screen','summary','export') then raise exception 'VALIDATION_ERROR'; end if;
  if v_mode='screen' then
    perform stockos_private.allowed_keys(p_input,array['mode','search','category','page','pageSize']);
    v_page := stockos_private.input_quantity(p_input,'page',1,1);
    v_size := stockos_private.input_quantity(p_input,'pageSize',1,25);
    if v_size>100 then raise exception 'VALIDATION_ERROR'; end if;
  else perform stockos_private.allowed_keys(p_input,array['mode','search','category']); end if;
  if p_input -> 'search' = '""'::jsonb then v_search := null;
  else v_search := stockos_private.input_text(p_input,'search',120); end if;
  v_category := stockos_private.input_text(p_input,'category',120);
  with matching as materialized (
    select p.*, greatest(min_stock-current_stock,0) as deficit from stockos_private.products p
    where archived_at is null and current_stock<=min_stock
      and (v_category is null or category=v_category)
      and (v_search is null or strpos(lower(name),lower(v_search))>0 or strpos(lower(sku),lower(v_search))>0)
  ), totals as (
    select count(*) as alerts, count(*) filter(where current_stock=0) as empty,
      count(*) filter(where current_stock>0) as low, coalesce(sum(deficit),0) as deficit from matching
  ), candidates as materialized (
    select p.* from matching p where v_mode<>'summary'
    order by (current_stock=0) desc,deficit desc,name collate "C",id
    limit case when v_mode='export' then 10001 else v_size end
    offset case when v_mode='screen' then (v_page-1)*v_size else 0 end
  ), probe as (select count(*) as n from candidates),
  detail as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',id,'sku',sku,'name',name,'category',category,'unit',unit,'supplier',supplier,'shelfLocation',shelf_location,
      'currentStock',current_stock,'minStock',min_stock,'stockStatus',case when current_stock=0 then 'out_of_stock' else 'low_stock' end,
      'deficit',deficit,'sellingPrice',selling_price::text,'inventoryCostValue',inventory_cost_value::text,
      'averagePurchaseCost',case when current_stock>0 then round(inventory_cost_value/current_stock,6)::text else null end
    ) order by (current_stock=0) desc,deficit desc,name collate "C",id),'[]'::jsonb) as rows
    from candidates where v_mode<>'export' or (select n from probe)<=10000
  )
  select case when v_mode='export' and (select n from probe)>10000 then null else
    jsonb_build_object('mode',v_mode,'summary',jsonb_build_object('totalAlerts',t.alerts,'outOfStockCount',t.empty,'lowStockCount',t.low,'totalDeficit',t.deficit))
      || case when v_mode='summary' then '{}'::jsonb else jsonb_build_object('items',(select rows from detail),'count',t.alerts) end
      || case when v_mode='screen' then jsonb_build_object('page',v_page,'pageSize',v_size) else '{}'::jsonb end
    end into v_data from totals t;
  if v_data is null then raise exception 'LIMIT_EXCEEDED'; end if;
  return jsonb_build_object('ok',true,'data',v_data);
exception when others then return stockos_private.safe_failure(sqlerrm);
end $$;

revoke all on function public.stockos_get_valuation_report(jsonb), public.stockos_get_movement_report(jsonb), public.stockos_get_low_stock_report(jsonb) from public, anon, authenticated;
grant execute on function public.stockos_get_valuation_report(jsonb), public.stockos_get_movement_report(jsonb), public.stockos_get_low_stock_report(jsonb) to authenticated;
