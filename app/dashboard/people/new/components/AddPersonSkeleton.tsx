export default function AddPersonSkeleton() {
  return (
    <div className="max-w-xl mx-auto space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-7 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="h-4 w-60 bg-slate-100 dark:bg-slate-800/60 rounded" />
      </div>

      {/* Inputs skeleton */}
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="flex gap-2">
            <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
