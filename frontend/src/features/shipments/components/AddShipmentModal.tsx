"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import {
  createShipment,
  updateShipment,
} from "@/features/shipments/services/shipmentService";

import type {
  Shipment,
  ShipmentCreate,
} from "@/features/shipments/types/shipment";

interface AddShipmentModalProps {
  onClose: () => void;
  shipment?: Shipment | null;
}

interface FormValues {
  content: string;
  destination: string;
  weight: string;
  distance: string;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item: { msg?: string }) => item.msg ?? JSON.stringify(item))
        .join(", ");
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

export function AddShipmentModal({
  onClose,
  shipment,
}: AddShipmentModalProps) {
  const queryClient = useQueryClient();

  const isEditMode = Boolean(shipment);

  const [content, setContent] = useState("");
  const [destination, setDestination] = useState("");
  const [weight, setWeight] = useState("");
  const [distance, setDistance] = useState("");

  const [originalValues, setOriginalValues] = useState<FormValues>({
    content: "",
    destination: "",
    weight: "",
    distance: "",
  });

  /*
   * Populate form when editing an existing shipment.
   * Reset form when opening create mode.
   */
  useEffect(() => {
    if (shipment) {
      const values = {
        content: shipment.content,
        destination: shipment.destination,
        weight: String(shipment.weight),
        distance: String(shipment.distance),
      };

      setContent(values.content);
      setDestination(values.destination);
      setWeight(values.weight);
      setDistance(values.distance);

      setOriginalValues(values);
    } else {
      const emptyValues = {
        content: "",
        destination: "",
        weight: "",
        distance: "",
      };

      setContent("");
      setDestination("");
      setWeight("");
      setDistance("");

      setOriginalValues(emptyValues);
    }
  }, [shipment]);

  /*
   * Check whether the user actually changed anything.
   */
  const hasChanges =
    content !== originalValues.content ||
    destination !== originalValues.destination ||
    weight !== originalValues.weight ||
    distance !== originalValues.distance;

  /*
   * CREATE
   */
  const createMutation = useMutation({
    mutationFn: (payload: ShipmentCreate) => createShipment(payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["shipments"],
      });

      onClose();
    },
  });

  /*
   * UPDATE
   */
  const updateMutation = useMutation({
    mutationFn: (payload: ShipmentCreate) => {
      if (!shipment) {
        throw new Error("Shipment is required for update");
      }

      return updateShipment(shipment.id, payload);
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["shipments"],
      });

      onClose();
    },
  });

  const isSaving =
    createMutation.isPending || updateMutation.isPending;

  const mutationError =
    createMutation.error ?? updateMutation.error;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: ShipmentCreate = {
      content: content.trim(),
      destination: destination.trim(),
      weight: Number(weight),
      distance: Number(distance),
    };

    /*
     * CREATE MODE
     */
    if (!isEditMode) {
      createMutation.mutate(payload);
      return;
    }

    /*
     * EDIT MODE
     *
     * Don't send PATCH if nothing changed.
     */
    if (!hasChanges || !shipment) {
      return;
    }

    updateMutation.mutate(payload);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-amber-400/20 bg-[#1a1009]/95 shadow-2xl shadow-amber-950/40">
        {/* Top amber accent */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-amber-400">
              Shipment Management
            </p>

            <h2 className="mt-1 text-xl font-semibold text-[#f5e9dc]">
              {isEditMode
                ? "Edit Shipment"
                : "Create Shipment"}
            </h2>

            <p className="mt-1 text-sm text-[#a99482]">
              {isEditMode
                ? "Review and update shipment details."
                : "Enter the details for your new shipment."}
            </p>
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#a99482] transition hover:border-amber-400/30 hover:bg-amber-400/10 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6l12 12M18 6L6 18"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6">
            {/* Error */}
            {mutationError && (
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                {getErrorMessage(mutationError)}
              </div>
            )}

            {/* Content */}
            <div>
              <label
                htmlFor="content"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Shipment Content
              </label>

              <input
                id="content"
                type="text"
                value={content}
                onChange={(event) =>
                  setContent(event.target.value)
                }
                placeholder="e.g. Electronics"
                disabled={isSaving}
                required
                className="w-full rounded-xl border border-white/10 bg-[#020817] px-4 py-3 text-sm text-[#f5e9dc] outline-none transition placeholder:text-slate-600 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Destination */}
            <div>
              <label
                htmlFor="destination"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Destination
              </label>

              <input
                id="destination"
                type="text"
                value={destination}
                onChange={(event) =>
                  setDestination(event.target.value)
                }
                placeholder="e.g. Hyderabad"
                disabled={isSaving}
                required
                className="w-full rounded-xl border border-white/10 bg-[#020817] px-4 py-3 text-sm text-[#f5e9dc] outline-none transition placeholder:text-slate-600 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Weight + Distance */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Weight */}
              <div>
                <label
                  htmlFor="weight"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Weight
                </label>

                <div className="relative">
                  <input
                    id="weight"
                    type="number"
                    min="0"
                    value={weight}
                    onChange={(event) =>
                      setWeight(event.target.value)
                    }
                    placeholder="0"
                    disabled={isSaving}
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#020817] px-4 py-3 pr-16 text-sm text-[#f5e9dc] outline-none transition placeholder:text-slate-600 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#9a8878]">
                    kg
                  </span>
                </div>
              </div>

              {/* Distance */}
              <div>
                <label
                  htmlFor="distance"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Distance
                </label>

                <div className="relative">
                  <input
                    id="distance"
                    type="number"
                    min="0"
                    value={distance}
                    onChange={(event) =>
                      setDistance(event.target.value)
                    }
                    placeholder="0"
                    disabled={isSaving}
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#020817] px-4 py-3 pr-16 text-sm text-[#f5e9dc] outline-none transition placeholder:text-slate-600 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#9a8878]">
                    km
                  </span>
                </div>
              </div>
            </div>

            {/* Edit status */}
            {isEditMode && (
              <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    hasChanges
                      ? "bg-amber-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                      : "bg-slate-600"
                  }`}
                />

                <span className="text-xs text-[#9a8878]">
                  {hasChanges
                    ? "Unsaved changes"
                    : "No changes made"}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-[#f5e9dc] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Close
            </button>

            {/* CREATE BUTTON */}
            {!isEditMode && (
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                )}

                {isSaving
                  ? "Creating..."
                  : "Create Shipment"}
              </button>
            )}

            {/* UPDATE BUTTON
                Only visible when:
                1. Edit mode
                2. Something actually changed
            */}
            {isEditMode && hasChanges && (
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                )}

                {isSaving
                  ? "Updating..."
                  : "Update Shipment"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}