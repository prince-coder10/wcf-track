const DATA = [
  { day: "Mon", value: 6 },
  { day: "Tue", value: 10 },
  { day: "Wed", value: 4 },
  { day: "Thu", value: 13 },
  { day: "Fri", value: 8 },
  { day: "Sat", value: 7 },
  { day: "Sun", value: 2 },
];

const MAX = Math.max(...DATA.map((d) => d.value));
const CHART_PX = 96; // fixed bar area height in px

export default function BarChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <h2 className="font-semibold text-gray-900 text-sm mb-4">
        Evangelized per day
      </h2>

      {/* Bar area — fixed pixel height so bars resolve correctly */}
      <div
        className="flex items-end gap-1.5"
        style={{ height: CHART_PX }}
      >
        {DATA.map(({ day, value }) => {
          const barH = Math.max(4, Math.round((value / MAX) * CHART_PX));
          return (
            <div key={day} className="flex-1 flex flex-col items-center justify-end">
              <div
                className="w-full rounded-t-sm bg-gray-800 transition-all duration-500"
                style={{ height: barH }}
              />
            </div>
          );
        })}
      </div>

      {/* Values + day labels below bars */}
      <div className="flex gap-1.5 mt-1">
        {DATA.map(({ day, value }) => (
          <div key={day} className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-gray-500 font-medium">{value}</span>
            <span className="text-[10px] text-gray-400">{day}</span>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-gray-300 mt-3">Sample data for layout only.</p>
    </div>
  );
}
