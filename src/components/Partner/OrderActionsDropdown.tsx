import { useState } from 'react';
import { 
  MoreVertical, 
  CheckCircle, 
  User, 
  Package, 
  Eye, 
  Download, 
  MessageSquare,
  Loader2
} from 'lucide-react';

interface OrderActionsDropdownProps {
  order: any;
  currentUser: any;
  onProcessOrder: (order: any) => void;
  onRefresh: () => void;
  walletBalance: number;
}

export default function OrderActionsDropdown({
  order,
  currentUser,
  onProcessOrder,
  onRefresh,
  walletBalance
}: OrderActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState('');

  // 🔧 **1. PROCESS ORDER WITH WALLET VALIDATION**
  const handleProcessOrder = async () => {
    setLoading('processing');
    setIsOpen(false);
    
    try {
      // Check wallet balance
      if (walletBalance < order.total_amount) {
        const needed = order.total_amount - walletBalance;
        alert(`💰 Insufficient balance!\n\nYou need: $${needed.toFixed(2)}\nYour balance: $${walletBalance.toFixed(2)}\n\nRedirecting to Wallet page...`);
        window.location.href = '/partner/dashboard/wallet/deposit';
        return;
      }

      // Confirm payment
      const confirm = window.confirm(
        `💳 Process Order #${order.order_number || order.id.slice(0, 8)}?\n\n` +
        `Amount: $${order.total_amount}\n` +
        `Your balance: $${walletBalance.toFixed(2)}\n\n` +
        `This will deduct $${order.total_amount} from your wallet.` 
      );
      if (!confirm) return;

      // Process the order
      onProcessOrder(order);
      alert(`✅ Order #${order.order_number || order.id} processed successfully!\nStatus: Processing\nAmount: $${order.total_amount} deducted from wallet.`);

    } catch (err) {
      console.error('💥 Process order error:', err);
      alert(`❌ Error: ${err instanceof Error ? err.message : 'Payment processing failed'}`);
    } finally {
      setLoading('');
    }
  };

  // 👤 **2. VIEW CUSTOMER INFO**
  const handleViewCustomer = () => {
    setLoading('customer');
    setIsOpen(false);
    
    const customerInfo = `
      👤 Customer Information
      ==================
      
      Name: ${order.user?.full_name || 'N/A'}
      Email: ${order.user?.email || 'N/A'}
      Customer ID: ${order.customer_id}
      
      Order Details:
      Order #: ${order.order_number || order.id.slice(0, 8)}
      Total: $${order.total_amount?.toFixed(2)}
      Status: ${order.status?.toUpperCase()}
      Date: ${new Date(order.created_at).toLocaleDateString()}
      
      Items: ${order.order_items?.length || 0}
      ${order.order_items?.map((item, idx) => 
        `${idx + 1}. ${item.quantity}x ${item.product?.title || item.product?.make || 'Product'} - $${item.unit_price} each`
      ).join('\n') || 'No items'}
    `;
    
    alert(customerInfo);
    setLoading('');
  };

  // 🚚 **3. TRACK ORDER**
  const handleTrackOrder = () => {
    setLoading('tracking');
    setIsOpen(false);
    
    const trackingInfo = `
      🚚 Order Tracking
      ==================
      
      Order #: ${order.order_number || order.id.slice(0, 8)}
      Current Status: ${order.status?.toUpperCase()}
      
      Tracking Information:
      - Status: ${order.status}
      - Last Updated: ${new Date(order.updated_at).toLocaleString()}
      
      ${order.tracking_number ? `Tracking Number: ${order.tracking_number}` : ''}
      ${order.carrier ? `Carrier: ${order.carrier}` : ''}
      
      Customer: ${order.user?.full_name || 'N/A'}
      Email: ${order.user?.email || 'N/A'}
    `;
    
    alert(trackingInfo);
    setLoading('');
  };

  // 📋 **4. VIEW ORDER DETAILS**
  const handleViewDetails = () => {
    setLoading('details');
    setIsOpen(false);
    
    const itemsText = order.order_items?.map((item, idx) => 
      `${idx + 1}. ${item.quantity}x ${item.product?.title || item.product?.make || 'Product'} 
         @ $${item.unit_price} each = $${item.subtotal}` 
    ).join('\n') || 'No items';

    const details = `
      📋 Order Details
      ==================
      
      Order #: ${order.order_number || order.id.slice(0, 8)}
      Date: ${new Date(order.created_at).toLocaleDateString()}
      Status: ${order.status?.toUpperCase()}
      Payment: ${order.payment_status?.toUpperCase()}
      
      Total Amount: $${order.total_amount?.toFixed(2)}
      
      👤 Customer:
      Name: ${order.user?.full_name || 'N/A'}
      Email: ${order.user?.email || 'N/A'}
      
      📦 Items:
      ${itemsText}
      
      📍 Shipping:
      ${order.shipping_address || 'Not specified'}
      
      💳 Billing:
      ${order.billing_address || 'Same as shipping'}
      
      Generated: ${new Date().toLocaleString()}
    `;
    
    alert(details);
    setLoading('');
  };

  // 📥 **5. DOWNLOAD INVOICE**
  const handleDownloadInvoice = () => {
    setLoading('invoice');
    setIsOpen(false);
    
    const invoiceContent = `
      =================================
                INVOICE
      =================================
      
      Invoice #: ${order.order_number || order.id.slice(0, 8)}
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
        `${item.quantity}x ${item.product?.title || item.product?.make || 'Product ID: ' + item.product_id} 
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
    a.download = `invoice-${order.order_number || order.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`📥 Invoice for Order #${order.order_number || order.id} downloaded!`);
    setLoading('');
  };

  // ✉️ **6. CONTACT CUSTOMER**
  const handleContactCustomer = () => {
    setLoading('contact');
    setIsOpen(false);
    
    if (order.user?.email) {
      const subject = `Update on your Order #${order.order_number || order.id}`;
      const body = `Dear ${order.user?.full_name || 'Customer'},

This is regarding your Order #${order.order_number || order.id} placed on ${new Date(order.created_at).toLocaleDateString()}.

Order Status: ${order.status}
Order Total: $${order.total_amount}

Please let us know if you have any questions.

Best regards,
Your Store Team`;

      window.open(`mailto:${order.user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
      alert(`📧 Email client opened for ${order.user.email}`);
    } else {
      alert('❌ Customer email not available.');
    }
    setLoading('');
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
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
            <div className="py-1">
              {/* Only show Process Order for pending orders */}
              {order.status === 'pending' && (
                <button
                  onClick={handleProcessOrder}
                  disabled={loading === 'processing'}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === 'processing' ? (
                    <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-3 text-green-600" />
                  )}
                  Process Order
                </button>
              )}
              
                            
              {/* Informational actions available for all statuses */}
              <button
                onClick={handleViewCustomer}
                disabled={loading === 'customer'}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'customer' ? (
                  <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                ) : (
                  <User className="w-4 h-4 mr-3 text-blue-600" />
                )}
                View Customer
              </button>
              
              <button
                onClick={handleTrackOrder}
                disabled={loading === 'tracking'}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'tracking' ? (
                  <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                ) : (
                  <Package className="w-4 h-4 mr-3 text-purple-600" />
                )}
                Track Order
              </button>
              
              <button
                onClick={handleViewDetails}
                disabled={loading === 'details'}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'details' ? (
                  <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4 mr-3 text-gray-600" />
                )}
                View Details
              </button>
              
              <button
                onClick={handleDownloadInvoice}
                disabled={loading === 'invoice'}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'invoice' ? (
                  <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-3 text-orange-600" />
                )}
                Download Invoice
              </button>
              
              <button
                onClick={handleContactCustomer}
                disabled={loading === 'contact'}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'contact' ? (
                  <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4 mr-3 text-teal-600" />
                )}
                Contact Customer
              </button>
              
              {/* Admin note for non-pending orders */}
              {order.status !== 'pending' && (
                <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                  ℹ️ Order management (cancellation, shipping, completion) handled by admin
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
