import { useMemo, useState } from "react";

import {

  useMutation,

  useQuery,

  useQueryClient,

} from "@tanstack/react-query";

import axios from "axios";

import ProofOfDeliveryPhoto from '../components/ProofOfDeliveryPhoto';

import { AddShipmentModal } from "../components/AddShipmentModal";

import DeleteShipmentModal from "../components/DeleteShipmentModal";

import {

  deleteShipment,

  getShipments,

} from "@/features/shipments/services/shipmentService";

import type { Shipment } from "@/features/shipments/types/shipment";

import { useShipmentStore } from "@/store/shipmentStore";

import { Link } from "react-router-dom";

const SHIPMENT_QUERY_KEY = ["shipments"] as const;

type StatusGroup = "In transit" | "Delivered" | "Pending" | "Other";

const STATUS_COLORS: Record<StatusGroup, string> = {

  "In transit": "#fbbf24",

  Delivered: "#34d399",

  Pending: "#fb923c",

  Other: "#a78bfa",

};

function getErrorMessage(error: unknown): string {

  if (axios.isAxiosError(error)) {

    const detail: unknown = error.response?.data?.detail;

    if (typeof detail === "string" && detail.trim()) return detail;

    if (Array.isArray(detail)) {

      const messages = detail

        .map((item: unknown) => {

          if (

            typeof item === "object" &&

item !== null &&

            "msg" in item &&

            typeof item.msg === "string"

          ) {

            return item.msg;

          }

          return null;

        })

        .filter((message): message is string => Boolean(message));

      if (messages.length) return messages.join(" ");

    }

    if (!error.response) {

      return "Unable to reach the server. Check your connection and try again.";

    }

    if (error.response.status >= 500) {

      return "The server encountered an error. Please try again later.";

    }

    return error.message || "The request could not be completed.";

  }

  return error instanceof Error && error.message.trim()

    ? error.message

    : "Something went wrong. Please try again.";

}

function formatMoney(value: unknown): string {

  const amount = Number(value);

  if (!Number.isFinite(amount)) return "—";

  return new Intl.NumberFormat("en-US", {

    style: "currency",

    currency: "USD",

    minimumFractionDigits: 2,

    maximumFractionDigits: 2,

  }).format(amount);

}

function formatNumber(value: unknown, maximumFractionDigits = 2): string {

  const number = Number(value);

  if (!Number.isFinite(number)) return "—";

  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(number);

}

function getStatusGroup(status: unknown): StatusGroup {

  const normalized = String(status ?? "").trim().toLowerCase();

  if (normalized.includes("transit") || normalized.includes("shipping")) {

    return "In transit";

  }

  if (normalized.includes("deliver") || normalized.includes("complete")) {

    return "Delivered";

  }

  if (normalized.includes("pending") || normalized.includes("created")) {

    return "Pending";

  }

  return "Other";

}

