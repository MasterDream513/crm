import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CustomersPage from "./pages/CustomersPage";
import SalesPage from "./pages/SalesPage";
import ProductsPage from "./pages/ProductsPage";
import MarketingPage from "./pages/MarketingPage";
import SettingsPage from "./pages/SettingsPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import ExpensesPage from "./pages/ExpensesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LocaleProvider>
      <AuthProvider>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<AppLayout><DashboardPage /></AppLayout>} />
              <Route path="/customers" element={<AppLayout><CustomersPage /></AppLayout>} />
              <Route path="/customers/:id" element={<AppLayout><CustomerDetailPage /></AppLayout>} />
              <Route path="/sales" element={<AppLayout><SalesPage /></AppLayout>} />
              <Route path="/products" element={<AppLayout><ProductsPage /></AppLayout>} />
              <Route path="/expenses" element={<AppLayout><ExpensesPage /></AppLayout>} />
              <Route path="/marketing" element={<AppLayout><MarketingPage /></AppLayout>} />
              <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LocaleProvider>
  </QueryClientProvider>
);

export default App;
