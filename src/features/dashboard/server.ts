import "server-only";
import { productRead } from "@/features/products/server";
import {
  GetDashboardInputSchema,
  DashboardDtoSchema,
  type DashboardDto,
} from "./schemas/dashboard-rpc.schema";
import type { ProductReadResult } from "@/features/products/schemas/product-rpc.schema";

export async function getDashboard(input: unknown = {}, writable = false): Promise<ProductReadResult<DashboardDto>> {
  return productRead("stockos_get_dashboard", GetDashboardInputSchema, DashboardDtoSchema, input, writable);
}
