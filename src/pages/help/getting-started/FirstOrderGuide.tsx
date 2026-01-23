import HelpArticle from '@/components/help/HelpArticle';
import { ShoppingCart, Search, CreditCard, Package, CheckCircle, AlertCircle, Clock, MapPin } from 'lucide-react';

export default function FirstOrderGuide() {
  return (
    <HelpArticle
      title="First Order Guide"
      category="Getting Started"
      lastUpdated="January 23, 2026"
      readTime="8 minutes"
      difficulty="beginner"
    >
      <h2>Your First Order on AutoTradeHub</h2>
      <p>Welcome to AutoTradeHub! This comprehensive guide will walk you through placing your first order, from finding the perfect part to completing your purchase.</p>

      <h3>Before You Start</h3>
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Prerequisites
        </h4>
        <ul className="space-y-1 text-sm">
          <li>✓ Verified email address</li>
          <li>✓ Complete profile information</li>
          <li>✓ Valid payment method</li>
          <li>✓ Shipping address</li>
        </ul>
      </div>

      <h2>Step 1: Find Your Product</h3>
      
      <h3>Using the Search Bar</h3>
      <p>The search bar is your best friend for finding specific parts:</p>
      <ul>
        <li>Enter part names, numbers, or keywords</li>
        <li>Use filters for make, model, year</li>
        <li>Sort by price, condition, or location</li>
        <li>Save searches for future use</li>
      </ul>

      <h3>Browse Categories</h3>
      <p>If you're not sure what you need:</p>
      <ul>
        <li>Explore categories like Engine, Brakes, Suspension</li>
        <li>Filter by vehicle make and model</li>
        <li>Check trending products</li>
        <li>View recommended items</li>
      </ul>

      <h2>Step 2: Evaluate the Product</h3>
      
      <h3>Read the Product Details</h3>
      <p>Pay attention to these key details:</p>
      <ul>
        <li><strong>Condition:</strong> New, Used, Reconditioned</li>
        <li><strong>Compatibility:</strong> Check if it fits your vehicle</li>
        <li><strong>Brand:</strong> OEM vs Aftermarket</li>
        <li><strong>Warranty:</strong> Return policy and guarantee</li>
      </ul>

      <h3>Check Seller Information</h3>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Seller Checklist
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Seller rating and reviews</li>
          <li>• Response time</li>
          <li>• Return policy</li>
          <li>• Shipping options</li>
          <li>• Location for local pickup</li>
        </ul>
      </div>

      <h3>Ask Questions</h3>
      <p>Don't hesitate to contact the seller:</p>
      <ul>
        <li>Ask about compatibility</li>
        <li>Request more photos</li>
        <li>Inquire about shipping</li>
        <li>Negotiate price (if applicable)</li>
      </ul>

      <h2>Step 3: Add to Cart</h3>
      
      <h3>Adding Items</h3>
      <ol>
        <li>Click "Add to Cart" on the product page</li>
        <li>Choose quantity if needed</li>
        <li>Review your cart items</li>
        <li>Continue to checkout</li>
      </ol>

      <h3>Cart Management</h3>
      <p>From your cart, you can:</p>
      <ul>
        <li>Update quantities</li>
        <li>Remove items</li>
        <li>Save for later</li>
        <li>Apply discount codes</li>
      </ul>

      <h2>Step 4: Checkout Process</h3>
      
      <h3>Shipping Information</h3>
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Shipping Details
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Enter complete shipping address</li>
          <li>• Choose shipping speed</li>
          <li>• Add special instructions</li>
          <li>• Verify delivery timeframe</li>
        </ul>
      </div>

      <h3>Payment Options</h3>
      <p>AutoTradeHub accepts multiple payment methods:</p>
      <ul>
        <li><strong>Credit/Debit Cards:</strong> Visa, Mastercard, Amex</li>
        <li><strong>Digital Wallets:</strong> PayPal, Apple Pay, Google Pay</li>
        <li><strong>Bank Transfer:</strong> Direct bank deposit</li>
        <li><strong>Crypto:</strong> Bitcoin, Ethereum</li>
      </ul>

      <h3>Order Review</h3>
      <p>Before paying, double-check:</p>
      <ul>
        <li>Product details and quantities</li>
        <li>Shipping address</li>
        <li>Total cost including fees</li>
        <li>Estimated delivery date</li>
      </ul>

      <h2>Step 5: Complete Purchase</h3>
      
      <h3>Payment Security</h3>
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Secure Checkout
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• SSL encryption protects your data</li>
          <li>• PCI compliant payment processing</li>
          <li>• Fraud detection systems</li>
          <li>• Secure payment gateway</li>
        </ul>
      </div>

      <h3>Order Confirmation</h3>
      <p>After payment, you'll receive:</p>
      <ul>
        <li>Order confirmation email</li>
        <li>Order number for tracking</li>
        <li>Seller contact information</li>
        <li>Estimated delivery date</li>
      </ul>

      <h2>After Your Order</h3>
      
      <h3>Track Your Order</h3>
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Order Status Updates
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Order confirmed</li>
          <li>• Processing</li>
          <li>• Shipped</li>
          <li>• Delivered</li>
        </ul>
      </div>

      <h3>Communicate with Seller</h3>
      <p>Stay in touch with the seller:</p>
      <ul>
        <li>Ask about shipping updates</li>
        <li>Request tracking information</li>
        <li>Report any issues</li>
        <li>Leave feedback after delivery</li>
      </ul>

      <h2>Troubleshooting Common Issues</h2>
      
      <h3>Payment Problems</h3>
      <ul>
        <li>Check your card details and billing address</li>
        <li>Ensure sufficient funds are available</li>
        <li>Try a different payment method</li>
        <li>Contact your bank if declined</li>
      </ul>

      <h3>Shipping Issues</h3>
      <ul>
        <li>Verify your shipping address</li>
        <li>Check if your location is serviced</li>
        <li>Contact seller about delays</li>
        <li>Consider local pickup options</li>
      </ul>

      <h3>Product Issues</h3>
      <ul>
        <li>Document any damage with photos</li>
        <li>Contact seller immediately</li>
        <li>Review return policy</li>
        <li>Open a dispute if necessary</li>
      </ul>

      <h2>First Order Tips</h3>
      
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Pro Tips for First-Time Buyers
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Start with smaller orders to build trust</li>
          <li>• Read seller reviews carefully</li>
          <li>• Understand return policies before buying</li>
          <li>• Keep all communication records</li>
          <li>• Take photos of delivered items</li>
        </ul>
      </div>

      <h3>Building Trust</h3>
      <p>As a new buyer:</p>
      <ul>
        <li>Complete your profile verification</li>
        <li>Respond quickly to seller messages</li>
        <li>Leave honest feedback</li>
        <li>Build positive transaction history</li>
      </ul>

      <h2>What to Expect</h3>
      
      <h3>Delivery Timeline</h3>
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Typical Delivery Times
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• In-stock items: 2-5 business days</li>
          <li>• Custom orders: 1-3 weeks</li>
          <li>• International: 2-6 weeks</li>
          <li>• Local pickup: Same day</li>
        </ul>
      </div>

      <h3>Customer Support</h3>
      <p>AutoTradeHub support is here to help:</p>
      <ul>
        <li>24/7 live chat support</li>
        <li>Email support within 24 hours</li>
        <li>Phone support during business hours</li>
        <li>Comprehensive help center</li>
      </ul>

      <h2>Next Steps</h3>
      <p>After your first order:</p>
      <ul>
        <li>Leave feedback for the seller</li>
        <li>Rate your experience</li>
        <li>Save the seller to your favorites</li>
        <li>Explore more products</li>
        <li>Consider becoming a seller</li>
      </ul>

      <h2>Need Help?</h3>
      <p>If you have any questions about your first order:</p>
      <ul>
        <li>📧 Email: support@autotradehub.com</li>
        <li>💬 Live Chat: Available 24/7</li>
        <li>📞 Phone: 1-800-AUTO-HUB</li>
        <li>📱 Mobile App: Get push notifications</li>
      </ul>

      <div className="bg-gradient-accent rounded-lg text-white p-6 mt-8 text-center">
        <h3 className="text-xl font-bold mb-2">Ready to Start?</h3>
        <p className="mb-4">Browse our extensive catalog of automotive parts and accessories</p>
        <a href="/products" className="inline-block bg-white text-primary px-6 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors">
          Start Shopping
        </a>
      </div>
    </HelpArticle>
  );
}
