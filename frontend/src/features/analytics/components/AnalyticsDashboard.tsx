import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getStatusBreakdown,
  getDestinationBreakdown,
  getShipmentCosts,
} from "../services/analyticsService";
import { ShipmentStatusHistory } from "./ShipmentStatusHistory";
import ShipmentActivityChart from "./ShipmentActivityChart";

const COLORS = ["#F59E0B", "#38BDF8", "#34D399", "#A78BFA", "#FB7185", "#94A3B8"];
const numberFormat = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const formatNumber = (value: number) => numberFormat.format(value);

function ChartPanel({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 rounded-2xl border border-white/10 bg-zinc-900/70 p-4 shadow-lg sm:p-5 ${className}`}>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-zinc-400">{description}</p>
      <div className="mt-4 h-64 w-full sm:h-72">{children}</div>
    </section>
  );
}

const tooltipStyle = {
  background: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: 12,
  color: "#fff",
};

export default function AnalyticsDashboard() {
  const statuses = useQuery({
    queryKey: ["analytics", "status-breakdown"],
    queryFn: getStatusBreakdown,
    refetchInterval: 60_000,
  });
  const destinations = useQuery({
    queryKey: ["analytics", "destinations"],
    queryFn: getDestinationBreakdown,
    refetchInterval: 60_000,
  });
  const costs = useQuery({
    queryKey: ["analytics", "costs"],
    queryFn: getShipmentCosts,
    refetchInterval: 60_000,
  });

  const queries = [statuses, destinations, costs];
  const isLoading = queries.some((query) => query.isLoading);
  const hasError = queries.some((query) => query.isError);

  if (isLoading) {
    return (
      <section id="analytics" className="scroll-mt-24 space-y-4">
        <SectionHeading />
        <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-6 text-sm text-zinc-300" role="status">
          Loading analytics…
        </div>
      </section>
    );
  }

  if (hasError || !statuses.data || !destinations.data || !costs.data) {
    return (
      <section id="analytics" className="scroll-mt-24 space-y-4">
        <SectionHeading />
        <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5 text-red-200">
          <p className="font-semibold">Analytics could not be loaded.</p>
          <p className="mt-2 text-sm text-red-200/80">Check that the analytics endpoints are available and that the backend allows your frontend origin.</p>
          <button
            type="button"
            onClick={() => void Promise.all(queries.map((query) => query.refetch()))}
            className="mt-4 rounded-lg border border-red-300/30 px-4 py-2 text-sm transition hover:bg-red-400/10"
          >
            Retry
          </button>
        </div>
        <ShipmentStatusHistory />
        <ShipmentActivityChart />
      </section>
    );
  }

  const topDestinations = [...destinations.data]
    .sort((a, b) => b.shipment_count - a.shipment_count)
    .slice(0, 8)
    .map((item) => ({
      ...item,
      destination: item.destination.length > 16 ? `${item.destination.slice(0, 16)}…` : item.destination,
    }));

  const topCosts = [...costs.data]
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 8)
    .map((item) => ({ ...item, shipment: `#${item.id}` }));

  return (
    <section id="analytics" className="scroll-mt-24 space-y-5 pb-20 sm:pb-24">
      <SectionHeading />

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <ChartPanel title="Shipment status" description="Current records grouped by their stored status.">
          {statuses.data.length === 0 ? (
            <EmptyChartMessage message="Status data will appear when shipments are available." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statuses.data} dataKey="count" nameKey="status" cx="50%" cy="48%" innerRadius={58} outerRadius={88} paddingAngle={3} stroke="none">
                  {statuses.data.map((item, index) => <Cell key={item.status} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [value, String(name)]} contentStyle={tooltipStyle} />
                <Legend formatter={(value) => <span className="text-xs text-zinc-300">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel title="Top destinations" description="Destinations with the highest shipment volume.">
          {topDestinations.length === 0 ? (
            <EmptyChartMessage message="Destination data will appear when shipments are available." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDestinations} margin={{ top: 8, right: 8, left: -18, bottom: 24 }}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="destination" tick={{ fill: "#a1a1aa", fontSize: 11 }} angle={-20} textAnchor="end" interval={0} />
                <YAxis allowDecimals={false} tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="shipment_count" name="Shipments" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel title="Highest-cost shipments" description="Compare the eight highest recorded shipment costs." className="xl:col-span-2">
          {topCosts.length === 0 ? (
            <EmptyChartMessage message="Cost data will appear when shipments have numeric costs." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCosts} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="shipment" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} tickFormatter={(value) => formatNumber(Number(value))} />
                <Tooltip formatter={(value) => [formatNumber(Number(value)), "Cost"]} labelFormatter={(label) => `Shipment ${label}`} contentStyle={tooltipStyle} />
                <Bar dataKey="cost" name="Cost" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <ShipmentActivityChart />
        <ShipmentStatusHistory />
      </div>
      <p className="text-xs leading-5 text-zinc-500">Costs use the same currency units stored in your database. Activity and status history reflect recorded timestamps and events; older events are not inferred.</p>
    </section>
  );
}

function SectionHeading() {
  return (
    <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[.25em] text-amber-300">Operational intelligence</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Analytics and trends</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Explore shipment mix, destination volume, costs, activity, and recorded status changes.</p>
      </div>
      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-300">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Refreshes every 60 seconds
      </span>
    </div>
  );
}

function EmptyChartMessage({ message }: { message: string }) {
  return <div className="grid h-full place-items-center text-center text-sm text-zinc-500">{message}</div>;
}
