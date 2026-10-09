export default function RootLoading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-paper p-6">
      <div className="flex flex-col items-center gap-4 border-[3px] border-ink bg-white p-8 shadow-hard-lg max-w-sm w-full animate-pulse">
        <div className="h-10 w-10 border-[3px] border-ink bg-acid shadow-hard-sm" />
        <div className="h-4 w-40 bg-ink/20" />
        <div className="h-2 w-28 bg-ink/10" />
      </div>
    </div>
  );
}
