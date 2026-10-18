
import { useQuery } from "@tanstack/react-query";
import {
  getShipmentStatusHistory,
  type ShipmentStatusHistoryItem,
} from "../services/analyticsService";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ShipmentStatusHistory() {
  const {
    data: history = [],
    isLoading,
    isError,
    error,
  } = useQuery<ShipmentStatusHistoryItem[], Error>({
    queryKey: ["analytics", "status-history"],
    queryFn: () => getShipmentStatusHistory(100),
    refetchInterval: 60_000,
  });

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-100">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            Shipment Status History
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Recent shipment status changes
          </p>
        </div>

        <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
          {history.length} records
        </span>
      </div>

      {isLoading && (
        <p className="py-6 text-sm text-slate-400">
          Loading shipment history...
        </p>
      )}

      {isError && (
        <p className="py-6 text-sm text-red-400">
          Could not load history: {error.message}
        </p>
      )}

      {!isLoading && !isError && history.length === 0 && (
        <p className="py-6 text-sm text-slate-400">
          No status history found yet. Change a shipment's status to create
          a history record.
        </p>
      )}

      {!isLoading && !isError && history.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-slate-700 text-slate-400">
              <tr>
                <th className="px-3 py-3 font-medium">Shipment</th>
                <th className="px-3 py-3 font-medium">Previous Status</th>
                <th className="px-3 py-3 font-medium">New Status</th>
                <th className="px-3 py-3 font-medium">Changed At</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/60">
                  <td className="px-3 py-3 font-medium">
                    #{item.shipment_id}
                  </td>
                  <td className="px-3 py-3 text-slate-300">
                    {item.old_status ?? "—"}
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-amber-500/10 px-2 py-1 text-amber-300">
                      {item.new_status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-400">
                    {formatDate(item.changed_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-3 text-xs text-slate-500">
            Showing up to 100 recent records. Refreshes every minute.
          </p>
        </div>
      )}
    </section>
  );
}
