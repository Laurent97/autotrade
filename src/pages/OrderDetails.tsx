import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { orderService } from '../lib/supabase/order-service';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, Package, MapPin, CreditCard, User, Calendar, DollarSign } from 'lucide-react';

export default function OrderDetails() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('Order ID is required');
      setLoading(false);
      return;
    }

    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    if (!orderId) {
      setError('Order ID is required');
      setLoading(false);
      return;
    }

    console.log('Loading order with ID:', orderId);
    setLoading(true);
    setError(null);
    
    try {
      let data, error;
      
      // First try to get by ID
      console.log('Trying to fetch order by ID...');
      const result = await orderService.getOrderById(orderId);
      data = result.data;
      error = result.error;
      
      console.log('ID lookup result:', { data, error });
      
      // If not found by ID, try by order number
      if (error && (error.code === 'PGRST116' || error.message?.includes('No rows found'))) {
        console.log('Order not found by ID, trying by order number...');
        const numberResult = await orderService.getOrderByNumber(orderId);
        data = numberResult.data;
        error = numberResult.error;
        
        console.log('Order number lookup result:', { data, error });
      }
      
      if (error) {
        console.error('Order lookup failed:', error);
        throw new Error(`Order not found: ${error.message || 'Unknown error'}`);
      }
      
      if (!data) {
        throw new Error('Order not found');
      }
      
      console.log('Order loaded successfully:', data);
      
      // Check if user is authorized to view this order
      if (!user) {
        console.log('User not logged in, redirecting to auth');
        // Redirect to auth with return URL
        navigate('/auth', { state: { from: `/orders/${orderId}` } });
        return;
      }
      
      if (data.customer_id !== user.id) {
        console.log('Authorization check failed:', { 
          orderCustomerId: data.customer_id, 
          currentUserId: user.id 
        });
        throw new Error('You are not authorized to view this order');
      }
      
      setOrder(data);
    } catch (err) {
      console.error('Error loading order:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load order';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
              <h2 className="text-xl font-semibold text-red-800 dark:text-red-300 mb-2">
                Error Loading Order
              </h2>
              <p className="text-red-600 dark:text-red-400 mb-4 text-sm">{error}</p>
              <p className="text-red-500 dark:text-red-400 text-xs mb-4">
                Order ID: {orderId}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => loadOrder()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
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
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Order Details
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Order Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Status Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {order.order_number}
                  </h2>
                  <OrderStatusBadge status={order.status} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Order Date:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Total Amount:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      ${order.total_amount?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Order Items
                </h3>
                <div className="space-y-4">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex items-center space-x-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      {item.product?.images?.[0] && (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-grow">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {item.product?.title || 'Product'}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Quantity: {item.quantity} × ${item.unit_price?.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          ${(item.unit_price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Shipping Information
                </h3>
                {order.shipping_address && (
                  <div className="text-gray-700 dark:text-gray-300">
                    <p className="font-medium">{order.shipping_address.full_name}</p>
                    <p>{order.shipping_address.address_line_1}</p>
                    {order.shipping_address.address_line_2 && (
                      <p>{order.shipping_address.address_line_2}</p>
                    )}
                    <p>
                      {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                    </p>
                    <p>{order.shipping_address.country}</p>
                    <p className="mt-2">Phone: {order.shipping_address.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Order Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                    <span className="text-gray-900 dark:text-white">
                      ${order.total_amount?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Shipping</span>
                    <span className="text-green-600 dark:text-green-400">Free</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                      <span className="font-bold text-lg text-gray-900 dark:text-white">
                        ${order.total_amount?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Method:</span>
                    <span className="text-gray-900 dark:text-white capitalize">
                      {order.payment_method || 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Status:</span>
                    <span className="text-gray-900 dark:text-white capitalize">
                      {order.payment_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/contact')}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Contact Support
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
