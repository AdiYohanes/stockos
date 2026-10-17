-- Fix private schema grant leak: ensure shop_settings_dto is not executable by public, anon, or authenticated
revoke all on function stockos_private.shop_settings_dto(stockos_private.shop_settings) from public, anon, authenticated;
