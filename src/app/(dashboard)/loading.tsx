export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-4 sm:gap-5 w-full pb-10 animate-pulse">
      {/* Top Header Placeholder */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-[3px] border-ink bg-white p-4 sm:p-5 shadow-hard-sm">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-ink/20" />
          <div className="h-3 w-72 bg-ink/10" />
        </div>
        <div className="h-9 w-32 bg-ink/15 border-[3px] border-ink" />
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-between h-24 p-4 border-[3px] border-ink bg-white shadow-hard-sm"
          >
            <div className="h-3 w-20 bg-ink/15" />
            <div className="h-6 w-16 bg-ink/25" />
          </div>
        ))}
      </div>

      {/* Main Ledger / Chart Block */}
      <div className="h-[420px] w-full border-[3px] border-ink bg-white p-5 shadow-hard-md flex flex-col justify-between">
        <div className="h-6 w-56 bg-ink/20" />
        <div className="h-[300px] w-full bg-ink/5" />
        <div className="h-4 w-40 bg-ink/15" />
      </div>
    </div>
  );
}
