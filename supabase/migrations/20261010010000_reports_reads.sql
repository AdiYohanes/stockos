-- Reports reads share the password-owner boundary; private tables stay inaccessible.
create or replace function public.stockos_get_valuation_report(p_input jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_search text;
  v_category text;
  v_as_of timestamptz := clock_timestamp();
  v_total jsonb;
  v_categories jsonb;
begin
  perform stockos_private.owner_context(true);
  perform stockos_private.allowed_keys(p_input, array['search', 'category']);
  if p_input -> 'search' = '""'::jsonb then v_search := null;
  else v_search := stockos_private.input_text(p_input, 'search', 120); end if;
  v_category := stockos_private.input_text(p_input, 'category', 120);

  with matching as materialized (
    select p.*
    from stockos_private.products p
    where p.archived_at is null
      and (v_search is null or strpos(lower(p.name), lower(v_search)) > 0 or strpos(lower(p.sku), lower(v_search)) > 0)
      and (v_category is null or p.category = v_category)
  ),
  tot_agg as (
    select
      count(*)::bigint as "totalSKUs",
      coalesce(sum(current_stock), 0)::bigint as "totalUnits",
      coalesce(sum(inventory_cost_value), 0::numeric(30,6)) as "totalCostNumeric",
      coalesce(sum(current_stock * selling_price), 0)::bigint as "totalRetailValueBigint"
    from matching
  ),
  cat_agg as (
    select
      category as "categoryName",
      count(*)::bigint as "itemCount",
      coalesce(sum(current_stock), 0)::bigint as "stockQty",
      coalesce(sum(inventory_cost_value), 0::numeric(30,6)) as "totalCostNumeric",
      coalesce(sum(current_stock * selling_price), 0)::bigint as "totalRetailValueBigint"
    from matching
    group by category
    order by category collate "C"
  )
  select
    (select jsonb_build_object(
      'totalSKUs', t."totalSKUs",
      'totalUnits', t."totalUnits",
      'totalCost', t."totalCostNumeric"::text,
      'totalValuation', t."totalRetailValueBigint"::text,
      'grossMargin', (t."totalRetailValueBigint" - t."totalCostNumeric")::text,
      'marginPercent', case
        when t."totalRetailValueBigint" > 0 then
          round(((t."totalRetailValueBigint" - t."totalCostNumeric") / t."totalRetailValueBigint"::numeric) * 100, 2)::text
        else '0.00' end,
      'asOf', to_jsonb(v_as_of)
    ) from tot_agg t),
    (select coalesce(jsonb_agg(
      jsonb_build_object(
        'categoryName', c."categoryName",
        'itemCount', c."itemCount",
        'stockQty', c."stockQty",
        'totalCost', c."totalCostNumeric"::text,
        'totalRetailValue', c."totalRetailValueBigint"::text,
        'grossMargin', (c."totalRetailValueBigint" - c."totalCostNumeric")::text,
        'marginPercent', case
          when c."totalRetailValueBigint" > 0 then
            round(((c."totalRetailValueBigint" - c."totalCostNumeric") / c."totalRetailValueBigint"::numeric) * 100, 2)::text
          else '0.00' end,
        'ratioPercent', case
          when (select "totalRetailValueBigint" from tot_agg) > 0 then
            round((c."totalRetailValueBigint" / (select "totalRetailValueBigint"::numeric from tot_agg)) * 100, 1)::text
          else '0.0' end
      )
    ), '[]'::jsonb) from cat_agg c)
  into v_total, v_categories;

  return jsonb_build_object(
    'ok', true,
    'data', jsonb_build_object(
      'total', v_total,
      'categories', v_categories
    )
  );
exception when others then return stockos_private.safe_failure(sqlerrm);
end $$;

create or replace function public.stockos_get_movement_report(p_input jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_start text; v_end text; v_category text; v_product uuid;
  v_timezone text; v_from timestamptz; v_until timestamptz;
  v_summary jsonb; v_items jsonb; v_trends jsonb;
begin
  perform stockos_private.owner_context(true);
  perform stockos_private.allowed_keys(p_input, array['startDate', 'endDate', 'category', 'productId']);
  v_start := stockos_private.input_text(p_input, 'startDate', 10, true);
  v_end := stockos_private.input_text(p_input, 'endDate', 10, true);
  v_category := stockos_private.input_text(p_input, 'category', 120);
  v_product := stockos_private.input_uuid(p_input, 'productId', false);

  if v_start !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or v_end !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    raise exception 'VALIDATION_ERROR';
  end if;
  begin
    if v_start::date >= v_end::date or v_end::date - v_start::date > 366 then
      raise exception 'VALIDATION_ERROR';
    end if;
    select timezone into v_timezone from stockos_private.shop_settings where id = 1;
    v_from := v_start::date::timestamp at time zone v_timezone;
    v_until := v_end::date::timestamp at time zone v_timezone;
  exception when datetime_field_overflow or invalid_datetime_format then
    raise exception 'VALIDATION_ERROR';
  end;

  with events_in_scope as materialized (
    select e.*, p.sku as product_sku, p.name as product_name, p.category as product_category, p.current_stock as product_current_stock
    from stockos_private.inventory_events e
    join stockos_private.products p on p.id = e.product_id
    where e.recorded_at >= v_from and e.recorded_at < v_until
      and (v_product is null or e.product_id = v_product)
      and (v_category is null or p.category = v_category)
  ),
  overall_summary as (
    select
      coalesce(sum(quantity_delta) filter (where kind = 'opening'), 0)::bigint as "totalOpeningQty",
      coalesce(sum(quantity_delta) filter (where kind = 'receipt'), 0)::bigint as "totalStockInQty",
      coalesce(sum(-quantity_delta) filter (where kind = 'sold'), 0)::bigint as "totalStockOutQty",
      coalesce(sum(quantity_delta) filter (where kind = 'opname'), 0)::bigint as "totalOpnameDelta",
      count(*) filter (where kind = 'opname')::bigint as "totalOpnameCount",
      count(*) filter (where kind = 'cost_adjustment')::bigint as "totalCostAdjustmentCount",
      count(distinct product_id)::bigint as "distinctProductsCount",
      count(*)::bigint as "totalEventsCount"
    from events_in_scope
  ),
  per_product as (
    select
      product_id as "productId",
      product_sku as "sku",
      product_name as "name",
      product_category as "category",
      product_current_stock as "currentStock",
      coalesce(sum(quantity_delta) filter (where kind = 'opening'), 0)::bigint as "openingQty",
      coalesce(sum(quantity_delta) filter (where kind = 'receipt'), 0)::bigint as "stockInQty",
      coalesce(sum(-quantity_delta) filter (where kind = 'sold'), 0)::bigint as "stockOutQty",
      coalesce(sum(quantity_delta) filter (where kind = 'opname'), 0)::bigint as "opnameDelta",
      count(*) filter (where kind = 'opname')::bigint as "opnameCount",
      count(*) filter (where kind = 'cost_adjustment')::bigint as "costAdjustmentCount",
      to_jsonb(max(recorded_at)) as "lastMovementDate"
    from events_in_scope
    group by product_id, product_sku, product_name, product_category, product_current_stock
    order by product_name collate "C"
  ),
  daily_trends as (
    select
      to_char(recorded_at at time zone v_timezone, 'YYYY-MM-DD') as "date",
      coalesce(sum(quantity_delta) filter (where kind in ('opening', 'receipt')), 0)::bigint as "stockIn",
      coalesce(sum(-quantity_delta) filter (where kind = 'sold'), 0)::bigint as "stockOut",
      (coalesce(sum(quantity_delta) filter (where kind in ('opening', 'receipt')), 0)
        - coalesce(sum(-quantity_delta) filter (where kind = 'sold'), 0))::bigint as "netFlow"
    from events_in_scope
    group by to_char(recorded_at at time zone v_timezone, 'YYYY-MM-DD')
    order by "date" asc
  )
  select
    (select jsonb_build_object(
      'startDate', v_start,
      'endDate', v_end,
      'timezone', v_timezone,
      'totalOpeningQty', s."totalOpeningQty",
      'totalStockInQty', s."totalStockInQty",
      'totalStockOutQty', s."totalStockOutQty",
      'totalOpnameDelta', s."totalOpnameDelta",
      'totalOpnameCount', s."totalOpnameCount",
      'totalCostAdjustmentCount', s."totalCostAdjustmentCount",
      'distinctProductsCount', s."distinctProductsCount",
      'totalEventsCount', s."totalEventsCount"
    ) from overall_summary s),
    (select coalesce(jsonb_agg(jsonb_build_object(
      'productId', p."productId",
      'sku', p."sku",
      'name', p."name",
      'category', p."category",
      'currentStock', p."currentStock",
      'openingQty', p."openingQty",
      'stockInQty', p."stockInQty",
      'stockOutQty', p."stockOutQty",
      'opnameDelta', p."opnameDelta",
      'opnameCount', p."opnameCount",
      'costAdjustmentCount', p."costAdjustmentCount",
      'lastMovementDate', p."lastMovementDate"
    )), '[]'::jsonb) from per_product p),
    (select coalesce(jsonb_agg(jsonb_build_object(
      'date', d."date",
      'stockIn', d."stockIn",
      'stockOut', d."stockOut",
      'netFlow', d."netFlow"
    )), '[]'::jsonb) from daily_trends d)
  into v_summary, v_items, v_trends;

  return jsonb_build_object(
    'ok', true,
    'data', jsonb_build_object(
      'summary', v_summary,
      'items', v_items,
      'trends', v_trends
    )
  );
exception when others then return stockos_private.safe_failure(sqlerrm);
end $$;

create or replace function public.stockos_get_low_stock_report(p_input jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_search text; v_category text;
  v_summary jsonb; v_items jsonb;
begin
  perform stockos_private.owner_context(true);
  perform stockos_private.allowed_keys(p_input, array['search', 'category']);
  if p_input -> 'search' = '""'::jsonb then v_search := null;
  else v_search := stockos_private.input_text(p_input, 'search', 120); end if;
  v_category := stockos_private.input_text(p_input, 'category', 120);

  with matching as materialized (
    select p.*
    from stockos_private.products p
    where p.archived_at is null
      and p.current_stock <= p.min_stock
      and (v_search is null or strpos(lower(p.name), lower(v_search)) > 0 or strpos(lower(p.sku), lower(v_search)) > 0)
      and (v_category is null or p.category = v_category)
  ),
  tot_summary as (
    select
      count(*)::bigint as "totalAlerts",
      count(*) filter (where current_stock = 0)::bigint as "outOfStockCount",
      count(*) filter (where current_stock > 0 and current_stock <= min_stock)::bigint as "lowStockCount",
      coalesce(sum(case when current_stock < min_stock then min_stock - current_stock else 0 end), 0)::bigint as "totalDeficit"
    from matching
  ),
  item_rows as (
    select
      p.id,
      p.sku,
      p.name,
      p.category,
      p.unit,
      p.supplier,
      p.shelf_location as "shelfLocation",
      p.current_stock as "currentStock",
      p.min_stock as "minStock",
      case when p.current_stock = 0 then 'out_of_stock' else 'low_stock' end as "stockStatus",
      case when p.current_stock < p.min_stock then p.min_stock - p.current_stock else 0 end as "deficit",
      p.selling_price::text as "sellingPrice",
      p.inventory_cost_value::text as "inventoryCostValue",
      case when p.current_stock > 0 then
        round(p.inventory_cost_value / p.current_stock::numeric, 6)::text
      else null end as "averagePurchaseCost"
    from matching p
    order by
      case when p.current_stock = 0 then 0 else 1 end asc,
      (p.min_stock - p.current_stock) desc,
      p.name collate "C" asc
  )
  select
    (select jsonb_build_object(
      'totalAlerts', s."totalAlerts",
      'outOfStockCount', s."outOfStockCount",
      'lowStockCount', s."lowStockCount",
      'totalDeficit', s."totalDeficit"
    ) from tot_summary s),
    (select coalesce(jsonb_agg(
      jsonb_build_object(
        'id', i.id,
        'sku', i.sku,
        'name', i.name,
        'category', i.category,
        'unit', i.unit,
        'supplier', i.supplier,
        'shelfLocation', i."shelfLocation",
        'currentStock', i."currentStock",
        'minStock', i."minStock",
        'stockStatus', i."stockStatus",
        'deficit', i.deficit,
        'sellingPrice', i."sellingPrice",
        'inventoryCostValue', i."inventoryCostValue",
        'averagePurchaseCost', i."averagePurchaseCost"
      )
    ), '[]'::jsonb) from item_rows i)
  into v_summary, v_items;

  return jsonb_build_object(
    'ok', true,
    'data', jsonb_build_object(
      'summary', v_summary,
      'items', v_items
    )
  );
exception when others then return stockos_private.safe_failure(sqlerrm);
end $$;

revoke all on function public.stockos_get_valuation_report(jsonb),
  public.stockos_get_movement_report(jsonb),
  public.stockos_get_low_stock_report(jsonb) from public, anon, authenticated;
grant execute on function public.stockos_get_valuation_report(jsonb),
  public.stockos_get_movement_report(jsonb),
  public.stockos_get_low_stock_report(jsonb) to authenticated;
