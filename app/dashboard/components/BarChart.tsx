import { DayBarData } from "@/services/dashboard.service";

const CHART_PX = 96; // fixed bar area height in px

export default function BarChart({ data }: { data: DayBarData[] }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <h2 className="font-semibold text-gray-900 text-sm mb-4">
        Evangelized per day (This Week)
      </h2>

      {/* Bar area — fixed pixel height so bars resolve correctly */}
      <div
        className="flex items-end gap-1.5"
        style={{ height: CHART_PX }}
      >
        {data.map(({ day, value }) => {
          const barH = value === 0 ? 2 : Math.max(4, Math.round((value / maxVal) * CHART_PX));
          return (
            <div key={day} className="flex-1 flex flex-col items-center justify-end">
              <div
                className={`w-full rounded-t-sm transition-all duration-500 ${
                  value > 0 ? "bg-gray-800" : "bg-gray-100"
                }`}
                style={{ height: barH }}
              />
            </div>
          );
        })}
      </div>

      {/* Values + day labels below bars */}
      <div className="flex gap-1.5 mt-1">
        {data.map(({ day, value }) => (
          <div key={day} className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-gray-500 font-medium">{value}</span>
            <span className="text-[10px] text-gray-400">{day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
