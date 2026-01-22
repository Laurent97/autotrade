import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase/client';
import { Order, PartnerProfile, OrderStatus, PaymentStatus } from '../../lib/types/database';
import { NotificationService } from '../../lib/supabase/notification-service';
import { adminService } from '../../lib/supabase/admin-service';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { CancelOrderButton } from '../../components/CancelOrderButton';
import { useOrderRealtime } from '../../hooks/useOrderRealtime';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/Admin/AdminSidebar';

interface LogisticsForm {
  shipping_provider: string;
  tracking_number: string;
  estimated_delivery: string;
  current_status: string;
}

interface OrderWithDetails extends Order {
  customer?: {
    id: string;
    email: string;
    full_name?: string;
  };
  partner?: PartnerProfile;
  logistics?: any;
}

interface PartnerProduct {
  id: string;
  partner_id: string;
  selling_price: number;
  product?: {
    id: string;
    title: string;
    sku: string;
    original_price: number;
    images: string[];
    make: string;
    model: string;
    category: string;
    stock_quantity: number;
  };
}

export default function AdminOrders() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all' | 'active'>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showLogisticsModal, setShowLogisticsModal] = useState(false);
  const [logisticsForm, setLogisticsForm] = useState<LogisticsForm>({
    shipping_provider: '',
    tracking_number: '',
    estimated_delivery: '',
    current_status: 'processing'
  });
  const [orderDetails, setOrderDetails] = useState<OrderWithDetails | null>(null);
  const [partners, setPartners] = useState<PartnerProfile[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customer_email: '',
    customer_name: '',
    partner_id: '',
    product_id: '',
    quantity: 1,
    unit_price: 0,
    shipping_address: {
      address: '',
      city: '',
      country: '',
      phone: ''
    }
  });
  const [partnerProducts, setPartnerProducts] = useState<PartnerProduct[]>([]);
  const [loadingPartnerProducts, setLoadingPartnerProducts] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.user_type !== 'admin') {
      navigate('/');
      return;
    }

    loadOrders();
    loadPartners();
  }, [userProfile, navigate]);

  // Realtime subscription for order updates
  useOrderRealtime({
    enabled: userProfile?.user_type === 'admin',
    onOrderUpdate: (payload) => {
      // Update specific order in state
      setOrders(prev => prev.map(order => 
        order.id === payload.new.id 
          ? { ...order, ...payload.new }
          : order
      ));

      // Update order details if modal is open
      if (orderDetails?.id === payload.new.id) {
        setOrderDetails(prev => prev ? { ...prev, ...payload.new } : null);
      }
    },
    onOrderInsert: (payload) => {
      // Add new order to beginning of list
      setOrders(prev => [payload.new, ...prev]);
    },
    onOrderDelete: (payload) => {
      // Remove order from state
      setOrders(prev => prev.filter(order => order.id !== payload.old.id));
      
      // Close modal if deleted order was being viewed
      if (orderDetails?.id === payload.old.id) {
        setShowOrderModal(false);
        setSelectedOrder(null);
        setOrderDetails(null);
      }
    }
  });

  const loadOrders = async () => {
    console.log('🔄 Loading orders...');
    console.log('📊 Current filter status:', filterStatus);
    console.log('🔍 Current search term:', searchTerm);
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('📊 Orders loaded from database:', data?.length || 0, 'orders');
      console.log('📋 Order statuses:', data?.map(o => ({ id: o.id, status: o.status, number: o.order_number })) || []);
      
      setOrders(data || []);
      console.log('✅ Orders state updated with', data?.length || 0, 'orders');
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      console.log('🔄 Loading completed');
    }
  };

  const loadPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partner_profiles')
        .select('id, store_name, user_id')
        .eq('partner_status', 'approved');

      if (error) throw error;
      
      setPartners(data || []);
    } catch (error) {
      console.error('Error loading partners:', error);
    }
  };

  const loadOrderDetails = async (orderId: string) => {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      // Load customer info
      const { data: customer } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', order.customer_id)
        .single();

      // Load partner info if assigned
      let partner = null;
      if (order.partner_id) {
        const { data: partnerData } = await supabase
          .from('partner_profiles')
          .select('store_name')
          .eq('id', order.partner_id)
          .single();
        partner = partnerData;
      }

      // Load logistics info
      const { data: logistics } = await supabase
        .from('logistics_tracking')
        .select('*')
        .eq('order_id', orderId)
        .single();

      setOrderDetails({
        ...order,
        customer,
        partner,
        logistics
      });
    } catch (error) {
      console.error('Error loading order details:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const result = await adminService.updateOrderStatus(orderId, status);
      
      if (result.error) {
        throw result.error;
      }
      
      loadOrders();
      if (orderDetails?.id === orderId) {
        loadOrderDetails(orderId);
      }
      alert(`Order status updated to ${status}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const loadPartnerProducts = async (partnerId: string) => {
    console.log('Loading products for partner profile:', partnerId);
    
    if (!partnerId) {
      setPartnerProducts([]);
      return;
    }

    setLoadingPartnerProducts(true);

    try {
      // First get user_id for this partner profile
      const { data: partnerProfile, error: profileError } = await supabase
        .from('partner_profiles')
        .select('user_id')
        .eq('id', partnerId)
        .single();

      if (profileError) {
        console.error('Error getting partner profile:', profileError);
        setPartnerProducts([]);
        return;
      }

      if (!partnerProfile?.user_id) {
        console.error('No user_id found for partner profile:', partnerId);
        setPartnerProducts([]);
        return;
      }

      console.log('Found user_id:', partnerProfile.user_id);

      // Now query partner products using user_id
      const { data, error } = await supabase
        .from('partner_products')
        .select(`
          *,
          product:products (
            id,
            title,
            sku,
            original_price,
            images,
            make,
            model,
            category,
            stock_quantity
          )
        `)
        .eq('partner_id', partnerProfile.user_id) // Use user_id instead of partner_profile_id
        .eq('is_active', true);

      console.log('Partner products data:', data);
      console.log('Partner products error:', error);

      if (error) throw error;
      
      setPartnerProducts(data || []);
      console.log('Set partner products to:', data || []);
    } catch (error) {
      console.error('Error loading partner products:', error);
      setPartnerProducts([]);
    } finally {
      setLoadingPartnerProducts(false);
    }
  };

  const createNewOrder = async () => {
    if (!newOrder.customer_email || !newOrder.partner_id || !newOrder.product_id || newOrder.unit_price <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Get the selected partner product
      const selectedProduct = partnerProducts.find(p => p.id === newOrder.product_id);
      if (!selectedProduct) {
        alert('Selected product not found');
        return;
      }

      // First, get or create customer using improved function
      let customerId: string;
      const { data: existingCustomer, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('email', newOrder.customer_email)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching user:', fetchError);
      }

      if (existingCustomer) {
        customerId = existingCustomer.id;
        console.log('✅ Found existing customer ID:', customerId);
      } else {
        // Create new user using the working function
        const { data: newUser, error: userError } = await supabase.rpc('get_or_create_user_simple', {
          user_email: newOrder.customer_email,
          user_full_name: newOrder.customer_name
        });

        if (userError) {
          console.error('User creation error:', userError);
          // Fallback: try direct insert
          const { data: fallbackUser, error: fallbackError } = await supabase
            .from('users')
            .insert({
              email: newOrder.customer_email,
              full_name: newOrder.customer_name,
              created_at: new Date().toISOString()
            })
            .select('id')
            .single();
          
          if (fallbackError) {
            console.error('Fallback user creation failed:', fallbackError);
            throw new Error('Failed to create user: ' + fallbackError.message);
          }
          
          customerId = fallbackUser.id;
        } else {
          customerId = newUser;
        }
        
        console.log('✅ Created new customer with ID:', customerId);
      }

      // Generate order number
      const orderNumber = 'ORD-' + Date.now().toString().slice(-8);
      
      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: customerId,
          partner_id: newOrder.partner_id,
          total_amount: newOrder.quantity * newOrder.unit_price,
          status: 'confirmed',
          shipping_address: newOrder.shipping_address,
          payment_status: 'pending',
          notes: `Created by admin for ${newOrder.customer_name}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: selectedProduct.product?.id || newOrder.product_id,
          partner_product_id: newOrder.product_id,
          quantity: newOrder.quantity,
          unit_price: newOrder.unit_price,
          created_at: new Date().toISOString()
        });

      if (itemError) throw itemError;

      // Send notification to partner
      await NotificationService.notifyOrderAssigned(order.id, newOrder.partner_id);

      setShowCreateOrderModal(false);
      setNewOrder({
        customer_email: '',
        customer_name: '',
        partner_id: '',
        product_id: '',
        quantity: 1,
        unit_price: 0,
        shipping_address: {
          address: '',
          city: '',
          country: '',
          phone: ''
        }
      });
      setPartnerProducts([]);
      
      loadOrders();
      alert('Order created and assigned to partner successfully!');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order');
    }
  };

  const assignToPartner = async (orderId: string, partnerId: string) => {
    if (!partnerId) {
      alert('Please select a partner');
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          partner_id: partnerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Send notification to partner
      await NotificationService.notifyOrderAssigned(orderId, partnerId);

      setShowAssignModal(false);
      setSelectedPartner('');
      loadOrders();
      if (orderDetails?.id === orderId) {
        loadOrderDetails(orderId);
      }
      alert('Order assigned to partner successfully!');
    } catch (error) {
      console.error('Error assigning order:', error);
      alert('Failed to assign order to partner');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const orderToCancel = orders.find(order => order.id === orderId);
    if (!orderToCancel) return;

    const reason = prompt('Please enter cancellation reason:');
    if (!reason) return;

    const confirmCancel = window.confirm(
      `❌ Cancel Order #${orderToCancel.order_number || orderId}?\n\nReason: ${reason}\nAmount: $${orderToCancel.total_amount}\n\nThis will refund the partner if payment was made.`
    );
    
    if (!confirmCancel) return;

    // Optimistic update - update UI immediately
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            status: 'cancelled',
            cancellation_reason: reason,
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        : order
    ));

    // Show loading state on the button
    setCancellingOrderId(orderId);
    
    try {
      const result = await adminService.cancelOrder(orderId, reason, true);
      
      if (!result.success) {
        // Revert optimistic update on error
        setOrders(prev => prev.map(order => 
          order.id === orderId 
            ? orderToCancel  // Restore original order
            : order
        ));
        
        alert(`❌ Error: ${result.error}`);
      } else {
        alert(`✅ Order #${orderToCancel.order_number || orderId} cancelled successfully!\nReason: ${reason}`);
        
        // Refresh to get complete updated data
        loadOrders();
        if (orderDetails?.id === orderId) {
          loadOrderDetails(orderId);
        }
      }
    } catch (error) {
      // Revert optimistic update
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? orderToCancel
          : order
      ));
      
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleDeleteOrder = async (order: OrderWithDetails) => {
    const confirmDelete = window.confirm(
      `🗑️ DELETE Order #${order.order_number || order.id}?\n\nThis will permanently delete:\n- Order details\n- All order items\n- Logistics tracking\n\nThis action CANNOT be undone!`
    );
    
    if (!confirmDelete) return;
    
    try {
      console.log('🗑️ Frontend: Starting delete for order:', order.id);
      const result = await adminService.deleteOrder(order.id);
      
      console.log('📊 Delete result:', result);
      
      if (result.success) {
        alert(`✅ Order #${order.order_number || order.id} deleted permanently`);
        console.log('🔄 Frontend: Reloading orders...');
        
        // Force a small delay to ensure database consistency
        setTimeout(() => {
          loadOrders();
          if (showOrderModal) {
            setShowOrderModal(false);
            setSelectedOrder(null);
            setOrderDetails(null);
          }
        }, 500);
      } else {
        console.error('❌ Frontend: Delete failed:', result.error);
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('💥 Frontend: Error in handleDeleteOrder:', error);
      alert('Failed to delete order');
    }
  };

  const handleMarkAsShipped = async (order: OrderWithDetails) => {
    const trackingNumber = prompt('Enter tracking number:');
    if (!trackingNumber) return;

    const carrier = prompt('Enter carrier name:') || 'Standard Shipping';
    
    try {
      const result = await adminService.markOrderAsShipped(order.id, trackingNumber, carrier);
      
      if (result.success) {
        alert(`✅ Order #${order.order_number || order.id} marked as shipped!\nTracking: ${trackingNumber}\nCarrier: ${carrier}`);
        loadOrders();
        if (orderDetails?.id === order.id) {
          loadOrderDetails(order.id);
        }
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error marking order as shipped:', error);
      alert('Failed to mark order as shipped');
    }
  };

  const handleCompleteOrder = async (order: OrderWithDetails) => {
    const confirmComplete = window.confirm(
      `✅ Complete Order #${order.order_number || order.id}?\n\nThis will mark the order as delivered and finalize the transaction.`
    );
    
    if (!confirmComplete) return;
    
    try {
      const result = await adminService.completeOrder(order.id);
      
      if (result.success) {
        alert(`✅ Order #${order.order_number || order.id} marked as completed!`);
        loadOrders();
        if (orderDetails?.id === order.id) {
          loadOrderDetails(order.id);
        }
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error completing order:', error);
      alert('Failed to complete order');
    }
  };

  const saveLogisticsInfo = async () => {
    if (!selectedOrder) return;

    if (!logisticsForm.shipping_provider || !logisticsForm.tracking_number) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('logistics_tracking')
        .upsert({
          order_id: selectedOrder.id,
          shipping_provider: logisticsForm.shipping_provider,
          tracking_number: logisticsForm.tracking_number,
          estimated_delivery: logisticsForm.estimated_delivery,
          current_status: logisticsForm.current_status,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'order_id'
        });

      if (error) throw error;

      // Update order status to shipped
      await supabase
        .from('orders')
        .update({
          status: 'shipped',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id);

      setShowLogisticsModal(false);
      loadOrders();
      if (orderDetails?.id === selectedOrder.id) {
        loadOrderDetails(selectedOrder.id);
      }
      alert('Logistics information saved and order marked as shipped');
    } catch (error) {
      console.error('Error saving logistics:', error);
      alert('Failed to save logistics information');
    }
  };

  const openOrderModal = async (order: Order) => {
    const orderWithDetails = order as OrderWithDetails;
    setSelectedOrder(orderWithDetails);
    await loadOrderDetails(order.id);
    setShowOrderModal(true);
  };

  const openLogisticsModal = (order: Order) => {
    const orderWithDetails = order as OrderWithDetails;
    setSelectedOrder(orderWithDetails);
    if (orderDetails?.logistics) {
      setLogisticsForm({
        shipping_provider: orderDetails.logistics.shipping_provider || '',
        tracking_number: orderDetails.logistics.tracking_number || '',
        estimated_delivery: orderDetails.logistics.estimated_delivery || '',
        current_status: orderDetails.logistics.current_status || 'processing'
      });
    } else {
      setLogisticsForm({
        shipping_provider: '',
        tracking_number: '',
        estimated_delivery: '',
        current_status: 'processing'
      });
    }
    setShowLogisticsModal(true);
  };

  const filteredOrders = (orders || []).filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      filterStatus === 'active' ? !['cancelled', 'completed'].includes(order.status) : 
      order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'processing':
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'waiting_confirmation': return 'bg-orange-100 text-orange-800';
      case 'pending':
      case 'confirmed': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-grow">
        <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            <AdminSidebar />
            
            <div className="flex-grow min-w-0">
              {/* Welcome Header */}
              <div className="mb-6 sm:mb-8 lg:mb-10 animate-fade-in">
                <div className="bg-gradient-to-r from-primary to-primary/90 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-primary-foreground shadow-lg">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Order Management</h1>
                  <p className="text-primary-foreground/90 text-base sm:text-lg">Manage orders and assign to partners</p>
                  <p className="text-primary-foreground/70 mt-1 text-xs sm:text-sm">Track, process, and fulfill customer orders efficiently</p>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-card rounded-xl sm:rounded-2xl shadow-md border border-border p-4 sm:p-6 mb-4 sm:mb-6 animate-fade-in hover:shadow-lg transition-shadow">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      🔍 Search Orders
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by order number..."
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      📋 Filter by Status
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as OrderStatus | 'all' | 'active')}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground transition-all"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active Only</option>
                      <option value="pending">Pending</option>
                      <option value="waiting_confirmation">Waiting Confirmation</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end space-x-3">
                    <button
                      onClick={() => setShowCreateOrderModal(true)}
                      className="bg-gradient-to-r from-success to-success/90 text-white px-4 py-2 rounded-lg hover:from-success/90 hover:to-success transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      ➕ Create New Order
                    </button>
                    <button
                      onClick={loadOrders}
                      className="bg-gradient-to-r from-primary to-primary/90 text-white px-4 py-2 rounded-lg hover:from-primary/90 hover:to-primary transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      🔄 Refresh Orders
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-card rounded-2xl shadow-md border border-border p-6 animate-fade-in hover:shadow-lg transition-shadow hover:scale-105 transform">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 rounded-xl">
                      <span className="text-2xl">📦</span>
                    </div>
                    <div className="text-blue-600 dark:text-blue-400 text-sm font-semibold">Total</div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">Total Orders</div>
                  <div className="text-3xl font-bold text-foreground">{(orders || []).length}</div>
                </div>
                
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-2xl shadow-md border border-primary/20 p-6 animate-fade-in hover:shadow-lg transition-shadow hover:scale-105 transform">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gradient-to-br from-primary/30 to-primary/20 dark:from-primary/40 dark:to-primary/30 p-3 rounded-xl">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="text-primary text-sm font-semibold">Revenue</div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">Total Revenue</div>
                  <div className="text-3xl font-bold text-foreground">
                    ${(orders || []).reduce((sum, o) => sum + o.total_amount, 0).toLocaleString()}
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-warning/10 to-warning/5 dark:from-warning/20 dark:to-warning/10 rounded-2xl shadow-md border border-warning/20 p-6 animate-fade-in hover:shadow-lg transition-shadow hover:scale-105 transform">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gradient-to-br from-warning/30 to-warning/20 dark:from-warning/40 dark:to-warning/30 p-3 rounded-xl">
                      <span className="text-2xl">⏳</span>
                    </div>
                    <div className="text-warning text-sm font-semibold">Pending</div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">Pending Orders</div>
                  <div className="text-3xl font-bold text-foreground">
                    {(orders || []).filter(o => o.status === 'pending').length}
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl shadow-md border border-blue-200 dark:border-blue-800/30 p-6 animate-fade-in hover:shadow-lg transition-shadow hover:scale-105 transform">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gradient-to-br from-blue-200 to-blue-300 dark:from-blue-800/40 dark:to-blue-700/40 p-3 rounded-xl">
                      <span className="text-2xl">🚚</span>
                    </div>
                    <div className="text-blue-600 dark:text-blue-400 text-sm font-semibold">Shipping</div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">Awaiting Shipment</div>
                  <div className="text-3xl font-bold text-foreground">
                    {(orders || []).filter(o => o.status === 'confirmed' || o.status === 'processing').length}
                  </div>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-card rounded-2xl shadow-md border border-border overflow-hidden animate-fade-in hover:shadow-lg transition-shadow">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading orders...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="p-8 text-center">
                    <span className="text-4xl mb-4 block">📦</span>
                    <p className="text-muted-foreground">No orders found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-gradient-to-r from-card to-card/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            📦 Order #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            💰 Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            📊 Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            💳 Payment
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            📅 Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            ⚡ Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-primary/5 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-foreground flex items-center gap-2">
                                <span className="text-primary">📦</span>
                                {order.order_number}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-lg font-bold text-primary">
                                ${order.total_amount.toFixed(2)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <OrderStatusBadge status={order.status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                order.payment_status === 'paid' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {order.payment_status === 'paid' ? '💳 ' : '⏰ '}
                                {order.payment_status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex flex-col space-y-2">
                                <button
                                  onClick={() => openOrderModal(order)}
                                  className="text-primary hover:text-primary/80 text-left font-medium flex items-center gap-1 transition-colors"
                                >
                                  👁️ View Details
                                </button>
                                {!order.partner_id && (
                                  <button
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setShowAssignModal(true);
                                    }}
                                    className="text-success hover:text-success/80 text-left font-medium flex items-center gap-1 transition-colors"
                                  >
                                    🏪 Assign to Partner
                                  </button>
                                )}
                                {order.status === 'waiting_confirmation' && (
                                  <button
                                    onClick={() => updateOrderStatus(order.id, 'processing')}
                                    className="text-blue-600 hover:text-blue-800 text-left font-medium flex items-center gap-1 transition-colors"
                                  >
                                    ✅ Confirm Order
                                  </button>
                                )}
                                {order.status === 'processing' && (
                                  <button
                                    onClick={() => handleMarkAsShipped(order)}
                                    className="text-purple-600 hover:text-purple-800 text-left font-medium flex items-center gap-1 transition-colors"
                                  >
                                    🚚 Mark as Shipped
                                  </button>
                                )}
                                {order.status === 'shipped' && (
                                  <button
                                    onClick={() => handleCompleteOrder(order)}
                                    className="text-green-600 hover:text-green-800 text-left font-medium flex items-center gap-1 transition-colors"
                                  >
                                    ✅ Complete Order
                                  </button>
                                )}
                                <button
                                  onClick={() => openLogisticsModal(order)}
                                  className="text-blue-600 hover:text-blue-800 text-left font-medium flex items-center gap-1 transition-colors"
                                >
                                  📦 Update Shipping
                                </button>
                                <CancelOrderButton
                                  orderId={order.id}
                                  currentStatus={order.status}
                                  userRole="admin"
                                  onCancel={handleCancelOrder}
                                  size="sm"
                                />
                                <button
                                  onClick={() => handleDeleteOrder(order)}
                                  className="text-red-700 hover:text-red-900 text-left font-medium flex items-center gap-1 transition-colors"
                                >
                                  🗑️ Delete Order
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && orderDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Order: {orderDetails.order_number}
                  </h2>
                  <p className="text-muted-foreground">
                    Placed on {new Date(orderDetails.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-muted-foreground hover:text-foreground text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Customer Info */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    Customer Information
                  </h3>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div>
                      <div className="text-sm text-muted-foreground">Name</div>
                      <div className="font-medium text-foreground">{orderDetails.customer?.full_name || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium text-foreground">{orderDetails.customer?.email}</div>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    Shipping Address
                  </h3>
                  <div className="bg-muted p-4 rounded-lg">
                    {orderDetails.shipping_address ? (
                      <div className="space-y-1 text-sm text-foreground">
                        <div>{orderDetails.shipping_address.address}</div>
                        <div>{orderDetails.shipping_address.city}, {orderDetails.shipping_address.country}</div>
                        <div>Phone: {orderDetails.shipping_address.phone}</div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No shipping address provided</p>
                    )}
                  </div>
                </div>

                {/* Order Status */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    Order Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Current Status:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(orderDetails.status)}`}>
                        {orderDetails.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">
                        Update Status
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['pending', 'waiting_confirmation', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'].map((status) => (
                          <button
                            key={status}
                            onClick={() => updateOrderStatus(orderDetails.id, status)}
                            className={`px-3 py-1 rounded text-sm ${
                              orderDetails.status === status
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground hover:bg-muted/80'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Partner Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Partner Assignment
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {orderDetails.partner ? (
                      <div>
                        <div className="font-medium">{orderDetails.partner.store_name}</div>
                        <div className="text-sm text-gray-600">Assigned Partner</div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-yellow-600 mb-3 text-sm">Not assigned to any partner</p>
                        <button
                          onClick={() => setShowAssignModal(true)}
                          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 text-sm"
                        >
                          Assign to Partner
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Logistics Info */}
              {orderDetails.logistics && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Logistics Information
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Provider</div>
                        <div className="font-medium">{orderDetails.logistics.shipping_provider}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Tracking #</div>
                        <div className="font-medium text-sm">{orderDetails.logistics.tracking_number}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Status</div>
                        <div className="font-medium">{orderDetails.logistics.current_status}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Est. Delivery</div>
                        <div className="font-medium">
                          {orderDetails.logistics.estimated_delivery ? 
                            new Date(orderDetails.logistics.estimated_delivery).toLocaleDateString() : 
                            'Not set'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-6 border-t flex justify-end space-x-3">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => openLogisticsModal(selectedOrder)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Update Shipping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Partner Modal */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Assign Order to Partner
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Partner *
                  </label>
                  <select
                    value={selectedPartner}
                    onChange={(e) => setSelectedPartner(e.target.value)}
                    style={{ backgroundColor: 'white', color: '#111827', fontWeight: '500' }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Choose a partner...</option>
                    {partners.map((partner) => (
                      <option key={partner.id} value={partner.id}>
                        {partner.store_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedPartner('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => assignToPartner(selectedOrder.id, selectedPartner)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Assign Partner
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logistics Modal */}
      {showLogisticsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Update Logistics: {selectedOrder.order_number}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Provider *
                  </label>
                  <select
                    value={logisticsForm.shipping_provider}
                    onChange={(e) => setLogisticsForm({...logisticsForm, shipping_provider: e.target.value})}
                    style={{ backgroundColor: 'white', color: '#111827', fontWeight: '500' }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Provider</option>
                    <option value="DHL">DHL Express</option>
                    <option value="FedEx">FedEx</option>
                    <option value="UPS">UPS</option>
                    <option value="USPS">USPS</option>
                    <option value="TNT">TNT</option>
                    <option value="EMS">EMS</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking Number *
                  </label>
                  <input
                    type="text"
                    value={logisticsForm.tracking_number}
                    onChange={(e) => setLogisticsForm({...logisticsForm, tracking_number: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Delivery Date *
                  </label>
                  <input
                    type="date"
                    value={logisticsForm.estimated_delivery}
                    onChange={(e) => setLogisticsForm({...logisticsForm, estimated_delivery: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Status *
                  </label>
                  <select
                    value={logisticsForm.current_status}
                    onChange={(e) => setLogisticsForm({...logisticsForm, current_status: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="processing">Processing</option>
                    <option value="picked_up">Picked Up</option>
                    <option value="in_transit">In Transit</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="delayed">Delayed</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    onClick={() => setShowLogisticsModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveLogisticsInfo}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Save & Mark as Shipped
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New Order</h2>
                <button
                  onClick={() => setShowCreateOrderModal(false)}
                  className="text-gray-400 hover:text-gray-500 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Email *
                    </label>
                    <input
                      type="email"
                      value={newOrder.customer_email}
                      onChange={(e) => setNewOrder({...newOrder, customer_email: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="customer@example.com"
                      style={{ backgroundColor: 'white', color: '#111827', fontWeight: '500' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={newOrder.customer_name}
                      onChange={(e) => setNewOrder({...newOrder, customer_name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="John Doe"
                      style={{ backgroundColor: 'white', color: '#111827', fontWeight: '500' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Partner Shop *
                    </label>
                    <select
                      value={newOrder.partner_id}
                      onChange={(e) => {
                        const partnerId = e.target.value;
                        console.log('Partner selected:', partnerId);
                        setNewOrder({...newOrder, partner_id: partnerId, product_id: '', unit_price: 0});
                        loadPartnerProducts(partnerId);
                      }}
                      style={{ backgroundColor: 'white', color: '#111827', fontWeight: '500' }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select a partner shop...</option>
                      {partners.map((partner) => (
                        <option key={partner.id} value={partner.id}>
                          {partner.store_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product *
                    </label>
                    <select
                      value={newOrder.product_id}
                      onChange={(e) => {
                        const productId = e.target.value;
                        const selectedProduct = partnerProducts.find(p => p.id === productId);
                        setNewOrder({
                          ...newOrder, 
                          product_id: productId,
                          unit_price: selectedProduct?.selling_price || 0
                        });
                      }}
                      style={{ backgroundColor: 'white', color: '#111827', fontWeight: '500' }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      disabled={!newOrder.partner_id || loadingPartnerProducts}
                    >
                      <option value="">
                        {loadingPartnerProducts 
                          ? 'Loading products...' 
                          : newOrder.partner_id 
                            ? 'Select a product...' 
                            : 'Select a partner shop first'
                        }
                      </option>
                      {!loadingPartnerProducts && partnerProducts.map((partnerProduct) => (
                        <option key={partnerProduct.id} value={partnerProduct.id}>
                          {partnerProduct.product?.title || 'Unknown Product'} - ${partnerProduct.selling_price}
                        </option>
                      ))}
                    </select>
                    {newOrder.partner_id && !loadingPartnerProducts && partnerProducts.length === 0 && (
                      <p className="text-red-500 text-sm mt-1">
                        No products found for this partner shop
                      </p>
                    )}
                  </div>
                </div>

                {newOrder.product_id && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Selected Product Details</h4>
                    {(() => {
                      const selectedProduct = partnerProducts.find(p => p.id === newOrder.product_id);
                      const product = selectedProduct?.product;
                      return product ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">SKU:</span>
                            <span className="ml-2 font-medium">{product.sku}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Make/Model:</span>
                            <span className="ml-2 font-medium">{product.make} {product.model}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Category:</span>
                            <span className="ml-2 font-medium">{product.category}</span>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newOrder.quantity}
                      onChange={(e) => setNewOrder({...newOrder, quantity: parseInt(e.target.value) || 1})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      style={{ backgroundColor: 'white', color: '#111827', fontWeight: '500' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price ($) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newOrder.unit_price}
                      onChange={(e) => setNewOrder({...newOrder, unit_price: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      style={{ backgroundColor: 'white', color: '#111827', fontWeight: '500' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={newOrder.shipping_address.address}
                      onChange={(e) => setNewOrder({
                        ...newOrder, 
                        shipping_address: {...newOrder.shipping_address, address: e.target.value}
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="123 Main St"
                      style={{ backgroundColor: 'white', color: '#111827', fontWeight: '500' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={newOrder.shipping_address.phone}
                      onChange={(e) => setNewOrder({
                        ...newOrder, 
                        shipping_address: {...newOrder.shipping_address, phone: e.target.value}
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="+1234567890"
                      style={{ backgroundColor: 'white', color: '#111827', fontWeight: '500' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={newOrder.shipping_address.city}
                      onChange={(e) => setNewOrder({
                        ...newOrder, 
                        shipping_address: {...newOrder.shipping_address, city: e.target.value}
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="New York"
                      style={{ backgroundColor: 'white', color: '#111827', fontWeight: '500' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={newOrder.shipping_address.country}
                      onChange={(e) => setNewOrder({
                        ...newOrder, 
                        shipping_address: {...newOrder.shipping_address, country: e.target.value}
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="United States"
                      style={{ backgroundColor: 'white', color: '#111827', fontWeight: '500' }}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${(newOrder.quantity * newOrder.unit_price).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    onClick={() => setShowCreateOrderModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createNewOrder}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Create Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}