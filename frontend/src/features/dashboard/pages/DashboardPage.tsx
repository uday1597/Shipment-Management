import { useQuery } from "@tanstack/react-query";

import { Link } from "react-router-dom";

import { getShipments } from "@/features/shipments/services/shipmentService";

export function DashboardPage() {

    const {
        data: shipments = [],
        isPending,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["shipments"],
        queryFn: ({ signal }) => getShipments(signal),
    });

    const total = shipments.length;

    const inTransit = shipments.filter((shipment) => {
        const status = String(shipment.status ?? "").toLowerCase();
        return status.includes("transit") || status.includes("shipping");
    }).length;

    const delivered = shipments.filter((shipment) => {
        const status = String(shipment.status ?? "").toLowerCase();
        return status.includes("deliver") || status.includes("complete");
    }).length;

    const totalCost = shipments.reduce(
        (sum, shipment) => sum + (Number(shipment.cost) || 0),
        0,
    );

    const totalShipments = total;
    const deliveryRate =
        total > 0 ? Math.round((delivered / total) * 100) : 0;

    const metrics = [

        { label: "Total shipments", value: total },

        { label: "In transit", value: inTransit },

        { label: "Delivered", value: delivered },

        {

            label: "Total shipment cost",

            value: new Intl.NumberFormat("en-US", {

                style: "currency",

                currency: "USD",

                maximumFractionDigits: 2,

            }).format(totalCost),

        },

    ];

    return (

        <main className="h-dvh overflow-hidden bg-[#08090c] px-4 py-3 text-white lg:px-8">
        
            {/* Hero */}

            <section id="overview" className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-3 py-2 lg:h-[58dvh] lg:min-h-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-5">

                <div className="rise-in relative z-10">

                    <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.06] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[.2em] text-emerald-200/90">

                        <span className="relative flex h-2 w-2">

                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-40" />

                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />

                        </span>

                        Live operations overview

                    </div>

                    <p className="mb-4 text-xs font-medium uppercase tracking-[.3em] text-amber-200/80">Logistics, reimagined</p>

                    <h1 className="max-w-3xl text-4xl font-semibold leading-[.98] tracking-[-.065em] sm:text-5xl lg:text-6xl xl:text-7xl">

                        Every move.

                        <span className="mt-2 block bg-gradient-to-r from-[#fff3d4] via-[#f4c879] to-[#c98736] bg-clip-text pb-2 text-transparent">In perfect</span>

                        <span className="block text-white/90">perspective.</span>

                    </h1>

                    <p className="mt-7 max-w-xl text-base leading-7 text-white/50 sm:text-lg sm:leading-8">

                        A clearer view of your shipment network. Follow movement, understand costs, and make your next decision with confidence.

                    </p>

                    <div className="mt-2 flex items-center gap-4 text-xs text-white/35">

                        <span className="h-px w-10 bg-amber-300/50" />

                        <span>One network. A thousand moving parts.</span>

                    </div>

                </div>

                {/* Futuristic orbital illustration built in SVG */}

                <div className="rise-in rise-delay-2 relative mx-auto flex w-full max-w-[520px] min-w-0 items-center justify-center py-4 lg:py-0">

                    <div aria-hidden="true" className="absolute h-[72%] w-[72%] rounded-full bg-amber-400/[0.08] blur-[70px]" />

                    <div className="relative aspect-square w-full max-w-[420px]">

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

            {isPending ? (

                <p className="text-sm text-white/60" role="status">

                    Loading shipment metrics…

                </p>

            ) : isError ? (

                <section className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5">

                    <p className="text-sm text-red-200">

                        Shipment metrics could not be loaded.

                    </p>

                    <button

                        type="button"

                        onClick={() => void refetch()}

                        className="mt-3 rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/5"

                    >

                        Try again

                    </button>

                </section>

            ) : (

                <>

                    <section

                        aria-label="Shipment metrics"

                        className="grid grid-cols-2 gap-3 lg:grid-cols-4"

                    >

                        {metrics.map((metric) => (

                            <article

                                key={metric.label}

                                className="rounded-xl border border-white/10 bg-white/[0.035] p-3 lg:p-4"

                            >

                                <p className="text-sm text-white/50">{metric.label}</p>

                                <p className="mt-2 text-2xl font-semibold tracking-tight text-amber-100">

                                    {metric.value}

                                </p>

                            </article>

                        ))}

                    </section>

                    <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 lg:p-5">

                        <p className="text-xs uppercase tracking-[0.2em] text-amber-200/70">

                            Operations

                        </p>

                        <h2 className="mt-3 text-2xl font-semibold">

                            Keep every shipment moving.

                        </h2>

                        <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">

                            Review your shipment records, manage deliveries, and explore

                            trends across your logistics network.

                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">

                            <Link

                                to="/shipments"

                                className="rounded-full border border-white/15 px-5 py-3 text-sm transition hover:border-amber-200/50"

                            >

                                Manage shipments →

                            </Link>

                            <Link

                                to="/analytics"

                                className="rounded-full border border-white/15 px-5 py-3 text-sm transition hover:border-amber-200/50"

                            >

                                Explore analytics →

                            </Link>

                        </div>

                    </section>

                </>

            )}

        </main>

    );

}
