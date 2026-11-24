import { connection } from "next/server";
import StatsGrid from "./StatsGrid";
import UnassignedQueue from "./UnassignedQueue";
import OverdueList from "./OverdueList";
import BarChart from "./BarChart";
import { getDashboardData } from "@/services/dashboard.service";

export default async function DashboardDataLoader() {
  await connection();
  const data = await getDashboardData();

  const now = new Date();
  const weekLabel = `Week of ${now.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })}`;

  return (
    <>
      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">{weekLabel}</p>
      </div>

      {/* Stats with period toggle */}
      <StatsGrid stats={data.stats} />

      {/* Queue + Overdue — stack on mobile, side-by-side on md+ */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <UnassignedQueue queue={data.queue} />
        <OverdueList overdueList={data.overdueList} />
      </div>

      {/* Bar chart */}
      <div className="mt-4">
        <BarChart data={data.chartData} />
      </div>
    </>
  );
}
