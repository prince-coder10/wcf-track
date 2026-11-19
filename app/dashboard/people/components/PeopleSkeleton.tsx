export default function PeopleSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-4 w-56 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
        </div>
        <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>

      {/* Filter skeleton */}
      <div className="space-y-3">
        <div className="h-11 w-full bg-slate-200 dark:bg-slate-800 rounded-full" />
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
          <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
          <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>
      </div>

      {/* Table skeleton for desktop */}
      <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
            <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800/60 rounded" />
            <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800/60 rounded" />
            <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <div className="h-4 w-12 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Card skeleton for mobile */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
            <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800/60 rounded" />
              <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
