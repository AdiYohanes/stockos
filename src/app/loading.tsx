import { StockLoader } from "@/components/shared/stock-loader";

export default function RootLoading() {
  return (
    <div className="grid-dots flex min-h-screen w-full items-center justify-center bg-background p-6">
      <StockLoader />
    </div>
  );
}
