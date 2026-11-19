export default function AbsenteesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-slate-200 rounded-lg" />
          <div className="h-4 w-72 bg-slate-100 rounded" />
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-xl" />
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="h-9 flex-1 min-w-[220px] bg-slate-100 rounded-xl" />
        <div className="h-9 w-36 bg-slate-100 rounded-xl" />
        <div className="h-9 w-32 bg-slate-100 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3">
            <div className="h-6 w-3/4 bg-slate-200 rounded" />
            <div className="h-4 w-1/2 bg-slate-100 rounded" />
            <div className="h-10 bg-slate-100 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
