import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { orderService } from '../lib/supabase/order-service';
import PaymentMethodSelector from '../components/Payment/PaymentMethodSelector';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowLeft, Package } from 'lucide-react';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, clearCart } = useCart();
  
  const [orderId, setOrderId] = useState<string>();
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    // Redirect if cart is empty
    if (items.length === 0) {
      navigate('/cart');
      return;
    }

    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    setAmount(total);

    // Get order ID from location state or generate
    const stateOrderId = location.state?.orderId || `ORD-${Date.now()}`;
    setOrderId(stateOrderId);
    
    // Debug: Check if we have shipping address from checkout
    console.log('=== PAYMENT PAGE MOUNT DEBUG ===');
    console.log('Location pathname:', location.pathname);
    console.log('Location state:', location.state);
    console.log('Has shipping address:', !!location.state?.shippingAddress);
    console.log('User came from checkout:', document.referrer.includes('/checkout'));
    
    // If no shipping address, redirect to checkout
    if (!location.state?.shippingAddress) {
      console.log('No shipping address found, redirecting to checkout...');
      
      // Show a message to the user
      if (items.length > 0) {
        alert('Please complete the checkout process first. You will be redirected to the checkout page to enter your shipping information.');
      }
      
      navigate('/checkout');
      return;
    }
  }, [items, location.state, navigate]);

  const handlePaymentSuccess = async (paymentData?: any) => {
    try {
      console.log('=== PAYMENT SUCCESS - CREATING ORDER ===');
      console.log('Payment data received:', paymentData);
      console.log('Order ID:', orderId);
      console.log('User:', user);
      console.log('Cart items:', items);
      
      // Create the actual order in the database
      if (!user || !orderId) {
        throw new Error('User or order ID missing');
      }

      // Prepare shipping address from checkout state
      const shippingAddress = location.state?.shippingAddress;
      if (!shippingAddress) {
        throw new Error('Shipping address missing');
      }

      // Prepare order items
      const orderItems = items.map(item => ({
        product_id: item.product.id,
        partner_product_id: item.partner_product?.id || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      // Create order data
      const orderData = {
        customer_id: user.id,
        items: orderItems,
        shipping_address: shippingAddress,
        billing_address: shippingAddress,
        payment_method: paymentData?.method || 'unknown',
        notes: `Payment completed via ${paymentData?.method || 'unknown'}`,
      };

      console.log('Creating order with data:', orderData);

      // Create the order
      const { data: order, error } = await orderService.createOrder(orderData);

      console.log('Order creation result:', { data: order, error });

      if (error) {
        console.error('Order creation failed:', error);
        throw error;
      }

      if (!order) {
        console.error('Order creation returned null data');
        throw new Error('Order creation failed: No order data returned');
      }

      console.log('Order created successfully:', {
        id: order.id,
        order_number: order.order_number,
        customer_id: order.customer_id,
        total_amount: order.total_amount
      });

      // Clear cart and redirect to success page
      clearCart();
      navigate('/order-success', {
        state: {
          orderId: order.order_number,
          orderData: order,
          paymentData,
        },
      });

    } catch (error) {
      console.error('Payment success handler failed:', error);
      alert(`Order creation failed: ${error.message}`);
      // Still redirect to success page with the generated order ID
      navigate('/order-success', {
        state: {
          orderId: orderId,
          message: 'Payment submitted successfully. Your order will be processed after verification.',
        },
      });
    }
  };

  const handlePaymentError = (error: string) => {
    alert(`Payment failed: ${error}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between max-w-md mx-auto">
                {['Cart', 'Checkout', 'Payment', 'Complete'].map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      ${index < 2 ? 'bg-green-600 text-white' : 
                        index === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}
                    `}>
                      {index < 2 ? '✓' : index + 1}
                    </div>
                    <span className={`
                      ml-2 text-sm ${index === 2 ? 'font-semibold text-blue-600' : 'text-gray-600'}
                    `}>
                      {step}
                    </span>
                    {index < 3 && (
                      <div className={`
                        w-16 h-0.5 mx-4 ${index < 2 ? 'bg-green-600' : 'bg-gray-300'}
                      `} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Payment Options */}
              <div className="lg:col-span-2">
                <h1 className="text-3xl font-bold mb-6 text-foreground">Payment</h1>
                
                {!user ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-6">
                    <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                      Login Required
                    </h3>
                    <p className="text-yellow-700 dark:text-yellow-400 mb-4">
                      Please login or create an account to continue with payment.
                    </p>
                    <button
                      onClick={() => navigate('/auth', { state: { from: location.pathname } })}
                      className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700"
                    >
                      Sign In to Continue
                    </button>
                  </div>
                ) : (
                  <PaymentMethodSelector
                    orderId={orderId || ''}
                    amount={amount}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                )}
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-background dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg shadow-lg p-6 sticky top-6">
                  <h2 className="text-xl font-bold mb-4 text-foreground">Order Summary</h2>
                  
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.product.id} className="flex justify-between items-center border-b border-border dark:border-gray-700 pb-4">
                        <div>
                          <h4 className="font-medium text-foreground">{item.product.title}</h4>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            ${(item.subtotal || (item.unit_price * item.quantity)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">${amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-green-600 dark:text-green-400">Free</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="text-foreground">${(amount * 0.1).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-border dark:border-gray-700 pt-3">
                      <div className="flex justify-between text-lg font-bold text-foreground">
                        <span>Total</span>
                        <span className="text-foreground">${(amount * 1.1).toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Including ${(amount * 0.1).toFixed(2)} VAT</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={() => navigate('/cart')}
                      className="w-full text-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 py-2"
                    >
                      ← Back to Cart
                    </button>
                  </div>
                </div>

                {/* Security Badges */}
                <div className="mt-6 bg-background dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-3 text-foreground">Secure Payment</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-2">
                        <span className="text-green-600 dark:text-green-400">✓</span>
                      </div>
                      <span className="text-sm text-foreground">SSL Secure</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-2">
                        <span className="text-blue-600 dark:text-blue-400">🔒</span>
                      </div>
                      <span className="text-sm text-foreground">256-bit Encrypted</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mr-2">
                        <span className="text-purple-600 dark:text-purple-400">✓</span>
                      </div>
                      <span className="text-sm text-foreground">PCI DSS Compliant</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mr-2">
                        <span className="text-yellow-600 dark:text-yellow-400">🛡️</span>
                      </div>
                      <span className="text-sm text-foreground">Fraud Protected</span>
                    </div>
                  </div>
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
