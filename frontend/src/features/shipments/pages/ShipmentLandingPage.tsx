import { useState } from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { AddShipmentModal } from "../components/AddShipmentModal";
import DeleteShipmentModal from "../components/DeleteShipmentModal";

import {
  deleteShipment,
  getShipments,
} from "@/features/shipments/services/shipmentService";

import type { Shipment } from "@/features/shipments/types/shipment";

import { useShipmentStore } from "@/store/shipmentStore";

export function ShipmentLandingPage() {
  const queryClient = useQueryClient();

  /*
   * Zustand owns UI state:
   * - selected shipment ID
   * - add/edit modal open state
   */
  const selectedShipmentId = useShipmentStore(
    (state) => state.selectedShipmentId,
  );

  const isDetailsModalOpen = useShipmentStore(
    (state) => state.isDetailsModalOpen,
  );

  const selectShipment = useShipmentStore(
    (state) => state.selectShipment,
  );

  const closeDetailsModal = useShipmentStore(
    (state) => state.closeDetailsModal,
  );

  const openCreateModal = useShipmentStore(
    (state) => state.openCreateModal,
  );

  const viewMode = useShipmentStore(
    (state) => state.viewMode
  );
  
  const toggleViewMode = useShipmentStore(
    (state) => state.toggleViewMode
  );

  const logCurrentView = useShipmentStore(
    (state) => state.logCurrentView
  );

  const searchTerm = useShipmentStore(
    (state) => state.searchTerm,
  );
  
  const statusFilter = useShipmentStore(
    (state) => state.statusFilter,
  );
  
  const setSearchTerm = useShipmentStore(
    (state) => state.setSearchTerm,
  );
  
  const setStatusFilter = useShipmentStore(
    (state) => state.setStatusFilter,
  );
  
  const resetFilters = useShipmentStore(
    (state) => state.resetFilters,
  );

  /*
   * React Query owns server state.
   */
  const {
    data: shipments,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["shipments"],
    queryFn: getShipments,
  });

  /*
   * Derive the selected shipment from:
   * 1. selectedShipmentId from Zustand
   * 2. shipments from React Query
   *
   * We don't store the whole shipment object in Zustand.
   */
  const selectedShipment =
    shipments?.find(
      (shipment) => String(shipment.id) === selectedShipmentId,
    ) ?? null;

  const filteredShipments =
    shipments?.filter((shipment) => {
      const matchesSearch =
        shipment.content
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        shipment.destination
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
  
      const matchesStatus =
        statusFilter === "all" ||
        shipment.status.toLowerCase() ===
          statusFilter.toLowerCase();
  
      return matchesSearch && matchesStatus;
    }) ?? [];
  /*
   * DELETE
   */
  const [shipmentToDelete, setShipmentToDelete] =
    useState<Shipment | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteShipment(id),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["shipments"],
      });

      setShipmentToDelete(null);
    },
  });

  /*
   * OPEN DELETE CONFIRMATION
   */
  const handleDelete = (
    event: React.MouseEvent,
    shipment: Shipment,
  ) => {
    event.stopPropagation();
    setShipmentToDelete(shipment);
  };

  const totalShipments = shipments?.length ?? 0;

  const inTransit =
    shipments?.filter(
      (shipment) =>
        shipment.status.toLowerCase() === "in transit",
    ).length ?? 0;

  const delivered =
    shipments?.filter(
      (shipment) =>
        shipment.status.toLowerCase() === "delivered",
    ).length ?? 0;

  const totalCost =
    shipments?.reduce(
      (total, shipment) => total + Number(shipment.cost),
      0,
    ) ?? 0;

  return (
    <main className="h-screen overflow-hidden bg-[#120b07] text-[#f5e9dc]">
      {/* ====================================================== */}
      {/* AMBIENT BACKGROUND */}
      {/* ====================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-amber-500/10 blur-[150px]" />

        <div className="absolute right-0 top-1/2 h-[500px] w-[500px] rounded-full bg-orange-600/10 blur-[150px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(#a16207 1px, transparent 1px), linear-gradient(90deg, #a16207 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ====================================================== */}
      {/* MAIN CONTENT */}
      {/* ====================================================== */}

      <div className="relative mx-auto flex h-full max-w-[1600px] flex-col px-5 py-5 sm:px-8 lg:px-10">
        {/* ================================================== */}
        {/* HERO HEADER */}
        {/* ================================================== */}

        <header className="flex shrink-0 items-center justify-between gap-6 border-b border-white/[0.06] pb-5">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400 shadow-[0_0_12px_rgba(192,132,79,0.6)]" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400">
                Shipment Intelligence Platform
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[#f5e9dc] sm:text-4xl">
              Move smarter.
              <span className="ml-2 bg-gradient-to-r from-[#d4a574] via-[#b87945] to-[#8b5a2b] bg-clip-text text-transparent">
                Track everything.
              </span>
            </h1>

            <p className="mt-2 text-sm text-[#9a8878]">
              Monitor, manage and track your shipment network
              in real time.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="shrink-0 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.15)] transition hover:bg-amber-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.25)]"
          >
            <span className="mr-2 text-lg">+</span>
            New Shipment
          </button>
        </header>

        {/* ================================================== */}
        {/* SHIPMENT AREA */}
        {/* ================================================== */}

        <section className="flex min-h-0 flex-1 flex-col pt-5">
          {/* Section header */}

          <div className="mb-4 flex shrink-0 items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#f5e9dc]">
                Shipment Operations
              </h2>

              <p className="mt-1 text-xs text-[#9a8878]">
                Live shipment activity and status
              </p>
            </div>
            <button
              type="button"
              onClick={toggleViewMode}
              className="rounded-xl border border-[#4f3421] bg-[#21140c]/80 px-5 py-3 text-sm font-semibold text-[#a99482] shadow-sm transition-all hover:border-[#8b5a2b] hover:bg-[#2a1a10] hover:text-[#dfcdbb]"
            >
              Switch to {viewMode === "table" ? "Card" : "Table"} View
            </button>
            <div className="flex items-center gap-2 text-xs text-[#9a8878]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              System operational
            </div>
          </div>

          {/* ================================================== */}
          {/* STATS */}
          {/* ================================================== */}

          <section className="mb-4 grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard
              label="Total Shipments"
              value={totalShipments}
              detail="Across network"
              accent="amber"
            />

            <StatCard
              label="In Transit"
              value={inTransit}
              detail="Currently moving"
              accent="orange"
            />

            <StatCard
              label="Delivered"
              value={delivered}
              detail="Successfully completed"
              accent="emerald"
            />

            <StatCard
              label="Total Cost"
              value={`$${totalCost.toFixed(2)}`}
              detail="Shipment value"
              accent="violet"
            />
          </section>

          {/* ================================================== */}
          {/* SHIPMENT TABLE PANEL */}
          {/* ================================================== */}

          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#4f3421] bg-[#21140c]/90 shadow-2xl shadow-black/30 backdrop-blur-xl">
            {/* Panel header */}

            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-5 py-4">
            {/* Left */}
            <div>
              <h3 className="text-sm font-semibold text-[#f5e9dc]">
                Shipment Network
              </h3>

              <p className="mt-1 text-xs text-[#9a8878]">
                Click a shipment to edit
              </p>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search shipments..."
                className="h-10 w-56 rounded-xl border border-[#4f3421] bg-[#1a1009] px-4 text-sm text-[#f5e9dc] outline-none placeholder:text-[#6f5c4c] transition focus:border-[#8b5a2b]"
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 w-36 cursor-pointer appearance-none rounded-xl border border-[#4f3421] bg-[#1a1009] px-4 text-sm text-[#d4b89d] outline-none transition focus:border-[#8b5a2b]"
              >
                <option value="all">All Status</option>
                <option value="created">Created</option>
                <option value="updated">Updated</option>
              </select>

              {(searchTerm || statusFilter !== "all") && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="h-10 rounded-xl border border-[#4f3421] bg-[#21140c] px-4 text-sm font-medium text-[#a99482] transition hover:border-[#8b5a2b] hover:text-[#f5e9dc]"
                >
                  Reset
                </button>
              )}

              <span className="ml-1 whitespace-nowrap text-xs text-[#6f5c4c]">
                {totalShipments} records
              </span>
            </div>
          </div>

            {/* Loading */}

            {isPending && (
              <div className="flex min-h-0 flex-1 items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-[#a99482]">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-amber-400" />
                  Loading shipment network...
                </div>
              </div>
            )}

            {/* Error */}

            {isError && (
              <div className="m-5 rounded-xl border border-amber-400/20 bg-amber-500/5 p-5">
                <p className="text-sm font-semibold text-amber-400">
                  Network error
                </p>

                <p className="mt-1 text-sm text-amber-300/70">
                  {error.message}
                </p>
              </div>
            )}

            {/* Empty */}

            {shipments && shipments.length === 0 && (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/5">
                  <span className="text-2xl text-amber-400">
                    +
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-[#f5e9dc]">
                  No shipments detected
                </h3>

                <p className="mt-2 max-w-sm text-sm text-[#9a8878]">
                  Your shipment network is currently empty.
                  Create your first shipment to begin tracking
                  operations.
                </p>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-5 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
                >
                  Create Shipment
                </button>
              </div>
            )}

            {/* ================================================= */}
            {/* TABLE */}
            {/* ================================================= */}

            {filteredShipments.length > 0 && (
              <div className="min-h-0 flex-1 overflow-auto">
                <table className="min-w-full">
                  <thead className="sticky top-0 z-10 bg-[#1a1009]/95 backdrop-blur-xl">
                    <tr className="border-b border-white/[0.06]">
                      <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a8878]">
                        ID
                      </th>

                      <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a8878]">
                        Shipment
                      </th>

                      <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a8878]">
                        Destination
                      </th>

                      <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a8878]">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a8878]">
                        Weight
                      </th>

                      <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a8878]">
                        Distance
                      </th>

                      <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a8878]">
                        Cost
                      </th>

                      <th className="w-14 px-4 py-3">
                        <span className="sr-only">
                          Actions
                        </span>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredShipments.map((shipment) => (
                      <tr
                        key={shipment.id}
                        onClick={() => {
                          selectShipment(String(shipment.id));
                        }}
                        className="group cursor-pointer border-b border-[#352218] transition-colors hover:bg-[#8b5a2b]/[0.08]"
                      >
                        {/* ID */}

                        <td className="px-5 py-4">
                          <span className="font-mono text-xs text-amber-400">
                            #
                            {String(shipment.id).padStart(
                              4,
                              "0",
                            )}
                          </span>
                        </td>

                        {/* Shipment */}

                        <td className="px-5 py-4">
                          <div className="max-w-xs">
                            <p className="truncate text-sm font-medium text-[#dfcdbb] transition group-hover:text-[#f5e9dc]">
                              {shipment.content}
                            </p>

                            <p className="mt-1 text-xs text-slate-600">
                              Shipment record
                            </p>
                          </div>
                        </td>

                        {/* Destination */}

                        <td className="px-5 py-4 text-sm text-[#a99482]">
                          {shipment.destination}
                        </td>

                        {/* Status */}

                        <td className="px-5 py-4">
                          <StatusBadge
                            status={shipment.status}
                          />
                        </td>

                        {/* Weight */}

                        <td className="px-5 py-4 text-right font-mono text-xs text-[#a99482]">
                          {shipment.weight}
                        </td>

                        {/* Distance */}

                        <td className="px-5 py-4 text-right font-mono text-xs text-[#a99482]">
                          {shipment.distance}
                        </td>

                        {/* Cost */}

                        <td className="px-5 py-4 text-right font-mono text-sm font-semibold text-[#dfcdbb]">
                          $
                          {Number(shipment.cost).toFixed(
                            2,
                          )}
                        </td>

                        {/* Delete */}

                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={(event) =>
                              handleDelete(
                                event,
                                shipment,
                              )
                            }
                            disabled={
                              deleteMutation.isPending
                            }
                            className="invisible flex h-8 w-8 items-center justify-center rounded-lg text-[#9a8878] opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 hover:bg-amber-500/10 hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Delete shipment"
                          >
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 6h18"
                              />

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8 6V4h8v2"
                              />

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 6l-1 14H6L5 6"
                              />

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M10 11v5M14 11v5"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </div>

      {/* ====================================================== */}
      {/* ADD / EDIT MODAL */}
      {/* ====================================================== */}

      {isDetailsModalOpen && (
        <AddShipmentModal
          shipment={selectedShipment}
          onClose={closeDetailsModal}
        />
      )}

      {/* ====================================================== */}
      {/* DELETE MODAL */}
      {/* ====================================================== */}

      {shipmentToDelete && (
        <DeleteShipmentModal
          shipment={shipmentToDelete}
          isDeleting={deleteMutation.isPending}
          onCancel={() => {
            setShipmentToDelete(null);
          }}
          onConfirm={() => {
            deleteMutation.mutate(
              shipmentToDelete.id,
            );
          }}
        />
      )}
    </main>
  );
}

