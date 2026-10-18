import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import "./App.css";

import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./features/dashboard/pages/DashboardPage";
import { AnalyticsPage } from "./features/analytics/pages/AnalyticsPage";
import { AddShipmentPage } from "./features/shipments/pages/AddShipmentPage";
import { ShipmentLandingPage } from "./features/shipments/pages/ShipmentLandingPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route
              path="shipments"
              element={<ShipmentLandingPage />}
            />
            <Route
              path="analytics"
              element={<AnalyticsPage />}
            />
            <Route
              path="shipments/new"
              element={<AddShipmentPage />}
            />
          </Route>

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
