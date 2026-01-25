import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { orderService } from '../lib/supabase/order-service';
import { supabase } from '../lib/supabase/client';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, Package, MapPin, CreditCard, User, Calendar, DollarSign, Truck, Clock, CheckCircle } from 'lucide-react';

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

    console.log('=== ORDER LOOKUP DEBUG ===');
    console.log('Loading order with ID:', orderId);
    console.log('User logged in:', user ? 'Yes' : 'No');
    console.log('User ID:', user?.id);
    console.log('User email:', user?.email);
    
    setLoading(true);
    setError(null);
    
    try {
      let data, error;
      
      // Check if orderId is a UUID or order number
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId);
      console.log('Is UUID:', isUUID);
      
      // First, let's check if there are any orders at all
      console.log('Checking if any orders exist in database...');
      const { data: allOrders, error: allOrdersError } = await supabase
        .from('orders')
        .select('id, order_number, customer_id, created_at')
        .limit(5);
      
      console.log('All orders check:', { allOrders, allOrdersError });
      
      if (allOrders && allOrders.length > 0) {
        console.log('Found orders:', allOrders.map(o => ({ id: o.id, order_number: o.order_number })));
      }
      
      if (isUUID) {
        // Try to get by UUID
        console.log('Detected UUID, fetching order by ID...');
        const result = await orderService.getOrderById(orderId);
        data = result.data;
        error = result.error;
        
        console.log('UUID lookup result:', { data, error });
      } else {
        // Try to get by order number
        console.log('Detected order number, fetching by order number...');
        const result = await orderService.getOrderByNumber(orderId);
        data = result.data;
        error = result.error;
        
        console.log('Order number lookup result:', { data, error });
        console.log('Data type:', typeof data);
        console.log('Error type:', typeof error);
        console.log('Data keys:', data ? Object.keys(data) : 'null');
        console.log('Error keys:', error ? Object.keys(error) : 'null');
        
        if (error) {
          console.log('Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
        }
        
        // If order number lookup fails, try to find orders with similar order numbers
        if (error && allOrders) {
          console.log('Trying to find similar order numbers...');
          const similarOrders = allOrders.filter(o => 
            o.order_number && o.order_number.includes(orderId.split('-')[1])
          );
          console.log('Similar orders found:', similarOrders);
          
          // Also try exact match without the random suffix
          const exactMatch = allOrders.find(o => 
            o.order_number === orderId
          );
          console.log('Exact match found:', exactMatch);
          
          // If we found an exact match, use it
          if (exactMatch) {
            console.log('Found exact match, using this order:', exactMatch);
            data = exactMatch;
            error = null;
          }
        }
        
        // If still no match, try to find orders that start with the same timestamp
        if (error && allOrders && orderId.startsWith('ORD-')) {
          console.log('Trying to find orders with same timestamp...');
          const timestamp = orderId.split('-')[1];
          const timestampMatches = allOrders.filter(o => 
            o.order_number && o.order_number.startsWith(`ORD-${timestamp}`)
          );
          console.log('Timestamp matches found:', timestampMatches);
          
          if (timestampMatches.length > 0) {
            console.log('Using first timestamp match:', timestampMatches[0]);
            data = timestampMatches[0];
            error = null;
          }
        }
      }
      
      // Enhanced error handling
      if (error) {
        console.error('Order lookup failed:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // Provide more specific error messages
        let errorMessage = 'Order not found';
        if (error.code === 'PGRST116') {
          errorMessage = 'Order not found: The order does not exist in the database';
        } else if (error.code === '42703') {
          errorMessage = 'Database error: Column does not exist. Check database schema.';
        } else if (error.code === '42501') {
          errorMessage = 'Permission denied: You do not have access to view this order';
        } else if (error.message) {
          errorMessage = `Order lookup failed: ${error.message}`;
        }
        
        // Check if orders table exists
        console.log('Checking if orders table exists...');
        const { data: tableInfo, error: tableError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', 'orders')
          .single();
        
        console.log('Orders table check:', { tableInfo, tableError });
        
        throw new Error(errorMessage);
      }
      
      if (!data) {
        console.log('No order found with identifier:', orderId);
        console.log('This could mean:');
        console.log('1. The order does not exist in the database');
        console.log('2. The order number/ID is incorrect');
        console.log('3. There might be a database schema issue');
        console.log('4. The order exists but user lacks permission to view it');
        
        // Check if this is a common order number format issue
        if (orderId.startsWith('ORD-') && orderId.length === 16) {
          console.log('Note: This appears to be an old format order number (16 chars)');
          console.log('Current format is: ORD-timestamp-randomstring');
        }
        
        throw new Error('Order not found');
      }
      
      console.log('Order loaded successfully:', data);
      console.log('Order details:', {
        id: data.id,
        order_number: data.order_number,
        customer_id: data.customer_id,
        status: data.status,
        total_amount: data.total_amount,
        created_at: data.created_at
      });
      
      // Check if user is authorized to view this order
      if (!user) {
        console.log('User not logged in, redirecting to auth');
        // Redirect to auth with return URL
        navigate('/auth', { state: { from: `/orders/${orderId}` } });
        return;
      }
      
      console.log('Authorization check:');
      console.log('Order customer_id:', data.customer_id);
      console.log('Current user ID:', user.id);
      console.log('Match:', data.customer_id === user.id);
      
      if (data.customer_id !== user.id) {
        console.log('Authorization check failed:', { 
          orderCustomerId: data.customer_id, 
          currentUserId: user.id 
        });
        throw new Error('You are not authorized to view this order');
      }
      
      console.log('=== ORDER LOOKUP SUCCESS ===');
      console.log('Full order data:', data);
      console.log('Shipping address:', data.shipping_address);
      console.log('Shipping address TYPE:', typeof data.shipping_address);
      console.log('Shipping address KEYS:', data.shipping_address ? Object.keys(data.shipping_address) : 'NULL');
      console.log('Shipping address fields:', {
        full_name: data.shipping_address?.full_name,
        address_line1: data.shipping_address?.address_line1,
        city: data.shipping_address?.city,
        state: data.shipping_address?.state,
        postal_code: data.shipping_address?.postal_code,
        country: data.shipping_address?.country,
        phone: data.shipping_address?.phone,
      });
      
      // Also log what the display will show
      if (data.shipping_address) {
        console.log('WHAT WILL BE DISPLAYED:');
        console.log('Name:', data.shipping_address.full_name);
        console.log('Address 1:', data.shipping_address.address_line1);
        console.log('City:', data.shipping_address.city);
        console.log('State:', data.shipping_address.state);
        console.log('Postal:', data.shipping_address.postal_code);
        console.log('Country:', data.shipping_address.country);
        console.log('Phone:', data.shipping_address.phone);
      }
      
      setOrder(data);
    } catch (err) {
      console.error('=== ORDER LOOKUP FAILED ===');
      console.error('Error loading order:', err);
      console.error('Error type:', err.constructor.name);
      console.error('Error message:', err.message);
      
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

          {/* Order Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {order.order_number}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <OrderStatusBadge status={order.status} />
              </div>
            </div>

            {/* Order Timeline */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Status</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    order.status === 'pending' || order.status === 'waiting_confirmation' || order.status === 'processing' || order.status === 'shipped' || order.status === 'completed'
                      ? 'bg-green-100 dark:bg-green-900/30' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <CheckCircle className={`w-4 h-4 ${
                      order.status === 'pending' || order.status === 'waiting_confirmation' || order.status === 'processing' || order.status === 'shipped' || order.status === 'completed'
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900 dark:text-white">Order Placed</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {(order.status === 'waiting_confirmation' || order.status === 'processing' || order.status === 'shipped' || order.status === 'completed') && (
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      order.status === 'waiting_confirmation' || order.status === 'processing' || order.status === 'shipped' || order.status === 'completed'
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <Clock className={`w-4 h-4 ${
                        order.status === 'waiting_confirmation' || order.status === 'processing' || order.status === 'shipped' || order.status === 'completed'
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900 dark:text-white">Payment Confirmed</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {order.payment_status === 'paid' ? 'Payment received' : 'Waiting for payment'}
                      </p>
                    </div>
                  </div>
                )}

                {(order.status === 'processing' || order.status === 'shipped' || order.status === 'completed') && (
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      order.status === 'processing' || order.status === 'shipped' || order.status === 'completed'
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <Package className={`w-4 h-4 ${
                        order.status === 'processing' || order.status === 'shipped' || order.status === 'completed'
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900 dark:text-white">Order Processing</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Your order is being prepared for shipment
                      </p>
                    </div>
                  </div>
                )}

                {(order.status === 'shipped' || order.status === 'completed') && (
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      order.status === 'shipped' || order.status === 'completed'
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <Truck className={`w-4 h-4 ${
                        order.status === 'shipped' || order.status === 'completed'
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900 dark:text-white">Order Shipped</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {order.tracking_number ? `Tracking: ${order.tracking_number}` : 'Waiting for tracking number'}
                      </p>
                    </div>
                  </div>
                )}

                {order.status === 'completed' && (
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900 dark:text-white">Order Delivered</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Order has been successfully delivered
                      </p>
                    </div>
                  </div>
                )}

                {order.status === 'cancelled' && (
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-red-600 dark:text-red-400">Order Cancelled</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {order.cancellation_reason || 'Order was cancelled'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Order Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Order Items ({order.order_items?.length || 0})
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
                          {item.product?.make && item.product?.model && `${item.product.make} ${item.product.model}`}
                        </p>
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
                
                {/* Debug: Log what we're about to render */}
                {(() => {
                  console.log('=== RENDER DEBUG ===');
                  console.log('Order object:', order);
                  console.log('Shipping address in render:', order.shipping_address);
                  console.log('Has shipping address:', !!order.shipping_address);
                  if (order.shipping_address) {
                    console.log('Shipping address keys:', Object.keys(order.shipping_address));
                    console.log('Full name field:', order.shipping_address.full_name);
                    console.log('Address line1 field:', order.shipping_address.address_line1);
                  }
                  return null;
                })()}
                
                {order.shipping_address ? (
                  <div className="text-gray-700 dark:text-gray-300">
                    <p className="font-medium">{order.shipping_address.full_name || 'No name'}</p>
                    <p>{order.shipping_address.address_line1 || 'No address line 1'}</p>
                    {order.shipping_address.address_line2 && (
                      <p>{order.shipping_address.address_line2}</p>
                    )}
                    <p>
                      {order.shipping_address.city || 'No city'}, {order.shipping_address.state || 'No state'} {order.shipping_address.postal_code || 'No postal code'}
                    </p>
                    <p>{order.shipping_address.country || 'No country'}</p>
                    <p className="mt-2">Phone: {order.shipping_address.phone || 'No phone'}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Shipping information not available</p>
                )}
              </div>

              {/* Customer Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Customer Information
                </h3>
                <div className="text-gray-700 dark:text-gray-300">
                  <p className="font-medium">{order.user?.full_name || 'Customer'}</p>
                  <p className="text-sm">{order.user?.email}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Customer ID: {order.customer_id}
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
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
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Tax</span>
                    <span className="text-gray-900 dark:text-white">
                      ${(order.total_amount * 0.1).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                      <span className="font-bold text-lg text-gray-900 dark:text-white">
                        ${(order.total_amount * 1.1).toFixed(2)}
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
                    <span className={`font-medium capitalize ${
                      order.payment_status === 'paid' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      {order.payment_status}
                    </span>
                  </div>
                  {order.payment_status === 'paid' && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        ✓ Payment successfully processed
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tracking Information */}
              {order.tracking_number && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Truck className="w-5 h-5 mr-2" />
                    Tracking Information
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Tracking Number:
                    </p>
                    <p className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                      {order.tracking_number}
                    </p>
                    <button
                      onClick={() => window.open(`https://www.fedex.com/fedextrack/?trknbr=${order.tracking_number}`, '_blank')}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Track Package →
                    </button>
                  </div>
                </div>
              )}

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
