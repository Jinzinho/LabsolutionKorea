import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CouponBuilder from "./pages/admin/CouponBuilder";
import Coupons from "./pages/admin/Coupons";
import Trash from "./pages/admin/Trash";
import QRStorage from "./pages/admin/QRStorage";
import CouponPopup from "./pages/CouponPopup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/coupon-builder" replace />} />
          <Route path="/admin/coupon-builder" element={<CouponBuilder />} />
          <Route path="/admin/coupons" element={<Coupons />} />
          <Route path="/admin/trash" element={<Trash />} />
          <Route path="/admin/qrs" element={<QRStorage />} />
          <Route path="/coupon" element={<CouponPopup />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
