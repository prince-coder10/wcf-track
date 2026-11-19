export default function PersonDetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-9 w-24 bg-slate-200 rounded-full" />
      <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-6 w-40 bg-slate-200 rounded-lg" />
          <div className="h-6 w-20 bg-slate-200 rounded-full" />
        </div>
        <div className="h-4 w-48 bg-slate-100 rounded" />
        <div className="h-12 w-full bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="h-11 bg-slate-100 rounded-2xl" />
          <div className="h-11 bg-slate-100 rounded-2xl" />
        </div>
      </div>
      <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-3">
        <div className="h-5 w-36 bg-slate-200 rounded" />
        <div className="h-4 w-full bg-slate-100 rounded" />
        <div className="h-4 w-3/4 bg-slate-100 rounded" />
      </div>
    </div>
  );
}