/* ============================================================ */
/* STAT CARD */
/* ============================================================ */

function StatCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string | number;
  detail: string;
  accent: "amber" | "orange" | "emerald" | "violet";
}) {
  const accentStyles = {
    amber: "bg-amber-400 shadow-amber-400/50",
    orange: "bg-orange-400 shadow-orange-400/50",
    emerald: "bg-emerald-400 shadow-emerald-400/50",
    violet: "bg-violet-400 shadow-violet-400/50",
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-[#4f3421] bg-[#21140c]/90 p-4 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.14]">
      <div
        className={`absolute left-0 top-0 h-px w-14 shadow-[0_0_12px] ${accentStyles[accent]}`}
      />

      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9a8878]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold tracking-tight text-[#f5e9dc]">
        {value}
      </p>

      <p className="mt-1 text-[11px] text-slate-600">
        {detail}
      </p>
    </div>
  );
}

/* ============================================================ */
/* STATUS BADGE */
/* ============================================================ */

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  let styles =
    "border-slate-400/20 bg-slate-400/5 text-[#a99482]";

  if (normalized.includes("transit")) {
    styles =
      "border-orange-400/20 bg-orange-400/10 text-orange-300";
  } else if (normalized.includes("deliver")) {
    styles =
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  } else if (normalized.includes("pending")) {
    styles =
      "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium ${styles}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}