export function ShipmentLandingPage() {


  const [proofShipment, setProofShipment] =

  useState<Shipment | null>(null);

  const queryClient = useQueryClient();

  const selectedShipmentId = useShipmentStore(

    (state) => state.selectedShipmentId,

  );

  const isDetailsModalOpen = useShipmentStore(

    (state) => state.isDetailsModalOpen,

  );

  const selectShipment = useShipmentStore((state) => state.selectShipment);

  const closeDetailsModal = useShipmentStore(

    (state) => state.closeDetailsModal,

  );

  const openCreateModal = useShipmentStore((state) => state.openCreateModal);

  const viewMode = useShipmentStore((state) => state.viewMode);

  const toggleViewMode = useShipmentStore((state) => state.toggleViewMode);

  const searchTerm = useShipmentStore((state) => state.searchTerm);

  const statusFilter = useShipmentStore((state) => state.statusFilter);

  const setSearchTerm = useShipmentStore((state) => state.setSearchTerm);

  const setStatusFilter = useShipmentStore((state) => state.setStatusFilter);

  const resetFilters = useShipmentStore((state) => state.resetFilters);

  const {

    data: shipments,

    isPending,

    isFetching,

    isError,

    error,

refetch,

  } = useQuery({

    queryKey: SHIPMENT_QUERY_KEY,

queryFn: () => getShipments(),

    retry: 1,

    staleTime: 30_000,

    refetchOnWindowFocus: true,

  });

  const [shipmentToDelete, setShipmentToDelete] = useState<Shipment | null>(null);

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const allShipments = shipments ?? [];

  const totalShipments = allShipments.length;

  const selectedShipment = useMemo(

    () =>

      allShipments.find(

        (shipment) => String(shipment.id) === selectedShipmentId,

      ) ?? null,

    [allShipments, selectedShipmentId],

  );

  const normalizedSearch = searchTerm.trim().toLocaleLowerCase();

  const filteredShipments = useMemo(

    () =>

      allShipments.filter((shipment) => {

        const content = String(shipment.content ?? "").toLocaleLowerCase();

        const destination = String(shipment.destination ?? "").toLocaleLowerCase();

        const matchesSearch =

          !normalizedSearch ||

          content.includes(normalizedSearch) ||

          destination.includes(normalizedSearch) ||

          String(shipment.id).includes(normalizedSearch);

        const matchesStatus =

          statusFilter === "all" ||

          String(shipment.status ?? "").toLocaleLowerCase() ===

            statusFilter.toLocaleLowerCase();

        return matchesSearch && matchesStatus;

      }),

    [allShipments, normalizedSearch, statusFilter],

  );

  const statusBreakdown = useMemo(() => {

    const groups: StatusGroup[] = ["In transit", "Delivered", "Pending", "Other"];

    return groups.map((name) => ({

      name,

      count: allShipments.filter(

        (shipment) => getStatusGroup(shipment.status) === name,

      ).length,

      color: STATUS_COLORS[name],

    }));

  }, [allShipments]);

  const totalCost = allShipments.reduce((total, shipment) => {

    const cost = Number(shipment.cost);

    return total + (Number.isFinite(cost) ? cost : 0);

  }, 0);

  const inTransit = statusBreakdown.find((item) => item.name === "In transit")?.count ?? 0;

  const delivered = statusBreakdown.find((item) => item.name === "Delivered")?.count ?? 0;

  const deliveryRate = totalShipments > 0 ? Math.round((delivered / totalShipments) * 100) : 0;

  const hasActiveFilters = searchTerm.trim().length > 0 || statusFilter !== "all";

  const deleteMutation = useMutation({

mutationFn: (id: number) => deleteShipment(id),

    retry: 0,

onMutate: () => setDeleteError(null),

onSuccess: async () => {

      await queryClient.invalidateQueries({ queryKey: SHIPMENT_QUERY_KEY });

      setShipmentToDelete(null);

      setDeleteError(null);

    },

onError: (mutationError: unknown) => {

      setDeleteError(getErrorMessage(mutationError));

    },

  });

  const handleDelete = (

event: React.MouseEvent<HTMLButtonElement>,

shipment: Shipment,

  ) => {

event.stopPropagation();

    setDeleteError(null);

    setShipmentToDelete(shipment);

  };

  const openShipment = (shipment: Shipment) => {

    selectShipment(String(shipment.id));

  };

  return (

    <main className="shipment-experience relative min-h-screen overflow-x-hidden bg-[#08090c] text-white selection:bg-amber-300 selection:text-black">

      <style>{`

        @keyframes rise-in {

          from { opacity: 0; transform: translateY(22px); }

          to { opacity: 1; transform: translateY(0); }

        }

        @keyframes ambient-drift {

          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }

          50% { transform: translate3d(2%, -3%, 0) scale(1.08); }

        }

        @keyframes scan {

          from { transform: translateX(-120%); }

          to { transform: translateX(220%); }

        }

        .rise-in { animation: rise-in .8s cubic-bezier(.2,.75,.25,1) both; }

        .rise-delay-1 { animation-delay: .1s; }

        .rise-delay-2 { animation-delay: .2s; }

        .rise-delay-3 { animation-delay: .3s; }

        .ambient-orb { animation: ambient-drift 14s ease-in-out infinite; }

        .glass-panel {

          background: linear-gradient(135deg, rgba(255,255,255,.065), rgba(255,255,255,.018));

          border: 1px solid rgba(255,255,255,.095);

          box-shadow: 0 24px 80px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,.045);

          backdrop-filter: blur(22px);

        }

        .hover-lift { transition: transform .35s cubic-bezier(.2,.75,.25,1), border-color .35s, background .35s, box-shadow .35s; }

        .hover-lift:hover { transform: translateY(-5px); border-color: rgba(251,191,36,.35); box-shadow: 0 24px 70px rgba(0,0,0,.34), 0 0 38px rgba(251,191,36,.055); }

        .chart-bar { transform-origin: left center; transition: transform .35s, filter .35s; }

        .chart-row:hover .chart-bar { transform: scaleX(1.025); filter: brightness(1.2); }

        .no-scrollbar::-webkit-scrollbar { display: none; }

        .no-scrollbar { scrollbar-width: none; }

        @media (prefers-reduced-motion: reduce) {

          .rise-in, .ambient-orb { animation: none !important; }

          .hover-lift, .chart-bar { transition: none !important; }

          html { scroll-behavior: auto !important; }

        }

        html { scroll-behavior: smooth; }

      `}</style>

      {/* Ambient lighting and fine grid */}

      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[920px] overflow-hidden">

        <div className="ambient-orb absolute left-[8%] top-[-220px] h-[600px] w-[600px] rounded-full bg-amber-500/[0.11] blur-[150px]" />

        <div className="ambient-orb absolute right-[-10%] top-[100px] h-[560px] w-[560px] rounded-full bg-orange-500/[0.08] blur-[150px]" />

        <div className="absolute inset-0 opacity-[0.045]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)", backgroundSize: "72px 72px", maskImage: "linear-gradient(to bottom, black, transparent 85%)" }} />

      </div>

      <div id="top" className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">

        {/* Network list */}

        <section id="network" className="scroll-mt-24 pb-24 sm:pb-32">

        <header className="analytics-page-header mt-6 mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-amber-200/80">
                COMMAND CENTER / SHIPMENT OPERATIONS
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-white sm:text-5xl">
                Shipments
              </h1>

              <p className="mt-3 text-sm text-white/45 sm:text-base">
                Search, track, and manage every shipment.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleViewMode}
                className="rounded-full border border-white/12 px-4 py-2.5 text-xs text-white/70 transition hover:border-amber-200/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                View as {viewMode === "table" ? "cards" : "table"}
              </button>

              <button
                type="button"
                onClick={() => void refetch()}
                disabled={isFetching}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2.5 text-xs text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                <svg
                  viewBox="0 0 24 24"
                  className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="M20 7v5h-5M4 17v-5h5" />
                  <path d="M5.5 9a7 7 0 0 1 11.8-2L20 12M4 12l2.7 5a7 7 0 0 0 11.8-2" />
                </svg>
                Refresh
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="rounded-full bg-amber-300 px-5 py-2.5 text-xs font-semibold text-[#111318] transition hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                + New Shipment
              </button>
            </div>
          </header>

          <div className="glass-panel overflow-hidden rounded-[26px]">

            <div className="flex flex-col gap-4 border-b border-white/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">

              <div>

                <h3 className="text-sm font-semibold">Shipment directory</h3>

                <p className="mt-1 text-xs text-white/35">{filteredShipments.length} shown · {totalShipments} total</p>

              </div>

              <div className="flex flex-col gap-2 sm:flex-row">

                <label className="sr-only" htmlFor="shipment-search">Search shipments</label>

                <input id="shipment-search" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search ID, shipment or destination…" autoComplete="off" className="h-10 min-w-0 rounded-full border border-white/10 bg-black/25 px-4 text-sm text-white outline-none placeholder:text-white/25 transition focus:border-amber-200/50 focus:ring-2 focus:ring-amber-200/10 sm:w-72" />

                <label className="sr-only" htmlFor="shipment-status-filter">Filter by status</label>

                <select id="shipment-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-full border border-white/10 bg-[#111318] px-4 text-sm text-white/70 outline-none transition focus:border-amber-200/50 focus:ring-2 focus:ring-amber-200/10">

                  <option value="all">All statuses</option>

                  <option value="created">Created</option>

                  <option value="updated">Updated</option>

                  <option value="in transit">In transit</option>

                  <option value="delivered">Delivered</option>

                </select>

                {hasActiveFilters && <button type="button" onClick={resetFilters} className="h-10 rounded-full border border-white/10 px-4 text-xs text-white/60 transition hover:border-white/25 hover:text-white">Clear filters</button>}

              </div>

            </div>

            {isPending && <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-white/45" role="status"><span className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-amber-300" />Loading your network…</div>}

            {isError && (

              <div className="m-5 rounded-2xl border border-red-300/20 bg-red-400/[0.05] p-6" role="alert">

                <p className="font-semibold text-red-200">We couldn't load your shipments.</p>

                <p className="mt-2 text-sm text-red-100/60">{getErrorMessage(error)}</p>

                <button type="button" onClick={() => void refetch()} disabled={isFetching} className="mt-4 rounded-full border border-red-200/25 px-4 py-2 text-xs text-red-100 transition hover:bg-red-300/10 disabled:opacity-50">Try again</button>

              </div>

            )}

            {!isPending && !isError && totalShipments === 0 && (

              <div className="flex min-h-72 flex-col items-center justify-center px-6 py-14 text-center">

                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-200/[0.05] text-amber-200">

                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3.5 7.8 12 12l8.5-4.2M12 12v8.5" /></svg>

                </div>

                <h3 className="text-xl font-semibold">Your network starts here.</h3>

                <p className="mt-3 max-w-md text-sm leading-6 text-white/45">Create your first shipment to see live metrics, status distribution, and cost insights appear here.</p>

                <button type="button" onClick={openCreateModal} className="mt-6 rounded-full bg-amber-200 px-6 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-amber-100">Create first shipment <span aria-hidden="true" className="ml-2">↗</span></button>

              </div>

            )}

            {!isPending && !isError && totalShipments > 0 && filteredShipments.length === 0 && (

              <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">

                <h3 className="text-lg font-semibold">Nothing matches those filters.</h3>

                <p className="mt-2 text-sm text-white/40">Try a different search or reset the current filters.</p>

                <button type="button" onClick={resetFilters} className="mt-4 rounded-full border border-white/15 px-4 py-2 text-xs text-white/70 hover:border-amber-200/40">Reset filters</button>

              </div>

            )}

            {!isPending && !isError && filteredShipments.length > 0 && (

              viewMode === "card" ? (

                <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">

                  {filteredShipments.map((shipment, index) => (

                    <article key={shipment.id} role="button" tabIndex={0} onClick={() => openShipment(shipment)} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); openShipment(shipment); } }} className="hover-lift cursor-pointer rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <p className="font-mono text-[10px] tracking-[.16em] text-amber-200/70">SHIP-{String(shipment.id).padStart(4, "0")}</p>

                          <h4 className="mt-3 truncate text-base font-semibold text-white/90">{shipment.content || `Shipment ${shipment.id}`}</h4>

                          <p className="mt-1 truncate text-sm text-white/40">{shipment.destination || "Destination not specified"}</p>

                        </div>

                        <StatusBadge status={String(shipment.status ?? "Unknown")} />

                      </div>

                      <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-4">

                        <div><p className="text-[9px] uppercase tracking-[.15em] text-white/30">Weight</p><p className="mt-1 text-sm text-white/75">{formatNumber(shipment.weight)}<span className="ml-1 text-[10px] text-white/30">kg</span></p></div>

                        <div><p className="text-[9px] uppercase tracking-[.15em] text-white/30">Distance</p><p className="mt-1 text-sm text-white/75">{formatNumber(shipment.distance)}<span className="ml-1 text-[10px] text-white/30">km</span></p></div>

                        <div><p className="text-[9px] uppercase tracking-[.15em] text-white/30">Cost</p><p className="mt-1 truncate text-sm text-amber-100">{formatMoney(shipment.cost)}</p></div>

                      </div>

                      <div className="mt-5 flex items-center justify-between">

                        <span className="text-[10px] text-white/25">Record {index + 1} of {filteredShipments.length}</span>

                        <span className="text-xs text-white/40 transition group-hover:text-white">Open details ↗</span>

                      </div>

                      <div className="mt-4 flex justify-end gap-2">

                        <button

type="button"

onClick={(event) => {

event.stopPropagation();

                            setProofShipment(shipment);

                          }}

aria-label={`Add proof of delivery for shipment ${shipment.id}`}

className="min-h-11 rounded-full border border-amber-200/25 px-3 py-2 text-xs text-amber-100 hover:bg-amber-200/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"

                        >

                          📷 Proof of Delivery

                        </button>

                        <button type="button" onClick={(event) => handleDelete(event, shipment)} disabled={deleteMutation.isPending} aria-label={`Delete shipment ${shipment.content}`} className="rounded-full border border-red-200/15 px-3 py-1.5 text-[10px] text-red-100/65 transition hover:border-red-200/35 hover:bg-red-300/[0.06] hover:text-red-100 disabled:opacity-40">Delete</button>

                      </div>

                    </article>

                  ))}

                </div>

              ) : (

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[820px]">

                    <caption className="sr-only">Shipment records. Select a row to edit a shipment.</caption>

                    <thead className="border-b border-white/[0.07] bg-white/[0.025]">

                      <tr>

                        {["Shipment", "Destination", "Status", "Weight", "Distance", "Cost", "Actions"].map((label, index) => <th key={label} scope="col" className={`px-5 py-4 text-[9px] font-semibold uppercase tracking-[.18em] text-white/35 ${index >= 3 && index <= 5 ? "text-right" : "text-left"}`}>{label}</th>)}

                      </tr>

                    </thead>

                    <tbody>

                      {filteredShipments.map((shipment) => (

                        <tr key={shipment.id} tabIndex={0} onClick={() => openShipment(shipment)} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); openShipment(shipment); } }} className="group cursor-pointer border-b border-white/[0.055] transition hover:bg-amber-200/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-300">

                          <td className="px-5 py-4"><p className="font-mono text-[10px] text-amber-200/70">#{String(shipment.id).padStart(4, "0")}</p><p className="mt-1 max-w-[220px] truncate text-sm font-medium text-white/85">{shipment.content}</p></td>

                          <td className="px-5 py-4 text-sm text-white/50">{shipment.destination}</td>

                          <td className="px-5 py-4"><StatusBadge status={String(shipment.status ?? "Unknown")} /></td>

                          <td className="px-5 py-4 text-right font-mono text-xs text-white/55">{formatNumber(shipment.weight)}</td>

                          <td className="px-5 py-4 text-right font-mono text-xs text-white/55">{formatNumber(shipment.distance)}</td>

                          <td className="px-5 py-4 text-right font-mono text-sm text-amber-100/85">{formatMoney(shipment.cost)}</td>

                          <td className="px-5 py-4">

                            <div className="flex flex-wrap items-center justify-end gap-2">

                              <button

