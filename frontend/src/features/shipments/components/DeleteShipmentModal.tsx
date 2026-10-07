import type { Shipment } from "@/features/shipments/types/shipment";

interface DeleteShipmentModalProps {
  shipment: Shipment;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteShipmentModal({
  shipment,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteShipmentModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) {
          onCancel();
        }
      }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-amber-400/20 bg-[#1a1009]/95 shadow-2xl shadow-amber-950/30">
        {/* Top accent */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        <div className="p-6">
          {/* Icon */}
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-500/10 text-amber-400">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 17h.01"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.3 3.7L2.6 17a2 2 0 001.7 3h15.4a2 2 0 001.7-3L13.7 3.7a2 2 0 00-3.4 0z"
              />
            </svg>
          </div>

          {/* Heading */}
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-amber-400">
            Delete Shipment
          </p>

          <h2 className="mt-2 text-xl font-semibold text-[#f5e9dc]">
            Delete this shipment?
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#a99482]">
            This action cannot be undone. The following shipment
            will be permanently removed.
          </p>

          {/* Shipment info */}
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-[#9a8878]">
                Shipment
              </span>

              <span className="font-mono text-sm text-amber-400">
                #{shipment.id}
              </span>
            </div>

            <div className="mt-3">
              <p className="text-sm font-medium text-[#f5e9dc]">
                {shipment.content}
              </p>

              <p className="mt-1 text-xs text-[#9a8878]">
                {shipment.destination}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-[#f5e9dc] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-[#f5e9dc] shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}

              {isDeleting ? "Deleting..." : "Delete Shipment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}