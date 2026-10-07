import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { createShipment } from "@/features/shipments/services/shipmentService";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map(
          (item: { msg?: string }) =>
            item.msg ?? JSON.stringify(item),
        )
        .join(", ");
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Could not create shipment";
}

export function AddShipmentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [content, setContent] = useState("");
  const [destination, setDestination] = useState("");
  const [weight, setWeight] = useState("");
  const [distance, setDistance] = useState("");

  const mutation = useMutation({
    mutationFn: createShipment,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["shipments"],
      });

      navigate("/");
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    mutation.mutate({
      content: content.trim(),
      destination: destination.trim(),
      weight: Number(weight),
      distance: Number(distance),
    });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#120b07] text-[#f5e9dc]">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        {/* Warm ambient glow */}
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-[#8b5a2b]/10 blur-[140px]" />

        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#5c3a21]/10 blur-[140px]" />

        {/* Subtle cardboard grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(#b8895b 1px, transparent 1px), linear-gradient(90deg, #b8895b 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Soft vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(18,11,7,0.55)_100%)]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-5 py-10 sm:px-8">

        {/* Back */}
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-xs font-medium text-[#9a8878] transition hover:text-[#d4a574]"
        >
          <span>←</span>
          Back to operations
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c0844f] shadow-[0_0_10px_rgba(192,132,79,0.6)]" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#c0844f]">
              New Shipment
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-[#f5e9dc]">
            Create shipment
          </h1>

          <p className="mt-3 text-sm text-[#8f7b6a]">
            Configure the shipment parameters and add it to the
            logistics network.
          </p>
        </div>

        {/* Form */}
        <div className="relative overflow-hidden rounded-2xl border border-[#5a3b24] bg-[#21140c]/90 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-8">

          {/* Top copper line */}
          <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[#a96f3d] to-transparent" />

          {/* Subtle inner highlight */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-[#c0844f]/[0.04]" />

          <form onSubmit={handleSubmit} className="relative space-y-7">

            <Field
              label="Shipment content"
              hint="What is being shipped?"
            >
              <input
                value={content}
                onChange={(event) =>
                  setContent(event.target.value)
                }
                minLength={5}
                maxLength={100}
                required
                placeholder="e.g. Electronics equipment"
                className={inputClass}
              />
            </Field>

            <Field
              label="Destination"
              hint="Where is the shipment going?"
            >
              <input
                value={destination}
                onChange={(event) =>
                  setDestination(event.target.value)
                }
                minLength={2}
                maxLength={100}
                required
                placeholder="e.g. Hyderabad, India"
                className={inputClass}
              />
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                label="Weight"
                hint="Shipment weight"
              >
                <div className="relative">
                  <input
                    type="number"
                    value={weight}
                    onChange={(event) =>
                      setWeight(event.target.value)
                    }
                    min={0.01}
                    max={1000}
                    step="any"
                    required
                    placeholder="0.00"
                    className={`${inputClass} pr-14`}
                  />

                  <span className={unitClass}>
                    KG
                  </span>
                </div>
              </Field>

              <Field
                label="Distance"
                hint="Delivery distance"
              >
                <div className="relative">
                  <input
                    type="number"
                    value={distance}
                    onChange={(event) =>
                      setDistance(event.target.value)
                    }
                    min={0.01}
                    step="any"
                    required
                    placeholder="0.00"
                    className={`${inputClass} pr-14`}
                  />

                  <span className={unitClass}>
                    KM
                  </span>
                </div>
              </Field>
            </div>

            {mutation.isError && (
              <div className="rounded-xl border border-[#8b4a35]/40 bg-[#6b2e1f]/10 px-4 py-3">
                <p className="text-sm font-medium text-[#d18b6c]">
                  Unable to create shipment
                </p>

                <p className="mt-1 text-xs text-[#b9826a]">
                  {getErrorMessage(mutation.error)}
                </p>
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-[#4a3020] pt-7 sm:flex-row sm:justify-end">

              <Link
                to="/"
                className="rounded-xl border border-[#5a3b24] px-6 py-3 text-center text-sm font-medium text-[#9a8878] transition hover:border-[#765033] hover:bg-[#2a1a10] hover:text-[#ead9c8]"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="rounded-xl bg-[#a96f3d] px-6 py-3 text-sm font-bold text-[#160d07] shadow-[0_0_25px_rgba(169,111,61,0.18)] transition hover:bg-[#c0844f] hover:shadow-[0_0_35px_rgba(169,111,61,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mutation.isPending
                  ? "Creating..."
                  : "Create Shipment →"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

const inputClass =
  "w-full rounded-xl border border-[#4f3523] bg-[#160d08]/80 px-4 py-3 text-sm text-[#f5e9dc] outline-none placeholder:text-[#665447] transition focus:border-[#a96f3d]/70 focus:bg-[#21130b] focus:ring-1 focus:ring-[#a96f3d]/20";

const unitClass =
  "absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold tracking-wider text-[#756052]";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label className="text-sm font-medium text-[#dfcdbb]">
          {label}
        </label>

        <span className="text-[10px] text-[#756052]">
          {hint}
        </span>
      </div>

      {children}
    </div>
  );
}