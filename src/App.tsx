import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PersonalizarPage from "./pages/Personalizar";

import CartPage from "./pages/Cart";
import Header from "./components/Header";
import { CartProvider } from "./context/CartContext";
import AdminPedidos from "./pages/AdminPedidos";
import AdminLogin from "./pages/AdminLogin";

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthed = typeof window !== 'undefined' && localStorage.getItem('admin_auth') === 'true';
  return isAuthed ? children : <Navigate to="/admin/login" replace />;
};

const AdminIndexRedirect = () => {
  const isAuthed = typeof window !== 'undefined' && localStorage.getItem('admin_auth') === 'true';
  return <Navigate to={isAuthed ? "/admin/pedidos" : "/admin/login"} replace />;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CartProvider>
        <Header />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/personalizar" element={<PersonalizarPage />} />
          <Route path="/carrito" element={<CartPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminIndexRedirect />} />
          <Route path="/admin/pedidos" element={<AdminRoute><AdminPedidos /></AdminRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
