import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { partnerService } from '../../lib/supabase/partner-service';
import { partnerTrackingAPI } from '../../services/tracking-api';
import { walletService } from '../../lib/supabase/wallet-service';
import LoadingSpinner from '../../components/LoadingSpinner';
import ThemeSwitcher from '../../components/ThemeSwitcher';
import OrderActionsDropdown from '../../components/Partner/OrderActionsDropdown';
import OrderTrackingBadge from '../../components/Partner/OrderTrackingBadge';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { useOrderRealtime } from '../../hooks/useOrderRealtime';
import { 
  Wallet,
  AlertCircle,
  Package,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Search,
  RefreshCw,
  Eye,
  Filter,
  Grid3X3,
  List,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

export default function DashboardOrders() {
  const { user, userProfile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [trackingData, setTrackingData] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Wallet state
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);
  
  // Partner profile state
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [partnerLoading, setPartnerLoading] = useState(true);

  useEffect(() => {
    if (user?.id && !partnerProfile) {
      loadPartnerProfile();
    }
  }, [user?.id, partnerProfile]);

  useEffect(() => {
    if (partnerProfile) {
      loadOrders();
      loadWalletBalance();
      loadTrackingData();
    }
  }, [partnerProfile]);

  // Realtime subscription for order updates
  useOrderRealtime({
    enabled: !!partnerProfile,
    onOrderUpdate: (payload) => {
      // Only update if this order is assigned to current partner
      if (payload.new.partner_id === partnerProfile?.id) {
        // Update specific order in state
        setOrders(prev => prev.map(order => 
          order.id === payload.new.id 
            ? { ...order, ...payload.new }
            : order
        ));
        
        // Refresh tracking data when order status changes to shipped
        if (payload.new.status === 'shipped' && payload.old?.status !== 'shipped') {
          loadTrackingData();
        }
      } else {
        // If order was reassigned from this partner, remove it
        if (payload.old?.partner_id === partnerProfile?.id && payload.new.partner_id !== partnerProfile?.id) {
          setOrders(prev => prev.filter(order => order.id !== payload.new.id));
        }
        // If order was assigned to this partner, add it
        if (payload.old?.partner_id !== partnerProfile?.id && payload.new.partner_id === partnerProfile?.id) {
          setOrders(prev => [payload.new, ...prev]);
          // Load tracking data for new order
          loadTrackingData();
        }
      }
    },
    onOrderInsert: (payload) => {
      // Only add new order if it's assigned to current partner
      if (payload.new.partner_id === partnerProfile?.id) {
        // Add new order to beginning of list
        setOrders(prev => [payload.new, ...prev]);
        // Load tracking data for new order
        loadTrackingData();
      }
    },
    onOrderDelete: (payload) => {
      // Only remove order if it was assigned to current partner
      if (payload.old.partner_id === partnerProfile?.id) {
        // Remove order from state
        setOrders(prev => prev.filter(order => order.id !== payload.old.id));
      }
    }
  });

  const loadPartnerProfile = async () => {
    if (!user?.id) return;
    
    setPartnerLoading(true);
    try {
      const { data: partnerData } = await partnerService.getPartnerProfile(user.id);
      setPartnerProfile(partnerData);
    } catch (err) {
      console.error('Failed to load partner profile:', err);
    } finally {
      setPartnerLoading(false);
    }
  };

  const loadWalletBalance = async () => {
    if (!user?.id) return;
    
    setWalletLoading(true);
    try {
      const { data: statsData } = await walletService.getStats(user.id);
      setWalletBalance(statsData?.availableBalance || 0);
    } catch (err) {
      console.error('Failed to load wallet balance:', err);
    } finally {
      setWalletLoading(false);
    }
  };

  const loadTrackingData = async () => {
    if (!partnerProfile?.id) return;
    
    try {
      const result = await partnerTrackingAPI.getPartnerTracking(partnerProfile.id);
      if (result.success && result.data) {
        const trackingMap: {[key: string]: any} = {};
        result.data.forEach((tracking: any) => {
          trackingMap[tracking.order_id] = tracking;
        });
        setTrackingData(trackingMap);
      }
    } catch (err) {
      console.error('Failed to load tracking data:', err);
    }
  };

  const loadOrders = async () => {
    if (!partnerProfile) return;
    
    setLoading(true);
    try {
      console.log('=== ORDERS PAGE DEBUGGING ===');
      console.log('Loading orders for partner:', partnerProfile.id);
      
      const { data: ordersData } = await partnerService.getPartnerOrders(partnerProfile.id);
      console.log('Orders data received:', ordersData?.length || 0, 'orders');
      
      // Debug order statuses
      if (ordersData && ordersData.length > 0) {
        const statusBreakdown = ordersData.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {});
        console.log('Order status breakdown:', statusBreakdown);
        
        const paymentStatusBreakdown = ordersData.reduce((acc, order) => {
          acc[order.payment_status] = (acc[order.payment_status] || 0) + 1;
          return acc;
        }, {});
        console.log('Payment status breakdown:', paymentStatusBreakdown);
      }
      
      console.log('=== END ORDERS PAGE DEBUG ===');
      
      setOrders(ordersData || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      console.log('Updating order status:', orderId, 'to:', newStatus);
      
      const { error } = await partnerService.updateOrderStatus(
        orderId,
        newStatus as 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'
      );
      
      if (error) {
        console.error('Status update error:', error);
        throw error;
      }
      
      console.log('Order status updated successfully');
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      
      // Show success feedback
      alert(`Order status updated to ${newStatus} successfully!`);
    } catch (err) {
      console.error('Failed to update order:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order');
      alert(`Failed to update order: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleProcessOrder = async (order: any) => {
    if (!user?.id) {
      alert('Authentication required. Please log in again.');
      return;
    }
    
    if (!order || !order.id) {
      alert('Invalid order data. Please try again.');
      return;
    }
    
    const orderAmount = order.total_amount || 0;
    if (orderAmount <= 0) {
      alert('Invalid order amount. Cannot process payment.');
      return;
    }
    
    const confirmPayment = window.confirm(
      `Process payment for Order #${order.order_number || order.id}?\n\nAmount: $${orderAmount.toFixed(2)}\n\nThis will deduct the amount from your wallet balance.`
    );
    
    if (!confirmPayment) return;
    
    try {
      console.log('Processing payment for order:', order.id);
      console.log('User ID:', user.id);
      console.log('Order amount:', orderAmount);
      
      const { success, error, message } = await partnerService.processOrderPayment(order.id, user.id);
      
      if (error) {
        console.error('Payment processing failed:', error);
        alert(`❌ Payment Failed: ${error}`);
        return;
      }
      
      console.log('Payment processed successfully:', message);
      alert('✅ Payment processed successfully! Order status updated to "Waiting Confirmation".');
      
      // Refresh data
      await loadOrders();
      await loadWalletBalance();
    } catch (err) {
      console.error('Unexpected error processing payment:', err);
      alert('❌ An unexpected error occurred. Please try again or contact support.');
    }
  };

  const handleViewOrderDetails = async (order: any) => {
    if (!order || !order.id) {
      alert('Invalid order data. Please try again.');
      return;
    }
    
    console.log('Viewing order details:', order);
    
    // Create a detailed order information modal/alert
    const orderDetails = `
ORDER DETAILS
================
Order ID: ${order.id}
Order Number: ${order.order_number || 'N/A'}
Status: ${order.status || 'N/A'}
Payment Status: ${order.payment_status || 'N/A'}
Total Amount: $${(order.total_amount || 0).toFixed(2)}
Created: ${new Date(order.created_at).toLocaleString()}

CUSTOMER INFORMATION
================
Name: ${order.user?.full_name || 'N/A'}
Email: ${order.user?.email || 'N/A'}

ORDER ITEMS
================
${order.order_items?.map((item: any, index: number) => 
  `${index + 1}. ${item.product?.title || item.product?.make || 'Unknown Product'}
     Quantity: ${item.quantity}
     Unit Price: $${(item.unit_price || 0).toFixed(2)}
     Subtotal: $${(item.subtotal || 0).toFixed(2)}`
).join('\n') || 'No items found'}

SHIPPING ADDRESS
================
${order.shipping_address ? JSON.stringify(order.shipping_address, null, 2) : 'Not specified'}
    `;
    
    alert(orderDetails);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300';
      case 'processing': return 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300';
      case 'waiting_confirmation': return 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300';
      case 'shipped': return 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300';
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300';
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders.filter(order => 
        searchTerm === '' || 
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : orders.filter(o => o.status === filter && (
        searchTerm === '' || 
        o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      ));

  // Calculate statistics - FIXED to include revenue-eligible orders
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    
    // Revenue calculations using revenue-eligible orders
    revenueOrders: orders.filter(order => 
      ['completed', 'paid', 'processing'].includes(order.status) && 
      ['paid', 'completed'].includes(order.payment_status)
    ).length,
    
    totalRevenue: orders.filter(order => 
      ['completed', 'paid', 'processing'].includes(order.status) && 
      ['paid', 'completed'].includes(order.payment_status)
    ).reduce((sum, o) => sum + (o.total_amount || 0), 0),
    
    pendingRevenue: orders.filter(o => o.status === 'pending').reduce((sum, o) => sum + (o.total_amount || 0), 0),
    
    averageOrderValue: orders.length > 0 
      ? orders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / orders.length 
      : 0
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <ShoppingBag className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Orders Dashboard</h1>
              <p className="text-muted-foreground">Manage orders, track shipments, and process payments</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Enhanced Wallet Balance Card */}
          <Card className="border-l-4 border-l-amber-500 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {walletLoading ? '...' : `$${walletBalance.toFixed(2)}`}
                  </p>
                </div>
                <div className="p-3 bg-amber-100 dark:bg-amber-800/30 rounded-full">
                  <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <ThemeSwitcher />
        </div>
      </div>

      {/* Status Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 lg:grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Active ({stats.processing + stats.shipped})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Completed ({stats.completed})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-t-4 border-t-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <h3 className="text-3xl font-bold mt-2">{stats.total}</h3>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600 dark:text-green-400">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  <span>All time orders</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-amber-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Orders</p>
                    <h3 className="text-3xl font-bold mt-2 text-amber-600">{stats.pending}</h3>
                  </div>
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                    <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">${stats.pendingRevenue.toFixed(2)} pending</p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <h3 className="text-3xl font-bold mt-2 text-green-600">${stats.totalRevenue.toFixed(2)}</h3>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600 dark:text-green-400">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>From completed orders</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Order Value</p>
                    <h3 className="text-3xl font-bold mt-2 text-purple-600">${stats.averageOrderValue.toFixed(2)}</h3>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Per order average</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 dark:border-red-700/50 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID, customer name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full lg:w-auto">
              {/* Status Filter */}
              <div className="flex-1 lg:flex-none">
                <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        All Orders ({stats.total})
                      </div>
                    </SelectItem>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        Pending ({stats.pending})
                      </div>
                    </SelectItem>
                    <SelectItem value="processing">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-500" />
                        Processing ({stats.processing})
                      </div>
                    </SelectItem>
                    <SelectItem value="shipped">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-purple-500" />
                        Shipped ({stats.shipped})
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Completed ({stats.completed})
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        Cancelled ({stats.cancelled})
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center border rounded-lg bg-muted/50">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === 'table' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('table')}
                          className="rounded-r-none"
                        >
                          <List className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Table View</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === 'grid' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('grid')}
                          className="rounded-l-none"
                        >
                          <Grid3X3 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Grid View</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {/* Refresh Button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          loadOrders();
                          loadTrackingData();
                          loadWalletBalance();
                        }}
                        disabled={loading}
                      >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh Data</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Display */}
      {loading || partnerLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">Loading your orders...</p>
          </CardContent>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {searchTerm 
                ? `No orders matching "${searchTerm}"`
                : filter !== 'all'
                ? `No ${filter} orders at the moment`
                : "You don't have any orders yet. When customers purchase your products, they'll appear here."
              }
            </p>
            <div className="flex gap-3">
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Clear Search
                </Button>
              )}
              <Link to="/partner/products/add">
                <Button>
                  <Package className="w-4 h-4 mr-2" />
                  Add Products
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        /* Enhanced Table View */
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Orders</CardTitle>
                <CardDescription>
                  {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)} orders ({filteredOrders.length})
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-sm">
                Updated in real-time
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-4 font-semibold text-sm uppercase tracking-wider">Order</th>
                    <th className="text-left p-4 font-semibold text-sm uppercase tracking-wider">Customer</th>
                    <th className="text-left p-4 font-semibold text-sm uppercase tracking-wider">Amount</th>
                    <th className="text-left p-4 font-semibold text-sm uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 font-semibold text-sm uppercase tracking-wider">Tracking</th>
                    <th className="text-left p-4 font-semibold text-sm uppercase tracking-wider">Date</th>
                    <th className="text-left p-4 font-semibold text-sm uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/20 transition-colors group">
                      <td className="p-4">
                        <div>
                          <div className="font-mono font-semibold text-sm">
                            {order.order_number || `ORD-${order.id.slice(0, 8).toUpperCase()}`}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {order.order_items?.length || 0} item(s)
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">
                            {order.user?.full_name || 'Customer'}
                          </div>
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {order.user?.email}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-lg">
                          ${order.total_amount?.toFixed(2) || '0.00'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <OrderStatusBadge status={order.status} size="sm" />
                        </div>
                      </td>
                      <td className="p-4">
                        <OrderTrackingBadge 
                          tracking={trackingData[order.order_number] || null} 
                          orderId={order.order_number}
                          showStatus
                        />
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="text-sm font-medium">
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {order.status === 'pending' && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    onClick={() => handleProcessOrder(order)}
                                    className="bg-green-600 hover:bg-green-700 shadow-sm"
                                  >
                                    <Wallet className="w-3 h-3 mr-2" />
                                    Pay
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Process payment for this order</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewOrderDetails(order)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View order details</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <OrderActionsDropdown
                            order={order}
                            currentUser={user}
                            onProcessOrder={handleProcessOrder}
                            onRefresh={loadOrders}
                            walletBalance={walletBalance}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Enhanced Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-all duration-200 hover:border-primary/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-sm font-semibold text-primary">
                      {order.order_number || `ORD-${order.id.slice(0, 8).toUpperCase()}`}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
              </CardHeader>
              
              <Separator />
              
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Customer</div>
                      <Badge variant="outline" className="text-xs">
                        {order.order_items?.length || 0} items
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <div className="font-semibold truncate">
                        {order.user?.full_name || 'Customer'}
                      </div>
                      <div className="text-muted-foreground truncate">
                        {order.user?.email}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Amount</div>
                      <div className="text-2xl font-bold">${order.total_amount?.toFixed(2)}</div>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Tracking Status</div>
                    <OrderTrackingBadge 
                      tracking={trackingData[order.order_number] || null} 
                      orderId={order.order_number}
                      compact
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleProcessOrder(order)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Wallet className="w-3 h-3 mr-2" />
                        Process Payment
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewOrderDetails(order)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    
                    <OrderActionsDropdown
                      order={order}
                      currentUser={user}
                      onProcessOrder={handleProcessOrder}
                      onRefresh={loadOrders}
                      walletBalance={walletBalance}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Footer */}
      {orders.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="font-semibold">{filteredOrders.length}</span> of{' '}
                  <span className="font-semibold">{orders.length}</span> orders displayed
                </div>
                {searchTerm && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchTerm('')}>
                    Search: "{searchTerm}" ✕
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={loadOrders}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Data
                </Button>
                <Link to="/partner/products/add">
                  <Button size="sm">
                    <Package className="w-4 h-4 mr-2" />
                    Add Products
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
              {['pending', 'processing', 'shipped', 'completed'].map((status) => {
                const count = stats[status as keyof typeof stats];
                const icon = getStatusIcon(status);
                return (
                  <div key={status} className="text-center">
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      {status}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}