import "server-only";
import {
  authorizeProducts,
  productRead,
  getTextSuggestions,
} from "@/features/products/server";
import {
  ListProductsInputSchema,
  ProductsPageSchema,
  GetProductInputSchema,
  ProductDtoSchema,
  ProductMetricsInputSchema,
  ProductMetricsSchema,
} from "@/features/products/schemas/product-rpc.schema";
import {
  ListInventoryEventsInputSchema,
  InventoryEventsPageSchema,
} from "./schemas/inventory-rpc.schema";

export async function listInventoryStock(input: unknown = {}, writable = false) {
  return productRead("stockos_list_products", ListProductsInputSchema, ProductsPageSchema, input, writable);
}

export async function listInventoryEvents(input: unknown = {}, writable = false) {
  return productRead("stockos_list_inventory_events", ListInventoryEventsInputSchema, InventoryEventsPageSchema, input, writable);
}

export async function getInventoryProduct(input: unknown, writable = false) {
  return productRead("stockos_get_product", GetProductInputSchema, ProductDtoSchema, input, writable);
}

export async function getInventoryMetrics(input: unknown = {}, writable = false) {
  return productRead("stockos_product_metrics", ProductMetricsInputSchema, ProductMetricsSchema, input, writable);
}

export { getTextSuggestions, authorizeProducts };
