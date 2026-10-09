import dynamic from "next/dynamic";
import { getMockAuthState } from "@/features/auth/mock-auth";
import {
  DashboardHeader,
  OverviewCards,
  InventoryHealth,
  NeedAttentionTable,
  MOCK_OVERVIEW_METRICS,
} from "@/features/dashboard";

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
  description: "Ringkasan manajemen stok dan ikhtisar inventaris.",
};

export default async function DashboardPage() {
  const { user } = await getMockAuthState();

  return (
    <div className="flex flex-col gap-4 sm:gap-5 w-full">
      {/* 1. Header with integrated Quick Actions */}
      <DashboardHeader userName={user?.name} />

      {/* 2. Overview Metrics Cards (4 cards) */}
      <OverviewCards metrics={MOCK_OVERVIEW_METRICS} />

      {/* 3. Main Analytics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12 items-stretch">
        {/* Col 1: Stock Movement (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <StockMovementChart />
        </div>

        {/* Col 2: Inventory Health & Need Attention (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-5">
          <InventoryHealth />
          <NeedAttentionTable />
        </div>
      </div>
    </div>
  );
}
