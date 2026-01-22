import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import WhatsAppFloating from "./components/CustomerService/WhatsAppFloating";
import { AdminOnlyRoute, PartnerOnlyRoute } from "./components/RoleBasedRoute";
import Index from "./pages/Index";
import Products from "./pages/Products-Enhanced";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import OrderSuccess from "./pages/OrderSuccess";
import OrderSuccessStore from "./pages/OrderSuccessStore";
import Auth from "./pages/Auth";
import Store from "./pages/Store";
import Stores from "./pages/Stores";
import Manufacturers from "./pages/Manufacturers";
import PartnerRegister from "./pages/partner/Register";
import PartnerPending from "./pages/partner/Pending";
import PartnerDashboard from "./pages/partner/Dashboard";
import DashboardOverview from "./pages/partner/DashboardOverview";
import DashboardProducts from "./pages/partner/DashboardProducts";
import DashboardOrders from "./pages/partner/DashboardOrders";
import DashboardWallet from "./pages/partner/DashboardWallet";
import WalletDeposit from "./pages/partner/WalletDeposit";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products-Enhanced";
import AdminPartners from "./pages/admin/Partners";
import AdminPartnersTest from "./pages/admin/Partners-Test";
import AdminUsers from "./pages/admin/Users";
import AdminOrders from "./pages/admin/Orders";
import AdminSettings from "./pages/admin/Settings";
import ProductForm from "./components/Admin/ProductForm";
import LikedItems from "./pages/LikedItems";
import NotFound from "./pages/NotFound";
import Shipping from "./pages/Shipping";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import Returns from "./pages/Returns";
import TrackOrder from "./pages/TrackOrder";
import FAQ from "./pages/FAQ";

// Payment components for dashboard integration
import CryptoDeposit from "./components/Payment/CryptoDeposit";
import WithdrawalForm from "./components/Payment/WithdrawalForm";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <WhatsAppFloating />
                <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products-legacy" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/payment" element={<Payment />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/liked-items" element={<LikedItems />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/order-success/:orderId" element={<OrderSuccessStore />} />
              <Route path="/stores" element={<Stores />} />
              <Route path="/manufacturers" element={<Manufacturers />} />
              <Route path="/store/:storeSlug" element={<Store />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/partner/register" element={<PartnerRegister />} />
              <Route path="/partner/pending" element={<PartnerPending />} />
              <Route path="/partner/dashboard" element={<PartnerOnlyRoute requireApproved={true}><PartnerDashboard /></PartnerOnlyRoute>}>
                <Route index element={<DashboardOverview />} />
                <Route path="products" element={<DashboardProducts />} />
                <Route path="orders" element={<DashboardOrders />} />
                <Route path="wallet" element={<DashboardWallet />} />
                <Route path="wallet/deposit" element={<WalletDeposit />} />
              </Route>
              <Route path="/admin" element={<AdminOnlyRoute><AdminDashboard /></AdminOnlyRoute>} />
              <Route path="/admin/users" element={<AdminOnlyRoute><AdminUsers /></AdminOnlyRoute>} />
              <Route path="/admin/products" element={<AdminOnlyRoute><AdminProducts /></AdminOnlyRoute>} />
              <Route path="/admin/products/new" element={<AdminOnlyRoute><ProductForm /></AdminOnlyRoute>} />
              <Route path="/admin/products/:id" element={<AdminOnlyRoute><ProductForm /></AdminOnlyRoute>} />
              <Route path="/admin/partners" element={<AdminOnlyRoute><AdminPartners /></AdminOnlyRoute>} />
              <Route path="/admin/partners-test" element={<AdminOnlyRoute><AdminPartnersTest /></AdminOnlyRoute>} />
              <Route path="/admin/orders" element={<AdminOnlyRoute><AdminOrders /></AdminOnlyRoute>} />
              <Route path="/admin/settings" element={<AdminOnlyRoute><AdminSettings /></AdminOnlyRoute>} />
              <Route path="/shipping" element={<Shipping />} />
              <Route path="/track" element={<TrackOrder />} />
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/help" element={<Help />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/faq" element={<FAQ />} />
              {/* Legacy routes - redirect to dashboard */}
              <Route path="/payment/crypto-deposit" element={<PartnerOnlyRoute requireApproved={true}><Navigate to="/partner/dashboard/wallet/deposit" replace /></PartnerOnlyRoute>} />
              <Route path="/payment/withdraw" element={<PartnerOnlyRoute requireApproved={true}><Navigate to="/partner/dashboard/wallet/withdraw" replace /></PartnerOnlyRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
