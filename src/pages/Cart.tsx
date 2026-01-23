import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase/client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingCart, Plus, Minus, Package } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';

const Cart = () => {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const formatPrice = (price: number) => {
    // Handle invalid or undefined prices
    if (typeof price !== 'number' || isNaN(price) || price < 0) {
      return '$0.00';
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(price);
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    navigate('/checkout');
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(productId);
      return;
    }
    updateQuantity(productId, newQuantity);
  };

  // Calculate shipping
  const shippingCost = getTotal() >= 500 ? 0 : 25;
  const orderTotal = getTotal() + shippingCost;

  if (items.length === 0) {
    return (
      <PublicLayout>
        <main className="pt-20 sm:pt-24 pb-12 sm:pb-16 min-h-screen flex items-center">
          <div className="container mx-auto text-center px-4 sm:px-6">
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <ShoppingCart className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">Add some products to get started!</p>
            <Link to="/products">
              <Button size="lg" className="w-full sm:w-auto">Browse Products</Button>
            </Link>
          </div>
        </main>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <main className="pt-20 sm:pt-24 pb-12 sm:pb-16 min-h-screen">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">Shopping Cart</h1>
            <p className="text-muted-foreground text-sm sm:text-base">{items.length} item(s) in your cart</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {items.map((item) => {
                // Skip items with no product data
                if (!item.product) {
                  return null;
                }
                
                const product = item.product;
                const stockStatus = product.stock_quantity > 0 ? 'Available' : 'Out of Stock';
                const stockColor = product.stock_quantity > 0 ? 'bg-green-500' : 'bg-red-500';
                
                return (
                  <div
                    key={product.id}
                    className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 hover:shadow-md transition-shadow"
                  >
                    {/* Product Image */}
                    <div className="sm:w-32 sm:h-32 w-full h-48 relative overflow-hidden rounded-lg bg-gray-100">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={`${product.make} ${product.model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <Package className="w-12 h-12 text-gray-400 mb-2" />
                          <p className="text-gray-500 text-sm">No Image</p>
                        </div>
                      )}
                      <div className={`absolute top-2 right-2 ${stockColor} text-white px-2 py-1 rounded-full text-xs font-semibold`}>
                        {stockStatus}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {item.product?.title || `${item.product.make} ${item.product.model}`}
                          </h3>
                          <p className="text-gray-600 text-sm mb-1">
                            SKU: {item.product?.sku || 'N/A'} | Category: {item.product?.category || 'General'}
                          </p>
                          {item.partner_product && (
                            <p className="text-gray-500 text-xs">
                              Sold by: {item.partner_store_name || item.partner_product?.partner_store_name || 'Partner Store'}
                            </p>
                          )}
                        </div>
                        <div className="mt-2 sm:mt-0 text-right">
                          <span className="text-2xl font-bold text-primary">
                            {formatPrice(item.unit_price)}
                          </span>
                          {item.unit_price < product.original_price && (
                            <p className="text-sm text-gray-500 line-through">
                              {formatPrice(product.original_price)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description || 'Quality automotive part'}
                      </p>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(product.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(product.id, item.quantity + 1)}
                            disabled={product.stock_quantity > 0 && item.quantity >= product.stock_quantity}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          {product.stock_quantity > 0 && (
                            <span className="text-xs text-gray-500 ml-2">
                              {product.stock_quantity} in stock
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4">
                          <div className="text-right">
                            <span className="text-base sm:text-lg font-bold text-foreground block">
                              {formatPrice(item.subtotal)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {item.quantity} × {formatPrice(item.unit_price)}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(product.id)}
                            className="text-destructive hover:text-destructive h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="pt-3 sm:pt-4 flex gap-3">
                <Button variant="outline" onClick={clearCart} className="flex-1 sm:flex-none">
                  Clear Cart
                </Button>
                <Link to="/products" className="flex-1 sm:flex-none">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-6 lg:sticky lg:top-24">
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6">Order Summary</h2>

                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatPrice(getTotal())}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className={shippingCost === 0 ? 'text-green-600 font-semibold' : ''}>
                      {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
                    </span>
                  </div>
                  {shippingCost === 0 && (
                    <div className="text-xs text-green-600 bg-green-50 p-2 rounded-lg">
                      🎉 You've qualified for free shipping!
                    </div>
                  )}
                  <div className="border-t border-border pt-3 sm:pt-4 flex justify-between text-base sm:text-lg font-bold text-foreground">
                    <span>Total</span>
                    <span>{formatPrice(orderTotal)}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    *Taxes calculated at checkout
                  </div>
                </div>

                <Button 
                  onClick={handleCheckout} 
                  className="w-full" 
                  size="lg"
                  disabled={loading || items.some(item => !item.product?.stock_quantity || item.product.stock_quantity === 0)}
                >
                  {loading ? 'Processing...' : 'Proceed to Checkout'}
                </Button>

                {items.some(item => !item.product?.stock_quantity || item.product.stock_quantity === 0) && (
                  <p className="text-xs text-red-500 text-center mt-3">
                    Some items are out of stock. Please remove them to proceed.
                  </p>
                )}

                <p className="text-xs text-muted-foreground text-center mt-3 sm:mt-4">
                  Free shipping on orders over $500
                </p>

              </div>
            </div>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
};

export default Cart;