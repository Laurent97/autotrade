import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { orderService } from '../lib/supabase/order-service';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Package, 
  Calendar, 
  DollarSign, 
  Eye, 
  Filter,
  ChevronDown,
  Search,
  Truck,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function MyOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth', { state: { from: '/my-orders' } });
      return;
    }
    loadOrders();
  }, [user, navigate]);

  const loadOrders = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await orderService.getCustomerOrders(user.id);
      
      if (error) {
        throw error;
      }
      
      setOrders(data || []);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedOrders = orders
    .filter(order => {
      // Filter by status
      if (filter !== 'all' && order.status !== filter) return false;
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          order.order_number?.toLowerCase().includes(searchLower) ||
          order.order_items?.some((item: any) => 
            item.product?.title?.toLowerCase().includes(searchLower) ||
            item.product?.make?.toLowerCase().includes(searchLower) ||
            item.product?.model?.toLowerCase().includes(searchLower)
          )
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by selected criteria
      switch (sortBy) {
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'amount':
          return (b.total_amount || 0) - (a.total_amount || 0);
        case 'status':
          return a.status?.localeCompare(b.status || '');
        default:
          return 0;
      }
    });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'waiting_confirmation': return <Clock className="w-4 h-4 text-orange-600" />;
      case 'processing': return <Package className="w-4 h-4 text-blue-600" />;
      case 'shipped': return <Truck className="w-4 h-4 text-purple-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Package className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusCount = (status: string) => {
    return orders.filter(order => order.status === status).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow bg-background flex items-center justify-center">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
              <h2 className="text-xl font-semibold text-red-800 dark:text-red-300 mb-2">
                Error Loading Orders
              </h2>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={loadOrders}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mr-3"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Back to Home
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-background py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              My Orders
            </h1>
            <p className="text-muted-foreground">
              View and track all your orders
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-card rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{orders.length}</div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
            </div>
            <div className="bg-card rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{getStatusCount('pending')}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="bg-card rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{getStatusCount('processing')}</div>
              <div className="text-sm text-muted-foreground">Processing</div>
            </div>
            <div className="bg-card rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{getStatusCount('shipped')}</div>
              <div className="text-sm text-muted-foreground">Shipped</div>
            </div>
            <div className="bg-card rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{getStatusCount('completed')}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="bg-card rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{getStatusCount('cancelled')}</div>
              <div className="text-sm text-muted-foreground">Cancelled</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-card rounded-lg shadow p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by order number or product name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-foreground"
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="lg:w-48">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  aria-label="Sort orders by"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-foreground"
                >
                  <option value="date">Sort by Date</option>
                  <option value="amount">Sort by Amount</option>
                  <option value="status">Sort by Status</option>
                </select>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:w-auto px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === 'all' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    All ({orders.length})
                  </button>
                  {['pending', 'waiting_confirmation', 'processing', 'shipped', 'completed', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilter(status as any)}
                      className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                        filter === status 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {status} ({getStatusCount(status)})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Orders List */}
          {filteredAndSortedOrders.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg shadow">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchTerm || filter !== 'all' ? 'No matching orders found' : 'No orders yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Start shopping to see your orders here'
                }
              </p>
              {!searchTerm && filter === 'all' && (
                <button
                  onClick={() => navigate('/products')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Start Shopping
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedOrders.map((order) => (
                <div key={order.id} className="bg-card rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(order.status)}
                          <h3 className="text-lg font-semibold text-foreground">
                            {order.order_number}
                          </h3>
                          <OrderStatusBadge status={order.status} size="sm" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 mt-4 lg:mt-0">
                        <div className="text-right">
                          <div className="text-lg font-bold text-foreground">
                            ${order.total_amount?.toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.order_items?.length || 0} items
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/orders/${order.order_number || order.id}`)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="flex flex-wrap gap-4">
                        {order.order_items?.slice(0, 3).map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3">
                            {item.product?.images?.[0] && (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.title}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {item.product?.title || 'Product'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Qty: {item.quantity} × ${item.unit_price?.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {order.order_items && order.order_items.length > 3 && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            +{order.order_items.length - 3} more items
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tracking Info */}
                    {order.tracking_number && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm text-blue-700 dark:text-blue-300">
                            Tracking: {order.tracking_number}
                          </span>
                          <button
                            onClick={() => window.open(`https://www.fedex.com/fedextrack/?trknbr=${order.tracking_number}`, '_blank')}
                            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 ml-auto"
                          >
                            Track →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
