import "server-only";
import {
  authorizeProducts,
  productRead,
  productFailure,
  getTextSuggestions,
} from "@/features/products/server";
import {
  ValuationReportInputSchema,
  ValuationReportDtoSchema,
  MovementReportInputSchema,
  MovementReportDtoSchema,
  LowStockReportInputSchema,
  LowStockReportDtoSchema,
  ExportReportInputSchema,
  type ExportReportResult,
  type ValuationReportDto,
  type MovementReportDto,
  type LowStockReportDto,
} from "./schemas/reports-rpc.schema";
import type { ProductReadResult } from "@/features/products/schemas/product-rpc.schema";

export async function getValuationReport(input: unknown = {}, writable = false): Promise<ProductReadResult<ValuationReportDto>> {
  return productRead("stockos_get_valuation_report", ValuationReportInputSchema, ValuationReportDtoSchema, input, writable);
}

export async function getMovementReport(input: unknown, writable = false): Promise<ProductReadResult<MovementReportDto>> {
  return productRead("stockos_get_movement_report", MovementReportInputSchema, MovementReportDtoSchema, input, writable);
}

export async function getLowStockReport(input: unknown = {}, writable = false): Promise<ProductReadResult<LowStockReportDto>> {
  return productRead("stockos_get_low_stock_report", LowStockReportInputSchema, LowStockReportDtoSchema, input, writable);
}

function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    return str;
  }
  let safeStr = str;
  if (/^[\s\x00-\x1f\x7f]*[=+\-@]/.test(safeStr)) {
    safeStr = `'${safeStr}`;
  }
  if (/[",\r\n\t]/.test(safeStr) || safeStr.startsWith("'")) {
    return `"${safeStr.replace(/"/g, '""')}"`;
  }
  return safeStr;
}

function buildCsv(headers: string[], rows: unknown[][]): string {
  const headerLine = headers.map(sanitizeCsvCell).join(",");
  const rowLines = rows.map((r) => r.map(sanitizeCsvCell).join(","));
  return [headerLine, ...rowLines].join("\r\n");
}

export async function exportReport(input: unknown, writable = false): Promise<ProductReadResult<ExportReportResult>> {
  const parsed = ExportReportInputSchema.safeParse(input);
  if (!parsed.success) {
    return productFailure("VALIDATION_ERROR");
  }

  const { kind, search, category, startDate, endDate } = parsed.data;
  const dateStr = new Date().toISOString().slice(0, 10);
  let filename = `stockos-report-${kind}-${dateStr}.csv`;
  let headers: string[] = [];
  let rows: unknown[][] = [];

  if (kind === "valuation") {
    const report = await getValuationReport({ search, category }, writable);
    if (!report.ok) return report;
    filename = `stockos-valuation-${dateStr}.csv`;
    headers = [
      "Kategori",
      "Jumlah SKU",
      "Total Unit",
      "Total Modal (IDR)",
      "Potensi Nilai Jual (IDR)",
      "Potensi Laba Kotor (IDR)",
      "Margin (%)",
      "Porsi Valuasi (%)",
    ];
    rows = report.data.categories.map((c) => [
      c.categoryName,
      c.itemCount,
      c.stockQty,
      c.totalCost,
      c.totalRetailValue,
      c.grossMargin,
      `${c.marginPercent}%`,
      `${c.ratioPercent}%`,
    ]);
  } else if (kind === "movements") {
    if (!startDate || !endDate) return productFailure("VALIDATION_ERROR");
    const report = await getMovementReport({ startDate, endDate, category }, writable);
    if (!report.ok) return report;
    filename = `stockos-movements-${startDate}-to-${endDate}.csv`;
    headers = [
      "SKU",
      "Nama Produk",
      "Kategori",
      "Stok Awal",
      "Stok Masuk",
      "Stok Terjual",
      "Selisih Opname",
      "Jumlah Opname",
      "Jumlah Penyesuaian Modal",
      "Stok Terkini",
      "Pergerakan Terakhir",
    ];
    rows = report.data.items.map((m) => [
      m.sku,
      m.name,
      m.category,
      m.openingQty,
      m.stockInQty,
      m.stockOutQty,
      m.opnameDelta,
      m.opnameCount,
      m.costAdjustmentCount,
      m.currentStock,
      m.lastMovementDate || "-",
    ]);
  } else if (kind === "low_stock") {
    const report = await getLowStockReport({ search, category }, writable);
    if (!report.ok) return report;
    filename = `stockos-low-stock-${dateStr}.csv`;
    headers = [
      "SKU",
      "Nama Produk",
      "Kategori",
      "Satuan",
      "Lokasi Rak",
      "Pemasok",
      "Stok Terkini",
      "Batas Minimum",
      "Status",
      "Kekurangan",
      "Harga Jual (IDR)",
      "Modal Rata-rata (IDR)",
      "Total Nilai Modal (IDR)",
    ];
    rows = report.data.items.map((item) => [
      item.sku,
      item.name,
      item.category,
      item.unit,
      item.shelfLocation || "-",
      item.supplier || "-",
      item.currentStock,
      item.minStock,
      item.stockStatus === "out_of_stock" ? "HABIS" : "MENIPIS",
      item.deficit,
      item.sellingPrice,
      item.averagePurchaseCost || "-",
      item.inventoryCostValue,
    ]);
  }

  // Guard: max 10,000 rows
  if (rows.length > 10000) {
    return productFailure("LIMIT_EXCEEDED");
  }

  const content = buildCsv(headers, rows);
  const sizeBytes = Buffer.byteLength(content, "utf8");
  // Guard: max 5 MiB (5 * 1024 * 1024 bytes)
  if (sizeBytes > 5 * 1024 * 1024) {
    return productFailure("LIMIT_EXCEEDED");
  }

  return {
    ok: true,
    data: {
      filename,
      content,
      mimeType: "text/csv;charset=utf-8",
      rowCount: rows.length,
    },
  };
}

export { getTextSuggestions, authorizeProducts };
