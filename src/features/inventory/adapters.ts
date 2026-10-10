import type { ProductDto, InventoryEventDto } from "./schemas/inventory-rpc.schema";
import type { InventoryItem, StockMovement, MovementType } from "./types";

export function mapProductToInventoryItem(product: ProductDto): InventoryItem {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    category: product.category,
    locationBin: product.shelfLocation || "-",
    currentStock: product.currentStock,
    reservedStock: 0,
    availableStock: product.currentStock,
    minStock: product.minStock,
    maxStock: Math.max(product.minStock * 4, product.currentStock, 100),
    unit: product.unit,
    unitCost: product.averagePurchaseCost ? parseFloat(product.averagePurchaseCost) : 0,
    unitPrice: parseFloat(product.sellingPrice),
    status: product.stockStatus,
    lastMovementAt: product.updatedAt,
    stockVersion: product.stockVersion,
  };
}

export function mapEventToStockMovement(event: InventoryEventDto): StockMovement {
  let type: MovementType = "adjustment";
  if (event.kind === "receipt" || event.kind === "opening") type = "in";
  else if (event.kind === "sold") type = "out";

  return {
    id: event.id,
    itemId: event.productId,
    sku: event.skuSnapshot,
    itemName: event.nameSnapshot,
    type,
    quantity: event.quantityDelta,
    previousStock: event.quantityBefore,
    newStock: event.quantityAfter,
    reference: event.reference || "-",
    note: event.note || undefined,
    performedBy: event.actorDisplay || "Owner",
    timestamp: event.recordedAt,
  };
}
