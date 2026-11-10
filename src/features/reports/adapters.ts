import type { ValuationReportDto, MovementReportDto, LowStockReportDto } from "./schemas/reports-rpc.schema";
import type { ValuationSummary, MovementVelocityItem, MovementTrendPoint, ReorderRiskItem } from "./types";

export function mapValuationReport(dto: ValuationReportDto): ValuationSummary {
  return {
    totalValuation: dto.total.totalValuation, totalCost: dto.total.totalCost, grossMargin: dto.total.grossMargin,
    marginPercent: Number(dto.total.marginPercent), totalSKUs: dto.total.totalSKUs,
    categories: (dto.mode === "summary" ? [] : dto.categories).map(c => ({
      categoryId: c.categoryName, categoryName: c.categoryName, itemCount: c.itemCount, stockQty: c.stockQty,
      totalCost: c.totalCost, totalRetailValue: c.totalRetailValue, marginPercent: Number(c.marginPercent), ratioPercent: Number(c.ratioPercent),
    })),
  };
}

export function mapMovementReport(dto: MovementReportDto): { items: MovementVelocityItem[]; trends: MovementTrendPoint[] } {
  return {
    items: (dto.mode === "summary" ? [] : dto.items).map(i => ({
      productId: i.productId, sku: i.sku, name: i.name, category: i.category, openingQty: i.openingQty,
      stockInQty: i.stockInQty, stockOutQty: i.stockOutQty, opnameDelta: i.opnameDelta,
      currentStock: i.currentStock, lastMovementDate: i.lastMovementDate || "-",
    })),
    trends: dto.mode === "screen" ? dto.trends : [],
  };
}

export function mapLowStockReport(dto: LowStockReportDto): ReorderRiskItem[] {
  return (dto.mode === "summary" ? [] : dto.items).map(item => {
    const cost = item.averagePurchaseCost ?? "0";
    const qty = item.deficit > 0 ? item.deficit : item.minStock;
    const [whole, fraction = ""] = cost.split(".");
    const total = (BigInt(whole) * BigInt(1_000_000) + BigInt(fraction.padEnd(6, "0"))) * BigInt(qty);
    return {
      productId: item.id, sku: item.sku, name: item.name, category: item.category,
      currentStock: item.currentStock, minThreshold: item.minStock, suggestedReorderQty: qty,
      unitCost: cost, totalReorderCost: `${total / BigInt(1_000_000)}.${String(total % BigInt(1_000_000)).padStart(6, "0")}`,
      urgency: item.currentStock === 0 ? "critical" : "warning", supplierName: item.supplier || "-",
    };
  });
}
