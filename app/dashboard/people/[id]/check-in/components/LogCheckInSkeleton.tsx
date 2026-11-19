export default function LogCheckInSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-9 w-32 bg-slate-200 rounded-full" />
      <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
        <div className="h-14 w-full bg-slate-100 rounded-2xl" />
        <div className="h-4 w-32 bg-slate-200 rounded" />
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-slate-200 rounded-full" />
          <div className="h-10 w-20 bg-slate-200 rounded-full" />
          <div className="h-10 w-20 bg-slate-200 rounded-full" />
        </div>
        <div className="h-24 w-full bg-slate-100 rounded-2xl" />
      </div>
    </div>
  );
}
