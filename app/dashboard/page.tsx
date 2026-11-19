import StatsGrid from "./components/StatsGrid";
import UnassignedQueue from "./components/UnassignedQueue";
import OverdueList from "./components/OverdueList";
import BarChart from "./components/BarChart";

// auth + instant=false lives in layout.tsx — this page is clean
export default function DashboardPage() {
  const weekLabel = "Week of 10 Nov";

  return (
    <main className="flex-1 px-4 pt-6 pb-24 md:pb-8 md:px-7 max-w-5xl w-full mx-auto">
      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">{weekLabel}</p>
      </div>

      {/* Stats with period toggle */}
      <StatsGrid />

      {/* Queue + Overdue — stack on mobile, side-by-side on md+ */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <UnassignedQueue />
        <OverdueList />
      </div>

      {/* Bar chart */}
      <div className="mt-4">
        <BarChart />
      </div>
    </main>
  );
}
