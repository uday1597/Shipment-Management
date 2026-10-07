import { create } from "zustand";

interface ShipmentStore {
  selectedShipmentId: string | null;
  isDetailsModalOpen: boolean;
  viewMode: "table" | "card";
  searchTerm: string;
  statusFilter: string;
  
  setSearchTerm: (value: string) => void;
  setStatusFilter: (value: string) => void;
  resetFilters: () => void;
  selectShipment: (id: string) => void;
  closeDetailsModal: () => void;
  openCreateModal: () => void;
  toggleViewMode: () => void;
  logCurrentView: () => void;
}

export const useShipmentStore = create<ShipmentStore>((set, get) => ({
  selectedShipmentId: null,
  isDetailsModalOpen: false,
  viewMode: "table",
  searchTerm: "",
  statusFilter: "all",

  selectShipment: (id) =>
    set({
      selectedShipmentId: id,
      isDetailsModalOpen: true,
    }),

  closeDetailsModal: () =>
    set({
      selectedShipmentId: null,
      isDetailsModalOpen: false,
    }),

  openCreateModal: () =>
    set({
      selectedShipmentId: null,
      isDetailsModalOpen: true,
    }),
  
  toggleViewMode: () =>
    set((state) => ({
      viewMode: state.viewMode === "table"
        ? "card"
        : "table",
    })),

  resetShipmentView: () =>
    set({
      viewMode: "table",
    }),

  logCurrentView: () => {
    console.log("Current view:", get().viewMode);
  },

  setSearchTerm: (value) =>
    set({
      searchTerm: value,
    }),
  
  setStatusFilter: (value) =>
    set({
      statusFilter: value,
    }),
  
  resetFilters: () =>
    set({
      searchTerm: "",
      statusFilter: "all",
    }),
}));