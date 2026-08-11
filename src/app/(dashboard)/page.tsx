import { getMockAuthState } from "@/features/auth/mock-auth";
import {
  DashboardHeader,
  OverviewCards,
  StockMovementChart,
  InventoryHealth,
  NeedAttentionTable,
  TopMovingProducts,
  MOCK_OVERVIEW_METRICS,
} from "@/features/dashboard";

export const metadata = {
  title: "Dashboard | StockOS",
  description: "Stock management and inventory overview.",
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
