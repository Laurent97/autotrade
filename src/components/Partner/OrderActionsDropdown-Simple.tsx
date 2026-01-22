import { useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import { 
  MoreVertical, 
  CheckCircle, 
  User, 
  Package, 
  Eye, 
  Download, 
  MessageSquare,
  XCircle,
  Truck,
  Loader2
} from 'lucide-react';

interface OrderActionsDropdownProps {
  order: any;
  currentUser: any;
  onOrderProcessed?: () => void;
}

export default function OrderActionsDropdownSimple({
  order,
  currentUser,
  onOrderProcessed
}: OrderActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  // 🔧 **1. PROCESS ORDER WITH WALLET VALIDATION**
  const handleProcessOrder = async () => {
    setLoading('processing');
    setError('');
    
    try {
      // 1. Get wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', currentUser.id)
        .single();

      if (walletError) {
        if (walletError.code === 'PGRST116') {
          throw new Error('Wallet not found. Please set up your wallet first.');
        }
        throw walletError;
      }

      // 2. Check balance
      if (wallet.balance < order.total_amount) {
        const needed = order.total_amount - wallet.balance;
        alert(`Insufficient balance!\n\nYou need: $${needed.toFixed(2)}\nYour balance: $${wallet.balance.toFixed(2)}\n\nRedirecting to Wallet page...`);
        window.location.href = '/partner/dashboard/wallet/deposit';
        return;
      }

      // 3. Confirm payment
      const confirm = window.confirm(
        `Process Order #${order.order_number}?\n\nAmount: $${order.total_amount}\nWallet: $${wallet.balance.toFixed(2)}\n\nThis will deduct $${order.total_amount} from your wallet.` 
      );
      if (!confirm) return;

      // 4. Update order status (SIMPLE VERSION - NO COMPLEX JOINS)
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'processing',
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // 5. Deduct from wallet
      const { error: updateError } = await supabase
        .from('wallet_balances')
        .update({ 
          balance: wallet.balance - order.total_amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', currentUser.id);

      if (updateError) throw updateError;

      // 6. Create wallet transaction record
      await supabase
        .from('wallet_transactions')
        .insert([{
          user_id: currentUser.id,
          amount: -order.total_amount,
          type: 'order_payment',
          description: `Payment for Order #${order.order_number}`,
          order_id: order.id,
          status: 'completed',
          created_at: new Date().toISOString()
        }]);

      alert(`✅ Order #${order.order_number} processed!\nStatus: Processing\nAmount: $${order.total_amount} deducted from wallet.`);
      
      if (onOrderProcessed) onOrderProcessed();

    } catch (err) {
      console.error('Process order error:', err);
      setError(err instanceof Error ? err.message : 'Payment processing failed');
      alert(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading('');
      setIsOpen(false);
    }
  };

  // 👤 **2. VIEW CUSTOMER INFO (SIMPLE VERSION)**
  const handleViewCustomer = async () => {
    setLoading('customer');
    
    try {
      const { data: customer, error } = await supabase
        .from('users')
        .select('id, email, full_name, phone, created_at')
        .eq('id', order.customer_id)
        .single();

      if (error) throw error;

      alert(`👤 Customer Details:\n\nName: ${customer.full_name || 'N/A'}\nEmail: ${customer.email}\nPhone: ${customer.phone || 'N/A'}\nCustomer Since: ${new Date(customer.created_at).toLocaleDateString()}`);

    } catch (err) {
      console.error('Customer fetch error:', err);
      alert('Could not load customer details.');
    } finally {
      setLoading('');
      setIsOpen(false);
    }
  };

  // 🚚 **3. TRACK ORDER (SIMPLE VERSION)**
  const handleTrackOrder = async () => {
    setLoading('tracking');
    
    try {
      const { data: tracking, error } = await supabase
        .from('logistics_tracking')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (tracking && tracking.length > 0) {
        const trackingText = tracking.map(t => 
          `📅 ${new Date(t.created_at).toLocaleString()}\n📍 ${t.status}: ${t.location || ''}\n📝 ${t.notes || ''}` 
        ).join('\n\n');
        
        alert(`🚚 Tracking for Order #${order.order_number}\n\n${trackingText}`);
      } else {
        alert(`No tracking data available for Order #${order.order_number}\n\nCurrent Status: ${order.status}`);
      }

    } catch (err) {
      console.error('Tracking error:', err);
      alert('Tracking data unavailable.');
    } finally {
      setLoading('');
      setIsOpen(false);
    }
  };

  // 📋 **4. VIEW ORDER DETAILS (SIMPLE VERSION)**
  const handleViewDetails = async () => {
    setLoading('details');
    
    try {
      // Fetch order items separately to avoid join issues
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('id, quantity, unit_price, subtotal, product_id')
        .eq('order_id', order.id);

      if (itemsError) throw itemsError;

      // Fetch product details separately
      const productIds = orderItems?.map(item => item.product_id) || [];
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, make, sku, description')
        .in('id', productIds);

      if (productsError) throw productsError;

      // Combine the data
      const itemsWithProducts = orderItems?.map(item => {
        const product = products?.find(p => p.id === item.product_id);
        return {
          ...item,
          product: product || { make: 'Unknown Product', sku: '', description: '' }
        };
      }) || [];

      const itemsText = itemsWithProducts.map(item => 
        `• ${item.quantity}x ${item.product.make} ($${item.unit_price} each) = $${item.subtotal}` 
      ).join('\n') || 'No items found';

      alert(`📋 Order #${order.order_number}\n\n💰 Total: $${order.total_amount}\n📦 Status: ${order.status}\n🛍️ Items:\n${itemsText}\n\n👤 Customer: ${order.user?.full_name || 'N/A'}\n\n📧 Customer Email: ${order.user?.email}\n\n📞 Customer Since: ${new Date(order.created_at).toLocaleDateString()}`);
      alert('Could not load order details.');
    } catch (err) {
      console.error('Details error:', err);
      alert('Could not load order details.');
    } finally {
      setLoading('');
      setIsOpen(false);
    }
  };

  // 📥 **5. DOWNLOAD INVOICE (SIMPLE VERSION)**
  const handleDownloadInvoice = async () => {
    setLoading('invoice');
    
    try {
      const invoiceContent = `
        =================================
                  INVOICE
        =================================
        
        Invoice #: ${order.order_number}
        Date: ${new Date(order.created_at).toLocaleDateString()}
        Status: ${order.status}
        Payment: ${order.payment_status}
        
        ---------------------------------
        BILL TO:
        ---------------------------------
        ${order.user?.full_name || 'Customer'}
        ${order.user?.email || ''}
        
        ---------------------------------
        ORDER ITEMS:
        ---------------------------------
        ${order.order_items?.map(item => 
          `${item.quantity}x Product ID: ${item.product_id} 
          @ $${item.unit_price} each = $${item.subtotal}`
        ).join('\n') || 'No items'}
        
        ---------------------------------
        TOTAL: $${order.total_amount}
        =================================
        
        Thank you for your business!
        Generated: ${new Date().toLocaleString()}
      `;

      const blob = new Blob([invoiceContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${order.order_number}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`Invoice for Order #${order.order_number} downloaded!`);

    } catch (err) {
      console.error('Invoice error:', err);
      alert('Could not generate invoice.');
    } finally {
      setLoading('');
      setIsOpen(false);
    }
  };

  // ✉️ **6. CONTACT CUSTOMER (SIMPLE VERSION)**
  const handleContactCustomer = async () => {
    setLoading('contact');
    
    try {
      const { data: customer, error } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', order.customer_id)
        .single();

      if (error) throw error;

      if (customer.email) {
        const subject = `Update on your Order #${order.order_number}`;
        const body = `Dear ${customer.full_name || 'Customer'},

This is regarding your Order #${order.order_number} placed on ${new Date(order.created_at).toLocaleDateString()}.

Order Status: ${order.status}
Order Total: $${order.total_amount}

Please let us know if you have any questions.

Best regards,
Your Store Team`;

        window.open(`mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
        alert(`Email client opened for ${customer.email}`);
      } else {
        alert('Customer email not available.');
      }

    } catch (err) {
      console.error('Contact error:', err);
      alert('Could not contact customer.');
    } finally {
      setLoading('');
      setIsOpen(false);
    }
  };

  // ❌ **7. CANCEL ORDER (SIMPLE VERSION)**
  const handleCancelOrder = async () => {
    if (order.status !== 'pending') {
      alert('Only pending orders can be cancelled.');
      return;
    }

    const reason = prompt('Please enter cancellation reason:');
    if (!reason) return;

    const confirmCancel = window.confirm(
      `Cancel Order #${order.order_number}?\n\nReason: ${reason}\n\nThis cannot be undone.` 
    );
    
    if (!confirmCancel) return;

    setLoading('cancelling');
    
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateError) throw updateError;

      alert(`✅ Order #${order.order_number} cancelled successfully.`);

      if (onOrderProcessed) onOrderProcessed();

    } catch (err) {
      console.error('Cancellation error:', err);
      alert(`❌ Error cancelling order: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading('');
      setIsOpen(false);
    }
  };

  // 🚚 **8. MARK AS SHIPPED (SIMPLE VERSION)**
  const handleMarkShipped = async () => {
    if (order.status !== 'processing') {
      alert('Only processing orders can be marked as shipped.');
      return;
    }

    const trackingNumber = prompt('Enter tracking number (optional):');
    const carrier = prompt('Enter carrier name:') || 'Standard Shipping';

    setLoading('shipping');
    
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'shipped',
          shipped_at: new Date().toISOString(),
          tracking_number: trackingNumber,
          carrier: carrier,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateError) throw updateError;

      await supabase
        .from('logistics_tracking')
        .insert([{
          order_id: order.id,
          status: 'shipped',
          location: 'Dispatch Center',
          notes: `Shipped via ${carrier}${trackingNumber ? `, Tracking: ${trackingNumber}` : ''}`,
          created_at: new Date().toISOString()
        }]);

      alert(`✅ Order #${order.order_number} marked as shipped!`);

      if (onOrderProcessed) onOrderProcessed();

    } catch (err) {
      console.error('Shipping error:', err);
      alert(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading('');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center p-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
        disabled={!!loading}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MoreVertical className="w-4 h-4" />
        )}
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute right-0 z-20 mt-2 w-64 origin-top-right bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700">
            <div className="py-2">
              {/* Process Order */}
              <button
                onClick={handleProcessOrder}
                disabled={order.status !== 'pending' || !!loading}
                className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4 mr-3 text-green-600" />
                {loading === 'processing' ? 'Processing...' : 'Process Order'}
              </button>

              {/* Mark as Shipped */}
              {order.status === 'processing' && (
                <button
                  onClick={handleMarkShipped}
                  disabled={!!loading}
                  className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Truck className="w-4 h-4 mr-3 text-blue-600" />
                  {loading === 'shipping' ? 'Updating...' : 'Mark as Shipped'}
                </button>
              )}

              {/* Customer Info */}
              <button
                onClick={handleViewCustomer}
                disabled={!!loading}
                className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <User className="w-4 h-4 mr-3 text-indigo-600" />
                {loading === 'customer' ? 'Loading...' : 'View Customer'}
              </button>

              {/* Track Order */}
              <button
                onClick={handleTrackOrder}
                disabled={!!loading}
                className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Package className="w-4 h-4 mr-3 text-purple-600" />
                {loading === 'tracking' ? 'Loading...' : 'Track Order'}
              </button>

              {/* Order Details */}
              <button
                onClick={handleViewDetails}
                disabled={!!loading}
                className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Eye className="w-4 h-4 mr-3 text-gray-600" />
                {loading === 'details' ? 'Loading...' : 'View Details'}
              </button>

              {/* Download Invoice */}
              <button
                onClick={handleDownloadInvoice}
                disabled={!!loading}
                className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Download className="w-4 h-4 mr-3 text-orange-600" />
                {loading === 'invoice' ? 'Generating...' : 'Download Invoice'}
              </button>

              {/* Contact Customer */}
              <button
                onClick={handleContactCustomer}
                disabled={!!loading}
                className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <MessageSquare className="w-4 h-4 mr-3 text-teal-600" />
                {loading === 'contact' ? 'Loading...' : 'Contact Customer'}
              </button>

              {/* Cancel Order */}
              {order.status === 'pending' && (
                <>
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                  <button
                    onClick={handleCancelOrder}
                    disabled={!!loading}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <XCircle className="w-4 h-4 mr-3 text-red-600" />
                    {loading === 'cancelling' ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                </>
              )}

              {error && (
                <div className="px-4 py-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20">
                  {error}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
