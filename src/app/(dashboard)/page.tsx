import dynamic from "next/dynamic";
import { getMockAuthState } from "@/features/auth/mock-auth";
import {
  DashboardHeader,
  OverviewCards,
  InventoryHealth,
  NeedAttentionTable,
  TopMovingProducts,
  MOCK_OVERVIEW_METRICS,
} from "@/features/dashboard";

const StockMovementChart = dynamic(
  () =>
    import("@/features/dashboard/components/stock-movement-chart").then(
      (mod) => mod.StockMovementChart
    ),
  {
    loading: () => (
      <div className="flex h-[380px] w-full flex-col justify-between rounded-lg border border-border bg-card p-5 shadow-sm animate-pulse">
        <div className="h-6 w-40 rounded bg-muted"></div>
        <div className="h-[260px] w-full rounded bg-muted/40"></div>
        <div className="h-4 w-56 rounded bg-muted/60"></div>
      </div>
    ),
  }
);

export const metadata = {
  title: "Dashboard | StockOS",
  description: "Ringkasan manajemen stok dan ikhtisar inventaris.",
};

export default async function DashboardPage() {
  const { user } = await getMockAuthState();

  return (
    <div className="flex flex-col gap-4 sm:gap-5 max-w-[1600px] mx-auto">
      {/* 1. Header with integrated Quick Actions */}
      <DashboardHeader userName={user?.name} />

      {/* 2. Overview Metrics Cards (4 cards) */}
      <OverviewCards metrics={MOCK_OVERVIEW_METRICS} />

      {/* 3. Main Analytics 3-Column Desktop Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12 items-stretch">
        {/* Col 1: Stock Movement (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <StockMovementChart />
        </div>

        {/* Col 2: Need Attention (4 cols) */}
        <div className="lg:col-span-4 flex flex-col">
          <NeedAttentionTable />
        </div>

        {/* Col 3: Inventory Health & Top Moving Products (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4 sm:gap-5">
          <InventoryHealth />
          <TopMovingProducts />
        </div>
      </div>
    </div>
  );
}
