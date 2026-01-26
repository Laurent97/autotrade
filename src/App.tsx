import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import { PaymentProvider } from "./contexts/PaymentContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import WhatsAppFloating from "./components/CustomerService/WhatsAppFloating";
import { injectSpeedInsights } from "@vercel/speed-insights";
import { AdminOnlyRoute, PartnerOnlyRoute } from "./components/RoleBasedRoute";
import Index from "./pages/Index";
import Products from "./pages/Products-Enhanced";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import OrderSuccess from "./pages/OrderSuccess";
import OrderSuccessStore from "./pages/OrderSuccessStore";
import OrderDetails from "./pages/OrderDetails";
import MyOrders from "./pages/MyOrders";
import FAQ from "./pages/FAQ";
import PartnerFAQ from "./pages/FAQ-Partner";
import Careers from "./pages/Careers";
import Returns from "./pages/Returns";
import Stores from "./pages/Stores";
import Store from "./pages/Store";
import Auth from "./pages/Auth";
import Manufacturers from "./pages/Manufacturers";
import Notifications from "./pages/Notifications";
import AppLayout from "./components/Layout/AppLayout";
import PartnerPending from "./pages/partner/Pending";
import PartnerRegisterRedirect from "./pages/PartnerRegisterRedirect";
import BecomePartner from "./pages/BecomePartner";
import PartnerDashboard from "./pages/partner/Dashboard";
import PartnerInfo from "./pages/partner/Info";
import DashboardOverview from "./pages/partner/DashboardOverview";
import DashboardProducts from "./pages/partner/DashboardProducts";
import DashboardOrders from "./pages/partner/DashboardOrders";
import DashboardWallet from "./pages/partner/DashboardWallet";
import DashboardInventory from "./pages/partner/DashboardInventory";
import DashboardEarnings from "./pages/partner/DashboardEarnings";
import DashboardAnalytics from "./pages/partner/DashboardAnalytics";
import DashboardSettings from "./pages/partner/DashboardSettings";
import WalletDeposit from "./pages/partner/WalletDeposit";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products-Enhanced";
import AdminPartners from "./pages/admin/Partners";
import AdminPartnersTest from "./pages/admin/Partners-Test";
import AdminUsers from "./pages/admin/Users";
import AdminOrders from "./pages/admin/Orders";
import AdminSettings from "./pages/admin/Settings";
import AdminPayments from "./pages/admin/Payments";
import AdminPasswordReset from "./pages/admin/PasswordReset";
import ProductForm from "./components/Admin/ProductForm";
import LikedItems from "./pages/LikedItems";
import NotFound from "./pages/NotFound";
import Shipping from "./pages/Shipping";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import CreateAccount from "./pages/help/getting-started/CreateAccount";
import SetupProfile from "./pages/help/getting-started/SetupProfile";
import VerifyIdentity from "./pages/help/getting-started/VerifyIdentity";
import FirstOrderGuide from "./pages/help/getting-started/FirstOrderGuide";
import SearchProducts from "./pages/help/buying/SearchProducts";
import TrackOrder from "./pages/TrackOrder";

// Payment components for dashboard integration
import CryptoDeposit from "./components/Payment/CryptoDeposit";
import WithdrawalForm from "./components/Payment/WithdrawalForm";
import PaymentVerification from "./components/Admin/PaymentVerification";
import StripeAttemptsDashboard from "./components/Admin/StripeAttemptsDashboard";

const queryClient = new QueryClient();

// Initialize SpeedInsights
injectSpeedInsights();

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <PaymentProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <WhatsAppFloating />
                  <AppLayout>
                    <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products-legacy" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/payment" element={<Payment />} />
              <Route path="/liked-items" element={<LikedItems />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/order-success/:orderId" element={<OrderSuccessStore />} />
              <Route path="/stores" element={<Stores />} />
              <Route path="/manufacturers" element={<Manufacturers />} />
              <Route path="/store/:storeSlug" element={<Store />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/partner/register" element={<BecomePartner />} />
              <Route path="/partner/apply" element={<BecomePartner />} />
              <Route path="/become-partner" element={<BecomePartner />} />
                            <Route path="/partner/info" element={<PartnerInfo />} />
              <Route path="/partner/pending" element={<PartnerPending />} />
              <Route path="/partner/dashboard" element={<PartnerOnlyRoute requireApproved={true}><PartnerDashboard /></PartnerOnlyRoute>}>
                <Route index element={<DashboardOverview />} />
                <Route path="products" element={<DashboardProducts />} />
                <Route path="orders" element={<DashboardOrders />} />
                <Route path="inventory" element={<DashboardInventory />} />
                <Route path="earnings" element={<DashboardEarnings />} />
                <Route path="analytics" element={<DashboardAnalytics />} />
                <Route path="settings" element={<DashboardSettings />} />
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
              <Route path="/admin/payments" element={<AdminOnlyRoute><AdminPayments /></AdminOnlyRoute>} />
              <Route path="/admin/password-reset" element={<AdminOnlyRoute><AdminPasswordReset /></AdminOnlyRoute>} />
              <Route path="/admin/stripe-attempts" element={<AdminOnlyRoute><StripeAttemptsDashboard /></AdminOnlyRoute>} />
              <Route path="/admin/settings" element={<AdminOnlyRoute><AdminSettings /></AdminOnlyRoute>} />
              <Route path="/shipping" element={<Shipping />} />
              <Route path="/track" element={<TrackOrder />} />
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/orders/:orderId" element={<OrderDetails />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/help" element={<Help />} />
              <Route path="/help/getting-started/create-account" element={<CreateAccount />} />
              <Route path="/help/getting-started/setup-profile" element={<SetupProfile />} />
              <Route path="/help/getting-started/verify-identity" element={<VerifyIdentity />} />
              <Route path="/help/getting-started/first-order-guide" element={<FirstOrderGuide />} />
              <Route path="/help/buying/search-products" element={<SearchProducts />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/faqs" element={<PartnerFAQ />} />
              <Route path="/careers" element={<Careers />} />
              {/* Legacy routes - redirect to dashboard */}
              <Route path="/payment/crypto-deposit" element={<PartnerOnlyRoute requireApproved={true}><Navigate to="/partner/dashboard/wallet/deposit" replace /></PartnerOnlyRoute>} />
              <Route path="/payment/withdraw" element={<PartnerOnlyRoute requireApproved={true}><Navigate to="/partner/dashboard/wallet/withdraw" replace /></PartnerOnlyRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
                  </AppLayout>
            </BrowserRouter>
            </TooltipProvider>
          </PaymentProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
</ErrorBoundary>
);

export default App;
