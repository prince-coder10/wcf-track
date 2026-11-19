export default function ActivityLogSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-44 bg-slate-200 rounded-lg" />
          <div className="h-4 w-60 bg-slate-100 rounded" />
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-xl" />
      </div>

      {/* Filter toolbar skeleton */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="h-9 flex-1 min-w-[220px] bg-slate-100 rounded-xl" />
        <div className="h-9 w-36 bg-slate-100 rounded-xl" />
        <div className="h-9 w-32 bg-slate-100 rounded-xl" />
        <div className="h-9 w-52 bg-slate-100 rounded-xl" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-4">
        <div className="h-10 bg-slate-100 rounded-xl" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-50 border border-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