type="button"

onClick={(event) => {

event.stopPropagation();

                                  setProofShipment(shipment);

                                }}

aria-label={`Add proof of delivery for shipment ${shipment.id}`}

className="min-h-11 rounded-full border border-amber-200/25 px-3 py-2 text-xs text-amber-100 hover:bg-amber-200/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"

                              >

                                📷 Proof of Delivery

                              </button>

                              <button

type="button"

onClick={(event) => handleDelete(event, shipment)}

disabled={deleteMutation.isPending}

aria-label={`Delete shipment ${shipment.content}`}

className="min-h-11 rounded-full border border-white/10 px-3 py-2 text-xs text-white/60 hover:border-red-200/30 hover:text-red-100"

                              >

                                Delete

                              </button>

                            </div>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )

            )}

          </div>

        </section>

        {/* Editorial footer */}

        <footer className="flex flex-col gap-4 border-t border-white/[0.08] py-8 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between">

          <a href="#top" className="font-semibold tracking-[.15em] text-white/60 transition hover:text-amber-200">AETHER / SHIP <span className="ml-2 font-normal tracking-normal text-white/25">Back to top ↑</span></a>

          <p>Designed for clarity. Built for movement.</p>

          <p>{isFetching ? "Syncing shipment data…" : "Shipment data synced from your API"}</p>

        </footer>

      </div>

      {proofShipment && (

        <div

className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"

onClick={() => setProofShipment(null)}

        >

          <div

role="dialog"

aria-modal="true"

aria-labelledby="proof-title"

className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#15171b] p-5 text-white shadow-2xl"

onClick={(event) => event.stopPropagation()}

          >

            <div className="mb-4 flex items-center justify-between gap-3">

              <h2 id="proof-title" className="text-lg font-semibold">

                Proof of Delivery — #{proofShipment.id}

              </h2>

              <button

type="button"

aria-label="Close proof of delivery"

onClick={() => setProofShipment(null)}

className="min-h-11 min-w-11 rounded-full hover:bg-white/10"

              >

                ✕

              </button>

            </div>

            <p className="mb-4 text-sm text-white/60">

              {proofShipment.content} · {proofShipment.destination}

            </p>

            <ProofOfDeliveryPhoto />

          </div>

        </div>

      )}

      {isDetailsModalOpen && (

        <AddShipmentModal shipment={selectedShipment} onClose={closeDetailsModal} />

      )}

      {shipmentToDelete && (

        <>

          {deleteError && (

            <div role="alert" aria-live="assertive" className="fixed bottom-5 right-5 z-[60] max-w-sm rounded-2xl border border-red-200/20 bg-[#15171b] p-4 text-sm text-red-100 shadow-2xl">

              <div className="flex items-start justify-between gap-3"><p>{deleteError}</p><button type="button" aria-label="Dismiss delete error" onClick={() => setDeleteError(null)} className="rounded px-1 text-red-100/70 hover:text-white">×</button></div>

            </div>

          )}

          <DeleteShipmentModal

shipment={shipmentToDelete}

isDeleting={deleteMutation.isPending}

onCancel={() => {

              if (deleteMutation.isPending) return;

              setShipmentToDelete(null);

              setDeleteError(null);

            }}

onConfirm={() => {

              if (!deleteMutation.isPending) deleteMutation.mutate(shipmentToDelete.id);

            }}

          />

        </>

      )}

    </main>

  );

}

