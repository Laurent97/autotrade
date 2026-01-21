import { Link } from 'react-router-dom';
import { Trash2, ShoppingCart, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import PublicLayout from '@/components/PublicLayout';

const Cart = () => {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(price);
  };

  if (items.length === 0) {
    return (
      <PublicLayout>
        <main className="pt-6 sm:pt-8 pb-12 sm:pb-16 min-h-screen flex items-center">
          <div className="container-wide text-center px-4 sm:px-6">
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
      <main className="pt-6 sm:pt-8 pb-12 sm:pb-16">
        <div className="container-wide px-4 sm:px-6">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">Shopping Cart</h1>
            <p className="text-muted-foreground text-sm sm:text-base">{items.length} item(s) in your cart</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6"
                >
                  {/* Product Image */}
                  <Link
                    to={`/products/${item.product.id}`}
                    className="w-32 h-32 rounded-lg overflow-hidden bg-secondary flex-shrink-0"
                  >
                    <img
                      src={item.product.images[0] || '/placeholder.svg'}
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.product.id}`}>
                      <h3 className="font-semibold text-foreground mb-2 hover:text-accent transition-colors">
                        {item.product.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground mb-4">
                      {item.product.category} • {item.product.condition}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-foreground">
                          {formatPrice(item.subtotal)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.product.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-4">
                <Button variant="outline" onClick={clearCart}>
                  Clear Cart
                </Button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
                <h2 className="text-xl font-bold text-foreground mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatPrice(getTotal())}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>{getTotal() >= 500 ? 'Free' : formatPrice(25)}</span>
                  </div>
                  <div className="border-t border-border pt-4 flex justify-between text-lg font-bold text-foreground">
                    <span>Total</span>
                    <span>{formatPrice(getTotal() + (getTotal() >= 500 ? 0 : 25))}</span>
                  </div>
                </div>

                <Link to="/checkout" className="block">
                  <Button className="w-full" size="lg">
                    Proceed to Checkout
                  </Button>
                </Link>

                <p className="text-xs text-muted-foreground text-center mt-4">
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
