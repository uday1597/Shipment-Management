
import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getShipmentsOverTime } from "../services/analyticsService";

export default function ShipmentActivityChart() {
  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["analytics", "shipments-over-time", 30],
    queryFn: () => getShipmentsOverTime(30),
    refetchInterval: 60_000,
  });

  const chartData = data.map((item) => ({
    ...item,
    date: new Date(`${item.date}T12:00:00`).toLocaleDateString(
      "en-IN",
      { day: "2-digit", month: "short" }
    ),
  }));

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-100">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">
          Shipment Activity
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Shipments created per day over the last 30 days
        </p>
      </div>

      {isLoading && (
        <p className="py-10 text-center text-slate-400">
          Loading activity...
        </p>
      )}

      {isError && (
        <p className="py-10 text-center text-red-400">
          Could not load shipment activity.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                minTickGap={25}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  color: "#f1f5f9",
                }}
              />
              <Line
                type="monotone"
                dataKey="shipment_count"
                name="Shipments"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
