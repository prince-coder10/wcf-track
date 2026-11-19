export default function UsersSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 bg-gray-200 rounded-md"></div>
        <div className="h-4 w-80 bg-gray-200/70 rounded-md"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column skeleton */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs space-y-3">
            <div className="h-10 bg-gray-100 rounded-lg"></div>
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-gray-100 rounded-full"></div>
              <div className="h-6 w-20 bg-gray-100 rounded-full"></div>
              <div className="h-6 w-20 bg-gray-100 rounded-full"></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100"></div>
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-32 bg-gray-100 rounded"></div>
                    <div className="h-2.5 w-20 bg-gray-100/70 rounded"></div>
                  </div>
                </div>
                <div className="h-6 w-20 bg-gray-100 rounded-full"></div>
                <div className="h-6 w-16 bg-gray-100 rounded-full"></div>
                <div className="h-6 w-24 bg-gray-100 rounded-md"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column form skeleton */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <div className="h-5 w-32 bg-gray-200 rounded"></div>
          <div className="h-3.5 w-48 bg-gray-100 rounded"></div>
          <div className="space-y-3 pt-2">
            <div className="h-10 bg-gray-100 rounded-lg"></div>
            <div className="h-10 bg-gray-100 rounded-lg"></div>
            <div className="h-10 bg-gray-100 rounded-lg"></div>
            <div className="h-10 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