function MetricCard({

label,

value,

sublabel,

icon,

accent,

}: {

  label: string;

  value: string;

  sublabel: string;

  icon: "box" | "route" | "check" | "activity";

  accent: "amber" | "orange" | "green" | "violet";

}) {

  const accents = {

    amber: { text: "text-amber-200", border: "group-hover:border-amber-200/30", glow: "bg-amber-300" },

    orange: { text: "text-orange-200", border: "group-hover:border-orange-200/30", glow: "bg-orange-300" },

    green: { text: "text-emerald-200", border: "group-hover:border-emerald-200/30", glow: "bg-emerald-300" },

    violet: { text: "text-violet-200", border: "group-hover:border-violet-200/30", glow: "bg-violet-300" },

  };

  const current = accents[accent];

  const paths: Record<typeof icon, string> = {

    box: "M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z M3.5 7.8 12 12l8.5-4.2M12 12v8.5",

    route: "M5 19c-2 0-2-4 0-4s2 4 0 4ZM19 9c-2 0-2-4 0-4s2 4 0 4ZM7 16c5 0 2-9 10-9",

    check: "m5 12 4 4L19 6",

    activity: "M3 12h4l3-8 4 16 3-8h4",

  };

  return (

    <div className={`glass-panel hover-lift group relative overflow-hidden rounded-2xl p-5 sm:p-6 ${current.border}`}>

      <div aria-hidden="true" className={`absolute -right-8 -top-8 h-28 w-28 rounded-full ${current.glow} opacity-[0.06] blur-2xl transition group-hover:opacity-[0.13]`} />

      <div className="flex items-center justify-between">

        <p className="text-[10px] font-semibold uppercase tracking-[.19em] text-white/40">{label}</p>

        <span className={`flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] ${current.text}`}>

          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d={paths[icon]} strokeLinecap="round" strokeLinejoin="round" /></svg>

        </span>

      </div>

      <p className="mt-6 break-words text-3xl font-semibold tracking-[-.045em] text-white sm:text-4xl">{value}</p>

      <p className="mt-2 text-xs text-white/35">{sublabel}</p>

      <div aria-hidden="true" className={`absolute bottom-0 left-0 h-px w-0 ${current.glow} transition-all duration-500 group-hover:w-full`} />

    </div>

  );

}

function StatusBadge({ status }: { status: string }) {

  const group = getStatusGroup(status);

  const styles: Record<StatusGroup, string> = {

    "In transit": "border-amber-200/20 bg-amber-200/[0.07] text-amber-100",

    Delivered: "border-emerald-200/20 bg-emerald-200/[0.07] text-emerald-100",

    Pending: "border-orange-200/20 bg-orange-200/[0.07] text-orange-100",

    Other: "border-violet-200/20 bg-violet-200/[0.07] text-violet-100",

  };

  return (

    <span className={`inline-flex max-w-full items-center gap-2 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[9px] font-medium ${styles[group]}`}>

      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />

      {status}

    </span>

  );

}