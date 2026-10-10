import { redirect } from "next/navigation";
import { ProductsContainer } from "@/features/products";
import { listProducts, getProductMetrics, getTextSuggestions } from "@/features/products/server";
import { ListProductsInputSchema } from "@/features/products/schemas/product-rpc.schema";
import type { ProductFilterState } from "@/features/products/types";

export const metadata = { title: "Products | StockOS", description: "Product and master stock management." };

export default async function ProductsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (key: string) => typeof params[key] === "string" ? params[key] : undefined;
  const valid = <T,>(schema: { safeParse: (value: unknown) => { success: boolean; data?: T } }, value: unknown, fallback: T): T => {
    const result = schema.safeParse(value);
    return result.success && result.data !== undefined ? result.data : fallback;
  };
  const fields = ListProductsInputSchema.shape;
  const integer = (key: string) => /^[0-9]{1,10}$/.test(one(key) ?? "") ? Number(one(key)) : undefined;
  const input = {
    search: valid(fields.search, one("q"), ""), category: valid(fields.category, one("category"), null),
    health: valid(fields.health, one("status"), "all" as const), archive: valid(fields.archive, one("archive"), "active" as const),
    sort: valid(fields.sort, one("sort"), "name" as const), direction: valid(fields.direction, one("order"), "asc" as const),
    page: valid(fields.page, integer("page"), 1), pageSize: valid(fields.pageSize, integer("pageSize"), 25),
  };
  const filterState: ProductFilterState = {
    searchQuery: input.search ?? "", category: input.category ?? "", status: input.health ?? "all", archive: input.archive ?? "active",
    sortField: input.sort ?? "name", sortOrder: input.direction ?? "asc", page: input.page ?? 1, pageSize: input.pageSize ?? 25,
  };
  const [catalog, metrics, suggestions] = await Promise.all([
    listProducts(input), getProductMetrics({ archive: filterState.archive }), getTextSuggestions({ kind: "category" }),
  ]);
  const failure = [catalog, metrics, suggestions].find((result) => !result.ok);
  if (failure && !failure.ok && failure.code === "UNAUTHENTICATED") redirect("/login");
  return <ProductsContainer filterState={filterState} catalog={catalog.ok ? catalog.data : null}
    metrics={metrics.ok ? metrics.data : null} categories={suggestions.ok ? suggestions.data : []}
    failure={failure && !failure.ok ? failure : null} />;
}
