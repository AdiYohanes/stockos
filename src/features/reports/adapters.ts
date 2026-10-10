import type {
  ValuationReportDto,
  MovementReportDto,
  LowStockReportDto,
} from "./schemas/reports-rpc.schema";
import type {
  ValuationSummary,
  MovementVelocityItem,
  MovementTrendPoint,
  ReorderRiskItem,
} from "./types";

export function mapValuationReport(dto: ValuationReportDto): ValuationSummary {
  return {
    totalValuation: Number(dto.total.totalValuation),
    totalCost: Number(dto.total.totalCost),
    grossMargin: Number(dto.total.grossMargin),
    marginPercent: Number(dto.total.marginPercent),
    totalSKUs: dto.total.totalSKUs,
    categories: dto.categories.map((c) => ({
      categoryId: c.categoryName,
      categoryName: c.categoryName,
      itemCount: c.itemCount,
      stockQty: c.stockQty,
      totalCost: Number(c.totalCost),
      totalRetailValue: Number(c.totalRetailValue),
      marginPercent: Number(c.marginPercent),
      ratioPercent: Number(c.ratioPercent),
    })),
  };
}

export function mapMovementReport(dto: MovementReportDto): {
  items: MovementVelocityItem[];
  trends: MovementTrendPoint[];
} {
  return {
    items: dto.items.map((i) => ({
      productId: i.productId,
      sku: i.sku,
      name: i.name,
      category: i.category,
      openingQty: i.openingQty,
      stockInQty: i.stockInQty,
      stockOutQty: i.stockOutQty,
      opnameDelta: i.opnameDelta,
      currentStock: i.currentStock,
      lastMovementDate: i.lastMovementDate || "-",
    })),
    trends: dto.trends.map((t) => ({
      date: t.date,
      stockIn: t.stockIn,
      stockOut: t.stockOut,
      netFlow: t.netFlow,
    })),
  };
}

export function mapLowStockReport(dto: LowStockReportDto): ReorderRiskItem[] {
  return dto.items.map((item) => {
    const cost = item.averagePurchaseCost ? Number(item.averagePurchaseCost) : 0;
    const qty = item.deficit > 0 ? item.deficit : item.minStock;
    return {
      productId: item.id,
      sku: item.sku,
      name: item.name,
      category: item.category,
      currentStock: item.currentStock,
      minThreshold: item.minStock,
      suggestedReorderQty: qty,
      unitCost: cost,
      totalReorderCost: qty * cost,
      urgency: item.currentStock === 0 ? "critical" : "warning",
      supplierName: item.supplier || "-",
    };
  });
}
