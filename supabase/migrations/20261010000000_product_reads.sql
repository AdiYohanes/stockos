-- Catalog reads share the password-owner boundary; private tables stay inaccessible.
create function public.stockos_product_metrics(p_input jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_archive text; v_data jsonb;
begin
  perform stockos_private.owner_context(true);
  perform stockos_private.allowed_keys(p_input, array['archive']);
  v_archive := coalesce(stockos_private.input_text(p_input, 'archive', 20), 'active');
  if v_archive not in ('active','archived','all') then raise exception 'VALIDATION_ERROR'; end if;
  select jsonb_build_object(
    'totalProducts', count(*),
    'inStockCount', count(*) filter (where current_stock > min_stock),
    'lowStockCount', count(*) filter (where current_stock > 0 and current_stock <= min_stock),
    'outOfStockCount', count(*) filter (where current_stock = 0),
    'totalValuation', coalesce(sum(inventory_cost_value), 0::numeric(30,6))::text)
    into v_data from stockos_private.products
    where v_archive = 'all' or (v_archive = 'active' and archived_at is null)
      or (v_archive = 'archived' and archived_at is not null);
  return jsonb_build_object('ok', true, 'data', v_data);
exception when others then return stockos_private.safe_failure(sqlerrm);
end $$;

create function public.stockos_text_suggestions(p_input jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_kind text; v_prefix text; v_data jsonb;
begin
  perform stockos_private.owner_context(true);
  perform stockos_private.allowed_keys(p_input, array['kind','prefix']);
  v_kind := stockos_private.input_text(p_input, 'kind', 8, true);
  if v_kind not in ('category','supplier') then raise exception 'VALIDATION_ERROR'; end if;
  if p_input -> 'prefix' = '""'::jsonb then v_prefix := null;
  else v_prefix := stockos_private.input_text(p_input, 'prefix', 120); end if;
  -- Both active and archived metadata remain useful free-text suggestions.
  select coalesce(jsonb_agg(value order by value collate "C"), '[]'::jsonb) into v_data
    from (
      select distinct case v_kind when 'category' then category else supplier end collate "C" as value
      from stockos_private.products
      where (case v_kind when 'category' then category else supplier end) is not null
        and (v_prefix is null or strpos(case v_kind when 'category' then category else supplier end, v_prefix) = 1)
      order by value limit 30
    ) suggestions;
  return jsonb_build_object('ok', true, 'data', v_data);
exception when others then return stockos_private.safe_failure(sqlerrm);
end $$;

revoke all on function public.stockos_product_metrics(jsonb), public.stockos_text_suggestions(jsonb) from public, anon, authenticated;
grant execute on function public.stockos_product_metrics(jsonb), public.stockos_text_suggestions(jsonb) to authenticated;
