"use client";

import * as React from "react";
import { listProductsAction } from "@/features/products/actions";
import type { ProductDto, ProductsPage } from "@/features/products/schemas/product-rpc.schema";
import type { InventoryItem } from "../types";
import { ProductPhoto } from "@/features/products/components/product-photo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/context";

export function StockProductPicker({ value, disabled, native = false, onSelect }: {
  value: ProductDto | InventoryItem | null;
  disabled: boolean;
  native?: boolean;
  onSelect: (product: ProductDto) => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = React.useState({ search: "", page: 1, attempt: 0 });
  const [result, setResult] = React.useState<{ query: typeof query; data?: ProductsPage; error?: string } | null>(null);
  const loading = result?.query !== query;
  React.useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const response = await listProductsAction({ search: query.search, page: query.page, pageSize: 20, archive: "active", sort: "name", direction: "asc" });
        if (active) setResult(response.ok ? { query, data: response.data } : { query, error: t.products.persistent.errors[response.code] || t.common.error });
      } catch {
        if (active) setResult({ query, error: t.common.error });
      }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [query, t]);
  const data = !loading ? result?.data : undefined;
  const items = data?.items ?? [];
  const select = (id: string | null) => {
    const product = items.find(item => item.id === id);
    if (product) onSelect(product);
  };
  const label = t.products.searchPlaceholder;
  return <div className="space-y-2" aria-busy={loading}>
    <Label htmlFor="stockProductSearch" className="sr-only">{label}</Label>
    <Input id="stockProductSearch" value={query.search} maxLength={120} disabled={disabled}
      placeholder={label} onChange={event => setQuery({ search: event.target.value, page: 1, attempt: 0 })} />
    {loading ? <p role="status" className="text-xs">{t.common.loading}</p> : result?.error ? <div role="alert" className="space-y-2 text-xs">
      <p>{result.error}</p>
      <Button type="button" variant="outline" disabled={disabled} onClick={() => setQuery(current => ({ ...current, attempt: current.attempt + 1 }))}>{t.products.persistent.retry}</Button>
    </div> : <>
      {native ? <select id="itemSelect" value={value?.id ?? ""} disabled={disabled} onChange={event => select(event.target.value)}
        className="w-full h-9 border-[3px] border-ink bg-white px-3 text-xs font-bold text-ink focus-visible:outline-2 focus-visible:outline-ring">
        <option value="">{t.products.persistent.selectRequired}</option>
        {value && !items.some(item => item.id === value.id) && <option value={value.id}>{value.sku} - {value.name} ({value.currentStock} {value.unit})</option>}
        {items.map(item => <option key={item.id} value={item.id}>{item.sku} - {item.name} ({item.currentStock} {item.unit})</option>)}
      </select> : <Select value={value?.id ?? ""} disabled={disabled} onValueChange={select}>
        <SelectTrigger id="itemSelect" className="h-auto min-h-14 whitespace-normal text-left">
          {value ? <span className="flex min-w-0 items-center gap-2"><ProductPhoto photo={value.photo} /><span className="min-w-0 break-words">{value.sku} - {value.name} ({value.currentStock} {value.unit})</span></span> : t.products.persistent.selectRequired}
        </SelectTrigger>
        <SelectContent>{items.map(item => <SelectItem key={item.id} value={item.id} label={`${item.sku} ${item.name}`}>
          <span className="flex min-w-0 items-center gap-2"><ProductPhoto photo={item.photo} /><span className="min-w-0 whitespace-normal">{item.sku} - {item.name} ({item.currentStock} {item.unit})</span></span>
        </SelectItem>)}</SelectContent>
      </Select>}
      {data && data.total === 0 && <p role="status" className="text-xs">{t.products.empty.noMatching}</p>}
      {data && data.total > 20 && <div className="flex items-center justify-between gap-2 text-xs">
        <Button type="button" variant="outline" disabled={disabled || query.page <= 1} onClick={() => setQuery(current => ({ ...current, page: current.page - 1 }))}>{t.products.table.previous}</Button>
        <span>{t.products.table.page} {data.page} / {Math.ceil(data.total / 20)}</span>
        <Button type="button" variant="outline" disabled={disabled || query.page * 20 >= data.total} onClick={() => setQuery(current => ({ ...current, page: current.page + 1 }))}>{t.products.table.next}</Button>
      </div>}
    </>}
  </div>;
}
