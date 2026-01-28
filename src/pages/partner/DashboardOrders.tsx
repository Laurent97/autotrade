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
  ArrowDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DashboardOrders() {
  const { user, userProfile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [trackingData, setTrackingData] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
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
      // Use the same wallet service method as the wallet dashboard
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
      const { data: ordersData } = await partnerService.getPartnerOrders(partnerProfile.id);
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
      const { error } = await partnerService.updateOrderStatus(
        orderId,
        newStatus as 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'
      );
      
      if (error) throw error;
      
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error('Failed to update order:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order');
    }
  };

  // Action handlers for OrderActionsDropdown
  const handleProcessOrder = async (order: any) => {
    if (!user?.id) {
      alert('Authentication required. Please log in again.');
      return;
    }
    
    // Confirm before processing
    const confirmPayment = window.confirm(
      `Process payment for Order #${order.order_number || order.id}?\n\nAmount: $${order.total_amount?.toFixed(2) || '0.00'}\n\nThis will deduct the amount from your wallet balance.`
    );
    
    if (!confirmPayment) return;
    
    try {
      console.log('Processing payment for order:', order.id);
      const { success, error, message } = await partnerService.processOrderPayment(order.id, user.id);
      
      if (error) {
        console.error('Payment processing failed:', error);
        alert(`❌ Payment Failed: ${error}`);
        return;
      }
      
      console.log('Payment processed successfully');
      alert('✅ Payment processed successfully! Order status updated to "Waiting Confirmation".');
      
      // Refresh data
      await loadOrders();
      await loadWalletBalance();
    } catch (err) {
      console.error('Unexpected error processing payment:', err);
      alert('❌ An unexpected error occurred. Please try again or contact support.');
    }
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

  // Calculate statistics
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    pendingRevenue: orders.filter(o => o.status === 'pending').reduce((sum, o) => sum + (o.total_amount || 0), 0),
    averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / orders.length : 0
  };

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Orders Management</h1>
          <p className="text-muted-foreground">Manage and track all your customer orders in real-time</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Modern Wallet Balance Card */}
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-800/50 rounded-lg">
                  <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                    {walletLoading ? 'Loading...' : `$${walletBalance.toFixed(2)}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <ThemeSwitcher />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">${stats.pendingRevenue.toFixed(2)} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${stats.averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per order average</p>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 dark:border-red-700/50 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search Bar */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders by ID, customer name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Status Filter */}
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders ({stats.total})</SelectItem>
                  <SelectItem value="pending">Pending ({stats.pending})</SelectItem>
                  <SelectItem value="processing">Processing ({stats.processing})</SelectItem>
                  <SelectItem value="shipped">Shipped ({stats.shipped})</SelectItem>
                  <SelectItem value="completed">Completed ({stats.completed})</SelectItem>
                  <SelectItem value="cancelled">Cancelled ({stats.cancelled})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="rounded-r-none"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadOrders();
                  loadTrackingData();
                }}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Orders Display */}
      {loading || partnerLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </CardContent>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2">No {filter === 'all' ? '' : filter} orders found</h3>
            <p className="text-muted-foreground mb-6">Orders will appear here when customers make purchases</p>
            <Link to="/partner/products/add">
              <Button>
                <Package className="w-4 h-4 mr-2" />
                Add Products
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        /* Modern Table View */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Order ID</th>
                    <th className="text-left p-4 font-medium">Customer</th>
                    <th className="text-left p-4 font-medium">Amount</th>
                    <th className="text-left p-4 font-medium">Items</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Tracking</th>
                    <th className="text-left p-4 font-medium">Date</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="font-mono text-sm">
                          {order.order_number || order.id.slice(0, 8)}...
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">
                            {order.user?.full_name || order.user?.email || 'Customer'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.user?.email}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">
                          ${order.total_amount?.toFixed(2)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {order.order_items?.length || 0} item(s)
                          </div>
                          {order.order_items?.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="text-xs text-muted-foreground">
                              • {item.quantity}x {item.product?.make || item.product?.title || 'Product'}
                            </div>
                          ))}
                          {order.order_items && order.order_items.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{order.order_items.length - 2} more
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <OrderStatusBadge status={order.status} size="sm" />
                      </td>
                      <td className="p-4">
                        <OrderTrackingBadge 
                          tracking={trackingData[order.order_number] || null} 
                          orderId={order.order_number}
                        />
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleProcessOrder(order)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Wallet className="w-3 h-3 mr-1" />
                              Pay
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // TODO: Add order details modal
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
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
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="font-mono text-sm text-muted-foreground">
                    {order.order_number || order.id.slice(0, 8)}...
                  </div>
                  <OrderStatusBadge status={order.status} size="sm" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="font-medium">
                      {order.user?.full_name || order.user?.email || 'Customer'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.user?.email}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-2xl font-bold">${order.total_amount?.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.order_items?.length || 0} items
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div>
                    <OrderTrackingBadge 
                      tracking={trackingData[order.order_number] || null} 
                      orderId={order.order_number}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleProcessOrder(order)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Wallet className="w-3 h-3 mr-1" />
                        Pay Order
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // TODO: Add order details modal
                      }}
                    >
                      <Eye className="w-4 h-4" />
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

      {/* Modern Summary Footer */}
      {orders.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{filteredOrders.length}</span> of{' '}
                <span className="font-medium">{orders.length}</span> orders
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={loadOrders}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Link to="/partner/products/add">
                  <Button>
                    <Package className="w-4 h-4 mr-2" />
                    Add Products
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
