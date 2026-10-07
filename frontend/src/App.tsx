import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AddShipmentPage } from "./features/shipments/pages/AddShipmentPage";
import "./App.css";
import { ShipmentLandingPage } from "./features/shipments/pages/ShipmentLandingPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ShipmentLandingPage/>}/>
          <Route path="/shipments/new" element={<AddShipmentPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
