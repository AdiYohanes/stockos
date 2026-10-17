-- Dashboard reads share the password-owner boundary; private tables stay inaccessible.
create or replace function public.stockos_get_dashboard(p_input jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_timezone text;
  v_today date;
  v_total_products bigint;
  v_in_stock_count bigint;
  v_low_stock_count bigint;
  v_out_of_stock_count bigint;
  v_potential_selling_value numeric(30,0);
  v_total_cost_value numeric(30,6);
  v_potential_gross_profit numeric(30,6);
  v_healthy_value numeric(30,0);
  v_low_stock_value numeric(30,0);
  v_out_of_stock_value numeric(30,0);
  v_health_score int;
  v_healthy_pct numeric(5,1);
  v_low_stock_pct numeric(5,1);
  v_out_of_stock_pct numeric(5,1);
  v_attention_items jsonb;
  v_recent_events jsonb;
  v_movements_7d jsonb;
  v_movements_30d jsonb;
begin
  perform stockos_private.owner_context(true);
  perform stockos_private.allowed_keys(p_input, array[]::text[]);

  select timezone into v_timezone from stockos_private.shop_settings where id = 1;
  if v_timezone is null then
    v_timezone := 'Asia/Jakarta';
  end if;

  v_today := (clock_timestamp() at time zone v_timezone)::date;

  -- 1. Aggregations on active products
  select
    count(*)::bigint,
    count(*) filter (where current_stock > min_stock)::bigint,
    count(*) filter (where current_stock > 0 and current_stock <= min_stock)::bigint,
    count(*) filter (where current_stock = 0)::bigint,
    coalesce(sum(current_stock * selling_price), 0)::numeric(30,0),
    coalesce(sum(inventory_cost_value), 0::numeric(30,6)),
    (coalesce(sum(current_stock * selling_price), 0)::numeric(30,6) - coalesce(sum(inventory_cost_value), 0::numeric(30,6))),
    coalesce(sum(current_stock * selling_price) filter (where current_stock > min_stock), 0)::numeric(30,0),
    coalesce(sum(current_stock * selling_price) filter (where current_stock > 0 and current_stock <= min_stock), 0)::numeric(30,0),
    coalesce(sum(selling_price) filter (where current_stock = 0), 0)::numeric(30,0)
  into
    v_total_products,
    v_in_stock_count,
    v_low_stock_count,
    v_out_of_stock_count,
    v_potential_selling_value,
    v_total_cost_value,
    v_potential_gross_profit,
    v_healthy_value,
    v_low_stock_value,
    v_out_of_stock_value
  from stockos_private.products
  where archived_at is null;

  v_health_score := case
    when v_total_products = 0 then 100
    else round((v_in_stock_count::numeric / v_total_products::numeric) * 100)::int
  end;

  v_healthy_pct := case
    when v_total_products = 0 then 0.0
    else round((v_in_stock_count::numeric / v_total_products::numeric) * 100, 1)
  end;

  v_low_stock_pct := case
    when v_total_products = 0 then 0.0
    else round((v_low_stock_count::numeric / v_total_products::numeric) * 100, 1)
  end;

  v_out_of_stock_pct := case
    when v_total_products = 0 then 0.0
    else round((v_out_of_stock_count::numeric / v_total_products::numeric) * 100, 1)
  end;

  -- 2. Need Attention Items (active, current_stock <= min_stock, limit 20)
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'sku', p.sku,
    'name', p.name,
    'category', p.category,
    'currentStock', p.current_stock,
    'minStock', p.min_stock,
    'unit', p.unit,
    'status', case when p.current_stock = 0 then 'out_of_stock' else 'low_stock' end,
    'lastRestocked', to_jsonb((
      select max(e.recorded_at)
      from stockos_private.inventory_events e
      where e.product_id = p.id and e.kind in ('opening', 'receipt')
    ))
  )), '[]'::jsonb)
  into v_attention_items
  from (
    select *
    from stockos_private.products
    where archived_at is null and current_stock <= min_stock
    order by current_stock asc, name collate "C" asc
    limit 20
  ) p;

  -- 3. Bounded Recent Events (limit 10)
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', e.id,
    'productId', e.product_id,
    'productSku', p.sku,
    'productName', p.name,
    'kind', e.kind,
    'quantityDelta', e.quantity_delta,
    'reference', e.reference,
    'recordedAt', to_jsonb(e.recorded_at)
  )), '[]'::jsonb)
  into v_recent_events
  from (
    select *
    from stockos_private.inventory_events
    order by recorded_at desc, id desc
    limit 10
  ) e
  join stockos_private.products p on p.id = e.product_id;

  -- 4. 7-Day Movements (Daily buckets)
  with days7_series as (
    select generate_series(v_today - 6, v_today, '1 day'::interval)::date as d
  ),
  days7_data as (
    select
      case extract(isodow from s.d)
        when 1 then 'Sen'
        when 2 then 'Sel'
        when 3 then 'Rab'
        when 4 then 'Kam'
        when 5 then 'Jum'
        when 6 then 'Sab'
        when 7 then 'Min'
      end as period,
      coalesce(sum(e.quantity_delta) filter (where e.kind in ('opening', 'receipt')), 0)::bigint as "stockIn",
      coalesce(sum(-e.quantity_delta) filter (where e.kind = 'sold'), 0)::bigint as "stockOut"
    from days7_series s
    left join stockos_private.inventory_events e
      on (e.recorded_at at time zone v_timezone)::date = s.d
    group by s.d
    order by s.d asc
  )
  select
    jsonb_build_object(
      'timeframe', '7d',
      'totalIn', coalesce(sum("stockIn"), 0)::bigint,
      'totalOut', coalesce(sum("stockOut"), 0)::bigint,
      'netChange', (coalesce(sum("stockIn"), 0) - coalesce(sum("stockOut"), 0))::bigint,
      'data', coalesce(jsonb_agg(jsonb_build_object(
        'period', period,
        'stockIn', "stockIn",
        'stockOut', "stockOut"
      )), '[]'::jsonb)
    )
  into v_movements_7d
  from days7_data;

  -- 5. 30-Day Movements (4 weekly buckets)
  with weeks as (
    select 1 as wk, 'Minggu 1' as period, (v_today - 27) as w_start, (v_today - 21) as w_end
    union all
    select 2 as wk, 'Minggu 2' as period, (v_today - 20) as w_start, (v_today - 14) as w_end
    union all
    select 3 as wk, 'Minggu 3' as period, (v_today - 13) as w_start, (v_today - 7) as w_end
    union all
    select 4 as wk, 'Minggu 4' as period, (v_today - 6) as w_start, v_today as w_end
  ),
  days30_data as (
    select
      w.wk,
      w.period,
      coalesce(sum(e.quantity_delta) filter (where e.kind in ('opening', 'receipt')), 0)::bigint as "stockIn",
      coalesce(sum(-e.quantity_delta) filter (where e.kind = 'sold'), 0)::bigint as "stockOut"
    from weeks w
    left join stockos_private.inventory_events e
      on (e.recorded_at at time zone v_timezone)::date >= w.w_start
     and (e.recorded_at at time zone v_timezone)::date <= w.w_end
    group by w.wk, w.period
    order by w.wk asc
  )
  select
    jsonb_build_object(
      'timeframe', '30d',
      'totalIn', coalesce(sum("stockIn"), 0)::bigint,
      'totalOut', coalesce(sum("stockOut"), 0)::bigint,
      'netChange', (coalesce(sum("stockIn"), 0) - coalesce(sum("stockOut"), 0))::bigint,
      'data', coalesce(jsonb_agg(jsonb_build_object(
        'period', period,
        'stockIn', "stockIn",
        'stockOut', "stockOut"
      )), '[]'::jsonb)
    )
  into v_movements_30d
  from days30_data;

  return jsonb_build_object(
    'ok', true,
    'data', jsonb_build_object(
      'metrics', jsonb_build_object(
        'totalProducts', v_total_products,
        'inStockCount', v_in_stock_count,
        'lowStockCount', v_low_stock_count,
        'outOfStockCount', v_out_of_stock_count,
        'potentialSellingValue', v_potential_selling_value::text,
        'potentialGrossProfit', v_potential_gross_profit::text,
        'totalCostValue', v_total_cost_value::text
      ),
      'health', jsonb_build_object(
        'totalProducts', v_total_products,
        'healthScore', v_health_score,
        'healthy', jsonb_build_object(
          'count', v_in_stock_count,
          'percentage', v_healthy_pct,
          'value', v_healthy_value::text
        ),
        'lowStock', jsonb_build_object(
          'count', v_low_stock_count,
          'percentage', v_low_stock_pct,
          'value', v_low_stock_value::text
        ),
        'outOfStock', jsonb_build_object(
          'count', v_out_of_stock_count,
          'percentage', v_out_of_stock_pct,
          'value', v_out_of_stock_value::text
        )
      ),
      'attentionItems', v_attention_items,
      'recentEvents', v_recent_events,
      'movements', jsonb_build_object(
        'days7', v_movements_7d,
        'days30', v_movements_30d
      ),
      'asOf', to_jsonb(clock_timestamp())
    )
  );
exception when others then
  return stockos_private.safe_failure(sqlerrm);
end $$;

revoke all on function public.stockos_get_dashboard(jsonb) from public, anon, authenticated;
grant execute on function public.stockos_get_dashboard(jsonb) to authenticated;
