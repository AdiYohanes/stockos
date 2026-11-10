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
import { buildCsv, csvText } from "./csv";
import { getReportDates } from "./dates";
import { getShopSettings } from "@/features/settings/server";

export async function getValuationReport(input: unknown = { mode: "screen" }, writable = false): Promise<ProductReadResult<ValuationReportDto>> {
  return productRead("stockos_get_valuation_report", ValuationReportInputSchema, ValuationReportDtoSchema, input, writable);
}

export async function getMovementReport(input: unknown, writable = false): Promise<ProductReadResult<MovementReportDto>> {
  return productRead("stockos_get_movement_report", MovementReportInputSchema, MovementReportDtoSchema, input, writable);
}

export async function getLowStockReport(input: unknown = { mode: "screen" }, writable = false): Promise<ProductReadResult<LowStockReportDto>> {
  return productRead("stockos_get_low_stock_report", LowStockReportInputSchema, LowStockReportDtoSchema, input, writable);
}

export async function exportReport(input: unknown, writable = false): Promise<ProductReadResult<ExportReportResult>> {
  const parsed = ExportReportInputSchema.safeParse(input);
  if (!parsed.success) {
    return productFailure("VALIDATION_ERROR");
  }

  const { kind, search, category, startDate, endDate, expectedTimezone, timeframe } = parsed.data;
  const dateStr = new Date().toISOString().slice(0, 10);
  let filename = `stockos-report-${kind}-${dateStr}.csv`;
  let headers: string[] = [];
  let rows: Iterable<unknown[]> = [];
  let rowCount = 0;

  if (kind === "valuation") {
    const report = await getValuationReport({ search, category, mode: "export" }, writable);
    if (!report.ok) return report;
    if (report.data.mode !== "export") return productFailure("INTERNAL_ERROR");
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
    rowCount = report.data.categories.length;
    const categories = report.data.categories;
    rows = (function* () { for (const c of categories) yield [
      csvText(c.categoryName),
      c.itemCount,
      c.stockQty,
      c.totalCost,
      c.totalRetailValue,
      c.grossMargin,
      `${c.marginPercent}%`,
      `${c.ratioPercent}%`,
    ]; })();
  } else if (kind === "movements") {
    if (!startDate || !endDate) return productFailure("VALIDATION_ERROR");
    let report = await getMovementReport({ startDate, endDate, category, search, expectedTimezone, mode: "export" }, writable);
    if (!report.ok && report.code === "VERSION_CONFLICT" && timeframe) {
      const settings = await getShopSettings({}, writable);
      if (!settings.ok) return settings;
      report = await getMovementReport({ ...getReportDates(timeframe, settings.data.timezone), category, search, mode: "export" }, writable);
    }
    if (!report.ok) return report;
    if (report.data.mode !== "export") return productFailure("INTERNAL_ERROR");
    filename = `stockos-movements-${report.data.summary.startDate}-to-${report.data.summary.endDate}.csv`;
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
      "Zona Waktu Toko",
      "Tanggal Mulai (inklusif)",
      "Tanggal Akhir (eksklusif)",
    ];
    rowCount = report.data.items.length;
    const { items, summary } = report.data;
    rows = (function* () { for (const m of items) yield [
      csvText(m.sku),
      csvText(m.name),
      csvText(m.category),
      m.openingQty,
      m.stockInQty,
      m.stockOutQty,
      m.opnameDelta,
      m.opnameCount,
      m.costAdjustmentCount,
      m.currentStock,
      m.lastMovementDate || "-",
      csvText(summary.timezone),
      summary.startDate,
      summary.endDate,
    ]; })();
  } else if (kind === "low_stock") {
    const report = await getLowStockReport({ search, category, mode: "export" }, writable);
    if (!report.ok) return report;
    if (report.data.mode !== "export") return productFailure("INTERNAL_ERROR");
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
    rowCount = report.data.items.length;
    const items = report.data.items;
    rows = (function* () { for (const item of items) yield [
      csvText(item.sku),
      csvText(item.name),
      csvText(item.category),
      csvText(item.unit),
      csvText(item.shelfLocation || "-"),
      csvText(item.supplier || "-"),
      item.currentStock,
      item.minStock,
      item.stockStatus === "out_of_stock" ? "HABIS" : "MENIPIS",
      item.deficit,
      item.sellingPrice,
      item.averagePurchaseCost || "-",
      item.inventoryCostValue,
    ]; })();
  }

  let content: string;
  try { content = buildCsv(headers, rows); }
  catch (error) { return productFailure(error instanceof Error && error.message === "LIMIT_EXCEEDED" ? "LIMIT_EXCEEDED" : "INTERNAL_ERROR"); }

  return {
    ok: true,
    data: {
      filename,
      content,
      mimeType: "text/csv;charset=utf-8",
      rowCount,
    },
  };
}

export { getTextSuggestions, authorizeProducts };
