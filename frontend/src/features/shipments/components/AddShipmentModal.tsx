"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import {
  createShipment,
  updateShipment,
} from "@/features/shipments/services/shipmentService";

import type {
  Shipment,
  ShipmentCreate,
  ShipmentUpdate,
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

type FormField = keyof FormValues;

const EMPTY_FORM: FormValues = {
  content: "",
  destination: "",
  weight: "",
  distance: "",
};

const SHIPMENT_QUERY_KEY = ["shipments"] as const;

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 409) {
      return "This shipment was changed elsewhere. Refresh the shipment and try again.";
    }
    const detail: unknown = error.response?.data?.detail;

    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item: unknown) => {
          if (
            typeof item === "object" &&
            item !== null &&
            "msg" in item &&
            typeof item.msg === "string"
          ) {
            const location =
              "loc" in item && Array.isArray(item.loc)
                ? item.loc.filter((part) => typeof part === "string" || typeof part === "number").join(" → ")
                : "";

            return location ? `${location}: ${item.msg}` : item.msg;
          }

          return null;
        })
        .filter((message): message is string => Boolean(message));

      if (messages.length > 0) {
        return messages.join(" ");
      }
    }

    if (!error.response) {
      return "Unable to reach the server. Check your connection and try again.";
    }

    if (error.response.status >= 500) {
      return "The server encountered an error. Please try again later.";
    }

    return error.message || "The request could not be completed.";
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function getFormValues(shipment?: Shipment | null): FormValues {
  if (!shipment) {
    return { ...EMPTY_FORM };
  }

  return {
    content: shipment.content ?? "",
    destination: shipment.destination ?? "",
    weight: String(shipment.weight ?? ""),
    distance: String(shipment.distance ?? ""),
  };
}

function isValidPositiveNumber(value: string, max?: number): boolean {
  if (value.trim() === "") return false;

  const parsed = Number(value);
  return (
    Number.isFinite(parsed) &&
    parsed > 0 &&
    (max === undefined || parsed <= max)
  );
}

