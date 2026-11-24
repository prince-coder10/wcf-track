export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Header Skeleton */}
      <div className="mb-5 space-y-2">
        <div className="h-8 w-40 bg-gray-200 rounded-lg"></div>
        <div className="h-4 w-28 bg-gray-100 rounded-md"></div>
      </div>

      {/* Stats Toggle & Grid Skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-32 bg-gray-200 rounded-full"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
              <div className="h-3 w-16 bg-gray-200 rounded"></div>
              <div className="h-8 w-12 bg-gray-300 rounded"></div>
              <div className="h-3 w-20 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Queue + Overdue Skeleton */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
            <div className="h-3 w-48 bg-gray-100 rounded"></div>
            <div className="space-y-2 pt-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-10 bg-gray-50 rounded-lg"></div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bar Chart Skeleton */}
      <div className="mt-4 bg-white rounded-xl border border-gray-100 p-4 space-y-4">
        <div className="h-4 w-40 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-50 rounded-lg"></div>
      </div>
    </div>
  );
}
