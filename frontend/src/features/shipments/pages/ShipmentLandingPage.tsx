import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";

import { AddShipmentModal } from "../components/AddShipmentModal";
import DeleteShipmentModal from "../components/DeleteShipmentModal";

import {
  deleteShipment,
  getShipments,
} from "@/features/shipments/services/shipmentService";
import type { Shipment } from "@/features/shipments/types/shipment";
import { useShipmentStore } from "@/store/shipmentStore";

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
  const [activeInsight, setActiveInsight] = useState<"status" | "cost">("status");

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

  const topCostShipments = useMemo(
    () =>
      [...allShipments]
        .map((shipment) => ({
          shipment,
          cost: Number(shipment.cost),
        }))
        .filter((item) => Number.isFinite(item.cost))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 6),
    [allShipments],
  );

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

      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#08090c]/75 backdrop-blur-2xl">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href="#top" className="group flex items-center gap-3" aria-label="Aether Shipments home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-300/30 bg-amber-300/[0.08] text-amber-300 transition group-hover:bg-amber-300/15">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" />
                <path d="M3.5 7.8 12 12l8.5-4.2M12 12v8.5M7.5 5.3l9 4.5" />
              </svg>
            </span>
            <span className="text-sm font-semibold tracking-[.12em] text-white">AETHER<span className="ml-1 text-amber-300">/</span>SHIP</span>
          </a>
          <div className="hidden items-center gap-8 text-xs text-white/55 md:flex">
            <a className="transition hover:text-white" href="#overview">Overview</a>
            <a className="transition hover:text-white" href="#insights">Insights</a>
            <a className="transition hover:text-white" href="#network">Network</a>
          </div>
          <button type="button" onClick={openCreateModal} className="group inline-flex items-center gap-2 rounded-full border border-amber-300/35 bg-amber-300 px-4 py-2.5 text-xs font-bold text-[#15110a] transition hover:-translate-y-0.5 hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090c] sm:px-5">
            <span className="text-base leading-none">+</span> New shipment
          </button>
        </div>
      </nav>

      <div id="top" className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        {/* Hero */}
        <section id="overview" className="grid min-h-[610px] items-center gap-12 py-16 md:grid-cols-[1.05fr_.95fr] md:py-24 lg:min-h-[700px]">
          <div className="rise-in relative z-10">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.06] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[.2em] text-emerald-200/90">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
              </span>
              Live operations overview
            </div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[.3em] text-amber-200/80">Logistics, reimagined</p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[.98] tracking-[-.065em] sm:text-6xl lg:text-8xl">
              Every move.
              <span className="mt-2 block bg-gradient-to-r from-[#fff3d4] via-[#f4c879] to-[#c98736] bg-clip-text pb-2 text-transparent">In perfect</span>
              <span className="block text-white/90">perspective.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-white/50 sm:text-lg sm:leading-8">
              A clearer view of your shipment network. Follow movement, understand costs, and make your next decision with confidence.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a href="#insights" className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#111318] transition hover:-translate-y-0.5 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                Explore the data <span aria-hidden="true" className="text-lg">↓</span>
              </a>
              <button type="button" onClick={openCreateModal} className="rounded-full border border-white/15 px-6 py-3.5 text-sm font-medium text-white/75 transition hover:border-white/35 hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
                Create a shipment
              </button>
            </div>
            <div className="mt-12 flex items-center gap-4 text-xs text-white/35">
              <span className="h-px w-10 bg-amber-300/50" />
              <span>One network. A thousand moving parts.</span>
            </div>
          </div>

          {/* Futuristic orbital illustration built in SVG */}
          <div className="rise-in rise-delay-2 relative mx-auto flex w-full max-w-[570px] items-center justify-center py-8 md:py-0">
            <div aria-hidden="true" className="absolute h-[72%] w-[72%] rounded-full bg-amber-400/[0.08] blur-[70px]" />
            <div className="relative aspect-square w-full">
              <svg viewBox="0 0 600 600" className="h-full w-full overflow-visible" role="img" aria-label="Abstract orbital visualization representing a connected shipment network">
                <defs>
                  <radialGradient id="coreGlow">
                    <stop offset="0%" stopColor="#fde68a" stopOpacity=".9" />
                    <stop offset="45%" stopColor="#f59e0b" stopOpacity=".28" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="orbitStroke" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fcd34d" stopOpacity=".8" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity=".08" />
                  </linearGradient>
                  <filter id="softGlow"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>
                <circle cx="300" cy="300" r="190" fill="url(#coreGlow)" />
                <circle cx="300" cy="300" r="214" fill="none" stroke="#fff" strokeOpacity=".09" strokeDasharray="2 9" />
                <ellipse cx="300" cy="300" rx="230" ry="112" fill="none" stroke="url(#orbitStroke)" strokeWidth="1.2" transform="rotate(-38 300 300)" />
                <ellipse cx="300" cy="300" rx="230" ry="112" fill="none" stroke="#fcd34d" strokeOpacity=".28" strokeWidth="1" transform="rotate(48 300 300)" />
                <ellipse cx="300" cy="300" rx="160" ry="245" fill="none" stroke="#fff" strokeOpacity=".13" transform="rotate(18 300 300)" />
                <circle cx="300" cy="300" r="120" fill="none" stroke="#fbbf24" strokeOpacity=".16" />
                <circle cx="300" cy="300" r="88" fill="#f59e0b" fillOpacity=".035" stroke="#fcd34d" strokeOpacity=".25" />
                <circle cx="300" cy="300" r="61" fill="url(#coreGlow)" filter="url(#softGlow)" />
                <path d="M276 283 300 270l24 13v30l-24 13-24-13z" fill="#fcd34d" fillOpacity=".12" stroke="#fcd34d" strokeWidth="1.5" />
                <path d="M276 283 300 297l24-14M300 297v39" fill="none" stroke="#fde68a" strokeOpacity=".8" strokeWidth="1.5" />
                <circle cx="126" cy="214" r="6" fill="#fde68a" filter="url(#softGlow)" />
                <circle cx="488" cy="250" r="5" fill="#fb923c" filter="url(#softGlow)" />
                <circle cx="384" cy="500" r="6" fill="#34d399" filter="url(#softGlow)" />
                <circle cx="176" cy="420" r="4" fill="#fcd34d" />
                <circle cx="435" cy="112" r="3" fill="#fff" fillOpacity=".8" />
                <circle cx="105" cy="350" r="3" fill="#fff" fillOpacity=".65" />
                <path d="M126 214 198 240 245 282M488 250 410 274 356 296M384 500 360 420 328 355" fill="none" stroke="#fcd34d" strokeOpacity=".28" strokeDasharray="3 6" />
                <g transform="translate(60 150)">
                  <rect width="142" height="48" rx="12" fill="#15171b" fillOpacity=".9" stroke="#fff" strokeOpacity=".12" />
                  <circle cx="17" cy="17" r="3" fill="#34d399" />
                  <text x="29" y="20" fill="#fff" fontSize="10" fontWeight="600">NETWORK ONLINE</text>
                  <text x="16" y="36" fill="#fff" fillOpacity=".45" fontSize="9">Signal connected</text>
                </g>
                <g transform="translate(392 382)">
                  <rect width="145" height="52" rx="12" fill="#15171b" fillOpacity=".92" stroke="#fcd34d" strokeOpacity=".2" />
                  <text x="14" y="20" fill="#fff" fillOpacity=".5" fontSize="9" letterSpacing="1">SHIPMENTS TRACKED</text>
                  <text x="14" y="40" fill="#fde68a" fontSize="18" fontWeight="600">{totalShipments.toLocaleString()}</text>
                </g>
              </svg>
              <div className="absolute bottom-[8%] left-[6%] rounded-2xl border border-white/10 bg-[#111318]/80 px-4 py-3 shadow-2xl backdrop-blur-xl transition hover:-translate-y-1 hover:border-amber-300/30">
                <p className="text-[9px] uppercase tracking-[.18em] text-white/35">In transit</p>
                <p className="mt-1 text-xl font-semibold text-amber-200">{inTransit.toLocaleString()}</p>
              </div>
              <div className="absolute right-[3%] top-[10%] rounded-2xl border border-white/10 bg-[#111318]/80 px-4 py-3 shadow-2xl backdrop-blur-xl transition hover:-translate-y-1 hover:border-emerald-300/30">
                <p className="text-[9px] uppercase tracking-[.18em] text-white/35">Delivery rate</p>
                <p className="mt-1 text-xl font-semibold text-emerald-200">{deliveryRate}%</p>
              </div>
            </div>
          </div>
        </section>

        {/* Live stats */}
        <section aria-label="Key shipment metrics" className="rise-in rise-delay-3 grid gap-3 pb-20 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total shipments" value={formatNumber(totalShipments, 0)} sublabel="Records in your network" icon="box" accent="amber" />
          <MetricCard label="Currently in transit" value={formatNumber(inTransit, 0)} sublabel={totalShipments ? `${Math.round((inTransit / totalShipments) * 100)}% of all shipments` : "No active shipments yet"} icon="route" accent="orange" />
          <MetricCard label="Successfully delivered" value={formatNumber(delivered, 0)} sublabel={`${deliveryRate}% delivery share`} icon="check" accent="green" />
          <MetricCard label="Tracked shipment value" value={formatMoney(totalCost)} sublabel="Sum of recorded shipment costs" icon="activity" accent="violet" />
        </section>

        {/* Insights */}
        <section id="insights" className="scroll-mt-24 pb-24 sm:pb-32">
          <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.28em] text-amber-200/80">The bigger picture</p>
              <h2 className="text-3xl font-semibold tracking-[-.045em] sm:text-5xl">Data with direction.</h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/45 sm:text-base">Understand the shape of your operations at a glance. These visualizations are calculated from your current shipment records.</p>
            </div>
            <div className="inline-flex self-start rounded-full border border-white/10 bg-white/[0.035] p-1 md:self-auto">
              <button type="button" onClick={() => setActiveInsight("status")} aria-pressed={activeInsight === "status"} className={`rounded-full px-4 py-2 text-xs transition ${activeInsight === "status" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}>Status mix</button>
              <button type="button" onClick={() => setActiveInsight("cost")} aria-pressed={activeInsight === "cost"} className={`rounded-full px-4 py-2 text-xs transition ${activeInsight === "cost" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}>Cost profile</button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
            <section className="glass-panel hover-lift min-h-[360px] rounded-[28px] p-5 sm:p-8">
              {activeInsight === "status" ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-white/45">Shipment distribution</p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight">Status overview</h3>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[.16em] text-white/40">Live data</span>
                  </div>
                  <div className="mt-9 grid gap-8 sm:grid-cols-[.8fr_1.2fr] sm:items-center">
                    <StatusDonut breakdown={statusBreakdown} total={totalShipments} />
                    <div className="space-y-5">
                      {statusBreakdown.map((item) => (
                        <div key={item.name} className="chart-row group">
                          <div className="mb-2 flex items-center justify-between gap-4">
                            <span className="flex items-center gap-2.5 text-sm text-white/70"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
                            <span className="font-mono text-xs text-white/70">{item.count}<span className="ml-2 text-white/30">{totalShipments ? `${Math.round(item.count / totalShipments * 100)}%` : "0%"}</span></span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                            <div className="chart-bar h-full rounded-full" style={{ width: `${totalShipments ? item.count / totalShipments * 100 : 0}%`, backgroundColor: item.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-white/45">Highest recorded costs</p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight">Cost profile</h3>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[.16em] text-white/40">Top 6</span>
                  </div>
                  {topCostShipments.length ? (
                    <div className="mt-8 space-y-5">
                      {topCostShipments.map(({ shipment, cost }, index) => {
                        const maxCost = Math.max(...topCostShipments.map((item) => item.cost), 1);
                        return (
                          <div key={shipment.id} className="chart-row group">
                            <div className="mb-2 flex items-center justify-between gap-4">
                              <button type="button" onClick={() => openShipment(shipment)} className="min-w-0 truncate text-left text-sm text-white/70 transition hover:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300" title={`Edit ${shipment.content}`}>
                                <span className="mr-2 font-mono text-[10px] text-white/25">{String(index + 1).padStart(2, "0")}</span>{shipment.content || `Shipment ${shipment.id}`}
                              </button>
                              <span className="shrink-0 font-mono text-xs text-white/65">{formatMoney(cost)}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
                              <div className="chart-bar h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-500" style={{ width: `${Math.max(2, cost / maxCost * 100)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyChartMessage message="Cost data will appear here when shipments have numeric costs." />
                  )}
                </>
              )}
            </section>

            <section className="glass-panel hover-lift rounded-[28px] p-5 sm:p-8">
              <p className="text-xs text-white/45">Network at a glance</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">Operational pulse</h3>
              <p className="mt-3 text-sm leading-6 text-white/45">A quick read of the current shipment records.</p>
              <div className="mt-7 space-y-0">
                <PulseRow label="Shipment records" value={formatNumber(totalShipments, 0)} note="All recorded shipments" />
                <PulseRow label="In transit" value={formatNumber(inTransit, 0)} note="Currently moving" />
                <PulseRow label="Delivered" value={formatNumber(delivered, 0)} note="Marked complete" />
                <PulseRow label="Average shipment cost" value={formatMoney(totalShipments ? totalCost / totalShipments : 0)} note="Across all records" last />
              </div>
              <div className="mt-7 overflow-hidden rounded-2xl border border-amber-200/15 bg-gradient-to-br from-amber-300/[0.1] to-orange-400/[0.025] p-4">
                <div className="flex items-center gap-2 text-amber-100">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-200/10">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
                  </span>
                  <span className="text-xs font-semibold">Live operational snapshot</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-white/45">Insights update when shipment data refreshes. No historical trends are inferred without timestamped history.</p>
              </div>
            </section>
          </div>
        </section>

        {/* Network list */}
        <section id="network" className="scroll-mt-24 pb-24 sm:pb-32">
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.28em] text-amber-200/80">Your logistics layer</p>
              <h2 className="text-3xl font-semibold tracking-[-.045em] sm:text-5xl">The whole network.</h2>
              <p className="mt-4 text-sm text-white/45 sm:text-base">Every shipment, one clear view.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={toggleViewMode} className="rounded-full border border-white/12 px-4 py-2.5 text-xs text-white/70 transition hover:border-amber-200/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
                View as {viewMode === "table" ? "cards" : "table"}
              </button>
              <button type="button" onClick={() => void refetch()} disabled={isFetching} className="inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2.5 text-xs text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
                <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9a7 7 0 0 1 11.8-2L20 12M4 12l2.7 5a7 7 0 0 0 11.8-2" /></svg>
                Refresh
              </button>
            </div>
          </div>

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
                      <div className="mt-4 flex justify-end">
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
                          <td className="px-5 py-4 text-right"><button type="button" onClick={(event) => handleDelete(event, shipment)} disabled={deleteMutation.isPending} aria-label={`Delete shipment ${shipment.content}`} className="rounded-full border border-white/10 px-3 py-2 text-[10px] text-white/45 transition hover:border-red-200/30 hover:text-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-40">Delete</button></td>
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

function StatusDonut({
  breakdown,
  total,
}: {
  breakdown: { name: StatusGroup; count: number; color: string }[];
  total: number;
}) {
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-48 w-48">
        <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90" role="img" aria-label={`Status distribution across ${total} shipments`}>
          <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="17" />
          {breakdown.map((item) => {
            const length = total > 0 ? (item.count / total) * circumference : 0;
            const circle = (
              <circle
                key={item.name}
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth="17"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                className="transition-all duration-700"
              >
                <title>{`${item.name}: ${item.count} shipments`}</title>
              </circle>
            );
            offset += length;
            return circle;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold tracking-tight text-white">{total}</span>
          <span className="mt-1 text-[9px] uppercase tracking-[.2em] text-white/35">Shipments</span>
        </div>
      </div>
      <p className="mt-1 text-[10px] text-white/30">Hover the status bars for details</p>
    </div>
  );
}

function PulseRow({
  label,
  value,
  note,
  last = false,
}: {
  label: string;
  value: string;
  note: string;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 py-4 ${last ? "" : "border-b border-white/[0.07]"}`}>
      <div><p className="text-sm text-white/70">{label}</p><p className="mt-1 text-[10px] text-white/30">{note}</p></div>
      <p className="shrink-0 text-right text-lg font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}

function EmptyChartMessage({ message }: { message: string }) {
  return <div className="mt-8 flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 text-center text-sm leading-6 text-white/35">{message}</div>;
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