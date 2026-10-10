import { Suspense } from "react";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { getOwnerSession } from "@/features/auth/server";
import { getDashboard } from "@/features/dashboard/server";
import { listProducts } from "@/features/products/server";
import {
  DashboardHeader,
  OverviewCards,
  InventoryHealth,
  NeedAttentionTable,
  type OverviewMetric,
  type InventoryHealthData,
  type AttentionItem,
} from "@/features/dashboard";
import { formatCurrency, formatNumber } from "@/lib/format";

const StockMovementChart = dynamic(
  () =>
    import("@/features/dashboard/components/stock-movement-chart").then(
      (mod) => mod.StockMovementChart
    ),
  {
    loading: () => (
      <div className="flex h-[380px] w-full flex-col justify-between border-[3px] border-ink bg-white p-5 shadow-hard-sm animate-pulse">
        <div className="h-6 w-40 bg-ink/20"></div>
        <div className="h-[260px] w-full bg-ink/10"></div>
        <div className="h-4 w-56 bg-ink/20"></div>
      </div>
    ),
  }
);

export const metadata = {
  title: "Dashboard | StockOS",
  description: "Ringkasan manajemen stok dan ikhtisar inventaris warung.",
};

export default async function DashboardPage() {
  const user = await getOwnerSession();
  if (!user) redirect("/login");

  const [dashboardResult, productsResult] = await Promise.all([
    getDashboard(),
    listProducts({ pageSize: 100 }),
  ]);

  if (!dashboardResult.ok) {
    if (dashboardResult.code === "UNAUTHENTICATED" || dashboardResult.code === "FORBIDDEN") {
      redirect("/login");
    }
    throw new Error(dashboardResult.message || "Gagal memuat data dashboard.");
  }

  const { metrics, health, attentionItems, movements } = dashboardResult.data;
  const rawProducts = productsResult.ok ? productsResult.data.items : [];

  const overviewMetrics: OverviewMetric[] = [
    {
      id: "products",
      label: "Total Produk",
      value: formatNumber(metrics.totalProducts),
      rawValue: metrics.totalProducts,
      supportingText: `${metrics.inStockCount} stok aman`,
      iconName: "products",
      variant: "default",
    },
    {
      id: "potential_revenue",
      label: "Potensi Pendapatan",
      value: formatCurrency(Number(metrics.potentialSellingValue)),
      rawValue: Number(metrics.potentialSellingValue),
      supportingText: "Nilai jual stok tersedia",
      iconName: "revenue",
      variant: "default",
    },
    {
      id: "potential_profit",
      label: "Potensi Laba Kotor",
      value: formatCurrency(Number(metrics.potentialGrossProfit)),
      rawValue: Number(metrics.potentialGrossProfit),
      supportingText: "Estimasi laba kotor sebelum operasional",
      iconName: "net_profit",
      variant: Number(metrics.potentialGrossProfit) < 0 ? "destructive" : "default",
    },
    {
      id: "out_of_stock",
      label: "Stok Habis",
      value: formatNumber(metrics.outOfStockCount),
      rawValue: metrics.outOfStockCount,
      supportingText: metrics.outOfStockCount > 0 ? "Perlu restok segera" : "Semua produk memiliki stok",
      iconName: "out_of_stock",
      variant: metrics.outOfStockCount > 0 ? "destructive" : "default",
    },
  ];

  const inventoryHealthData: InventoryHealthData = {
    totalProducts: health.totalProducts,
    healthScore: health.healthScore,
    healthy: {
      count: health.healthy.count,
      percentage: health.healthy.percentage,
      value: Number(health.healthy.value),
    },
    lowStock: {
      count: health.lowStock.count,
      percentage: health.lowStock.percentage,
      value: Number(health.lowStock.value),
    },
    outOfStock: {
      count: health.outOfStock.count,
      percentage: health.outOfStock.percentage,
      value: Number(health.outOfStock.value),
    },
  };

  const attentionList: AttentionItem[] = attentionItems.map((item) => ({
    id: item.id,
    sku: item.sku,
    name: item.name,
    category: item.category,
    currentStock: item.currentStock,
    minStock: item.minStock,
    unit: item.unit,
    status: item.status,
    lastRestocked: item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString("id-ID") : "-",
  }));

  return (
    <div className="flex flex-col gap-4 sm:gap-5 w-full">
      {/* 1. Header with integrated Quick Actions */}
      <DashboardHeader userName={user?.name} rawProducts={rawProducts} />

      {/* 2. Overview Metrics Cards (4 cards) */}
      <OverviewCards metrics={overviewMetrics} />

      {/* 3. Main Analytics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12 items-stretch">
        {/* Col 1: Stock Movement (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <Suspense
            fallback={
              <div className="flex h-[380px] w-full flex-col justify-between border-[3px] border-ink bg-white p-5 shadow-hard-sm animate-pulse">
                <div className="h-6 w-40 bg-ink/20" />
                <div className="h-[260px] w-full bg-ink/10" />
                <div className="h-4 w-56 bg-ink/20" />
              </div>
            }
          >
            <StockMovementChart movements={movements} />
          </Suspense>
        </div>

        {/* Col 2: Inventory Health & Need Attention (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-5">
          <InventoryHealth data={inventoryHealthData} />
          <NeedAttentionTable items={attentionList} />
        </div>
      </div>
    </div>
  );
}