export function AddShipmentModal({
  onClose,
  shipment,
}: AddShipmentModalProps) {
  const queryClient = useQueryClient();
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();

  const dialogRef = useRef<HTMLDivElement>(null);
  const contentInputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const isEditMode = Boolean(shipment);
  const initialValues = useMemo(() => getFormValues(shipment), [
    shipment?.id,
    shipment?.content,
    shipment?.destination,
    shipment?.weight,
    shipment?.distance,
  ]);

  const [values, setValues] = useState<FormValues>(initialValues);
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    setValues(initialValues);
    setClientError(null);
  }, [initialValues]);

  const isSavingRef = useRef(false);

  const closeIfIdle = useCallback(() => {
    if (!isSavingRef.current) {
      onCloseRef.current();
    }
  }, []);

  useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const focusFrame = window.requestAnimationFrame(() => {
      contentInputRef.current?.focus();
    });

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeIfIdle();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      const elements = Array.from(focusable).filter(
        (element) => element.getAttribute("aria-hidden") !== "true",
      );

      if (elements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [closeIfIdle]);

  const hasChanges =
    values.content.trim() !== initialValues.content ||
    values.destination.trim() !== initialValues.destination ||
    Number(values.weight) !== Number(initialValues.weight) ||
    Number(values.distance) !== Number(initialValues.distance);

  const createMutation = useMutation({
    mutationFn: (payload: ShipmentCreate) => createShipment(payload),
    retry: 0,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SHIPMENT_QUERY_KEY });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: ShipmentUpdate) => {
      if (!shipment) {
        throw new Error("A shipment is required to update.");
      }

      return updateShipment(shipment.id, payload);
    },
    retry: 0,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SHIPMENT_QUERY_KEY });
      onClose();
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;
  isSavingRef.current = isSaving;

  const mutationError = createMutation.error ?? updateMutation.error;
  const errorMessage = clientError ?? (mutationError ? getErrorMessage(mutationError) : null);

  const updateField = (field: FormField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setClientError(null);
    createMutation.reset();
    updateMutation.reset();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSaving) return;

    setClientError(null);
    createMutation.reset();
    updateMutation.reset();

    const normalized: FormValues = {
      content: values.content.trim(),
      destination: values.destination.trim(),
      weight: values.weight.trim(),
      distance: values.distance.trim(),
    };

    if (normalized.content.length < 5 || normalized.content.length > 100) {
      setClientError("Shipment content must be between 5 and 100 characters.");
      return;
    }

    if (
      normalized.destination.length < 2 ||
      normalized.destination.length > 100
    ) {
      setClientError("Destination must be between 2 and 100 characters.");
      return;
    }

    if (!isValidPositiveNumber(normalized.weight, 1000)) {
      setClientError("Weight must be greater than 0 and no more than 1000 kg.");
      return;
    }

    if (!isValidPositiveNumber(normalized.distance)) {
      setClientError("Distance must be a number greater than 0.");
      return;
    }

    if (!isEditMode) {
      const payload: ShipmentCreate = {
        content: normalized.content,
        destination: normalized.destination,
        weight: Number(normalized.weight),
        distance: Number(normalized.distance),
      };

      createMutation.mutate(payload);
      return;
    }

    if (!shipment || !hasChanges) return;

    const payload: ShipmentUpdate = {
      expected_version: shipment.version,
    };
    
    if (normalized.content !== initialValues.content) {
      payload.content = normalized.content;
    }

    if (normalized.destination !== initialValues.destination) {
      payload.destination = normalized.destination;
    }

    if (Number(normalized.weight) !== Number(initialValues.weight)) {
      payload.weight = Number(normalized.weight);
    }

    if (Number(normalized.distance) !== Number(initialValues.distance)) {
      payload.distance = Number(normalized.distance);
    }

    if (Object.keys(payload).length > 0) {
      updateMutation.mutate(payload);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-amber-400/20 bg-[#1a1009]/95 shadow-2xl shadow-amber-950/40"
      >
        {/* Top amber accent */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-amber-400">
              Shipment Management
            </p>

            <h2 id={titleId} className="mt-1 text-xl font-semibold text-[#f5e9dc]">
              {isEditMode ? "Edit Shipment" : "Create Shipment"}
            </h2>

            <p
              id={descriptionId}
              className="mt-1 text-sm text-[#a99482]"
            >
              {isEditMode
                ? "Review and update shipment details."
                : "Enter the details for your new shipment."}
            </p>
          </div>

          <button
            type="button"
            onClick={closeIfIdle}
            disabled={isSaving}
            aria-label="Close shipment dialog"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#a99482] transition hover:border-amber-400/30 hover:bg-amber-400/10 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              aria-hidden="true"
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

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5 px-6 py-6">
            {errorMessage && (
              <div
                id={errorId}
                role="alert"
                aria-live="assertive"
                className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              >
                {errorMessage}
              </div>
            )}

            {/* Content */}
            <div>
              <label
                htmlFor="shipment-content"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Shipment Content
              </label>
              <input
                ref={contentInputRef}
                id="shipment-content"
                name="content"
                type="text"
                value={values.content}
                onChange={(event) => updateField("content", event.target.value)}
                placeholder="e.g. Electronics"
                minLength={5}
                maxLength={100}
                autoComplete="off"
                disabled={isSaving}
                required
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? errorId : undefined}
                className="w-full rounded-xl border border-white/10 bg-[#020817] px-4 py-3 text-sm text-[#f5e9dc] outline-none transition placeholder:text-slate-600 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Destination */}
            <div>
              <label
                htmlFor="shipment-destination"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Destination
              </label>
              <input
                id="shipment-destination"
                name="destination"
                type="text"
                value={values.destination}
                onChange={(event) => updateField("destination", event.target.value)}
                placeholder="e.g. Hyderabad"
                minLength={2}
                maxLength={100}
                autoComplete="shipping locality"
                disabled={isSaving}
                required
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? errorId : undefined}
                className="w-full rounded-xl border border-white/10 bg-[#020817] px-4 py-3 text-sm text-[#f5e9dc] outline-none transition placeholder:text-slate-600 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Weight + Distance */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="shipment-weight"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Weight
                </label>
                <div className="relative">
                  <input
                    id="shipment-weight"
                    name="weight"
                    type="number"
                    min="0.000001"
                    max="1000"
                    step="any"
                    inputMode="decimal"
                    value={values.weight}
                    onChange={(event) => updateField("weight", event.target.value)}
                    placeholder="0"
                    disabled={isSaving}
                    required
                    aria-describedby="shipment-weight-unit"
                    className="w-full rounded-xl border border-white/10 bg-[#020817] px-4 py-3 pr-16 text-sm text-[#f5e9dc] outline-none transition placeholder:text-slate-600 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <span
                    id="shipment-weight-unit"
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#9a8878]"
                  >
                    kg
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="shipment-distance"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Distance
                </label>
                <div className="relative">
                  <input
                    id="shipment-distance"
                    name="distance"
                    type="number"
                    min="0.000001"
                    step="any"
                    inputMode="decimal"
                    value={values.distance}
                    onChange={(event) => updateField("distance", event.target.value)}
                    placeholder="0"
                    disabled={isSaving}
                    required
                    aria-describedby="shipment-distance-unit"
                    className="w-full rounded-xl border border-white/10 bg-[#020817] px-4 py-3 pr-16 text-sm text-[#f5e9dc] outline-none transition placeholder:text-slate-600 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <span
                    id="shipment-distance-unit"
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#9a8878]"
                  >
                    km
                  </span>
                </div>
              </div>
            </div>

            {/* Edit status */}
            {isEditMode && (
              <div
                className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                aria-live="polite"
              >
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full ${
                    hasChanges
                      ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                      : "bg-slate-600"
                  }`}
                />
                <span className="text-xs text-[#9a8878]">
                  {hasChanges ? "Unsaved changes" : "No changes made"}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
            <button
              type="button"
              onClick={closeIfIdle}
              disabled={isSaving}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-[#f5e9dc] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            {(!isEditMode || hasChanges) && (
              <button
                type="submit"
                disabled={isSaving || (isEditMode && !hasChanges)}
                className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving && (
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950"
                  />
                )}
                {isSaving
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                    ? "Update Shipment"
                    : "Create Shipment"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
