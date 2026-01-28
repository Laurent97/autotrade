import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, Star, MapPin, Loader2, Building2, Shield, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { productService } from "@/lib/supabase/product-service";
import { supabase } from "@/lib/supabase/client";
import { SimpleLikeButton } from "@/components/liked-items/LikeButton";
import { useAuth } from "@/contexts/AuthContext";

const ProductCard = ({ product }: { product: any }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Get first image or placeholder
  const imageUrl = product.images && product.images.length > 0 
    ? product.images[0] 
    : product.image || '/placeholder.svg';

  return (
    <Link
      to={`/products/${product.id}`}
      className="group bg-card rounded-xl overflow-hidden border border-border hover:border-blue-300 hover:shadow-lg transition-all duration-300"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {product.featured && (
            <Badge className="bg-blue-600 text-white text-xs font-semibold">Featured</Badge>
          )}
          {product.verified && (
            <Badge className="bg-green-600 text-white text-xs font-semibold">Verified</Badge>
          )}
          {product.original_price && product.price < product.original_price && (
            <Badge variant="secondary" className="bg-red-500 text-white text-xs font-semibold">
              {Math.round((1 - product.price / product.original_price) * 100)}% OFF
            </Badge>
          )}
        </div>
        
        {/* Like Button */}
        <SimpleLikeButton
          itemType="product"
          itemId={product.id}
          itemData={{
            title: product.title,
            price: product.price,
            original_price: product.original_price,
            image: imageUrl,
            category: product.category,
            make: product.make,
            model: product.model,
            year: product.year,
            condition: product.condition,
            rating: product.rating,
            status: 'active'
          }}
          className="absolute top-3 right-3"
        />
        
        {/* Supplier Info */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-3 h-3 text-blue-600" />
              <span className="text-xs font-medium text-foreground truncate">
                {product.supplier || 'Verified Supplier'}
              </span>
            </div>
            {product.min_order && (
              <span className="text-xs text-muted-foreground">Min: {product.min_order}</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category & Rating */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
            {product.category_path?.category_name || product.category}
          </span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-foreground">{product.rating || '4.5'}</span>
            <span className="text-xs text-muted-foreground">({product.reviews || '128'})</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm md:text-base">
          {product.title}
        </h3>

        {/* Details for cars */}
        {product.category === "car" && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            {product.year && <span>{product.year}</span>}
            {product.mileage && <span>{product.mileage.toLocaleString()} km</span>}
            {product.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {product.location}
              </span>
            )}
          </div>
        )}

        {/* B2B Specific Info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          {product.moq && (
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
              MOQ: {product.moq}
            </span>
          )}
          {product.lead_time && (
            <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
              {product.lead_time} days
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">
              {formatPrice(Number(product.original_price || product.price))}
            </span>
            {product.original_price && product.price < product.original_price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(Number(product.price))}
              </span>
            )}
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
            Get Quote
          </Button>
        </div>
      </div>
    </Link>
  );
};

const FeaturedProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'featured' | 'liked' | 'recent' | 'suppliers'>('featured');
  const { user } = useAuth();

  useEffect(() => {
    loadProducts();
  }, [activeTab, user]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      let result;
      
      switch (activeTab) {
        case 'featured':
          // Get featured products
          result = await productService.getProducts(1);
          if (result.data) {
            const featured = result.data.filter((p: any) => p.featured).slice(0, 6);
            setProducts(featured);
          }
          break;
          
        case 'liked':
          // Get liked products
          if (user) {
            try {
              const { data: likedItems, error: likedError } = await supabase
                .from('liked_items')
                .select('item_id')
                .eq('user_id', user.id)
                .eq('item_type', 'product');
              
              if (likedError) {
                console.error('Error fetching liked items:', likedError);
                setProducts([]);
              } else if (likedItems && likedItems.length > 0) {
                const likedIds = likedItems.map(item => item.item_id);
                const allProducts = await productService.getProducts(1);
                const likedProducts = allProducts.data.filter((p: any) => 
                  likedIds.includes(p.id)
                ).slice(0, 6);
                setProducts(likedProducts);
              } else {
                setProducts([]);
              }
            } catch (error) {
              console.error('Error in liked products fetch:', error);
              setProducts([]);
            }
          } else {
            setProducts([]);
          }
          break;
          
        case 'recent':
          // Get recent products
          result = await productService.getProducts(1);
          if (result.data) {
            const recent = result.data
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 6);
            setProducts(recent);
          }
          break;

        case 'suppliers':
          // Get products from top suppliers
          result = await productService.getProducts(1);
          if (result.data) {
            const supplierProducts = result.data
              .filter((p: any) => p.verified || p.supplier_rating >= 4)
              .slice(0, 6);
            setProducts(supplierProducts);
          }
          break;
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section-padding bg-card">
      <div className="container-wide">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3">
              {activeTab === 'featured' && 'Featured Products'}
              {activeTab === 'liked' && 'Your Saved Products'}
              {activeTab === 'recent' && 'New Arrivals'}
              {activeTab === 'suppliers' && 'Top Supplier Products'}
            </h2>
            <p className="text-muted-foreground text-lg">
              {activeTab === 'featured' && 'Premium quality products from verified suppliers'}
              {activeTab === 'liked' && 'Products you\'ve saved for future reference'}
              {activeTab === 'recent' && 'Latest additions to our extensive catalog'}
              {activeTab === 'suppliers' && 'Products from our highest-rated suppliers'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Tab Navigation */}
            <div className="flex bg-muted rounded-lg p-1 border border-border">
              <button
                onClick={() => setActiveTab('featured')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'featured'
                    ? 'bg-card text-blue-600 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Featured
              </button>
              <button
                onClick={() => setActiveTab('suppliers')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'suppliers'
                    ? 'bg-card text-blue-600 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Top Suppliers
              </button>
              <button
                onClick={() => setActiveTab('recent')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'recent'
                    ? 'bg-card text-blue-600 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                New
              </button>
              <button
                onClick={() => setActiveTab('liked')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'liked'
                    ? 'bg-card text-blue-600 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Saved
              </button>
            </div>
            
            <Link to="/products">
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white gap-2">
                View All Products
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* B2B Features Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Shield className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-sm font-semibold text-blue-900">Trade Assurance</div>
              <div className="text-xs text-blue-700">Protected orders</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <Truck className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-sm font-semibold text-green-900">Fast Shipping</div>
              <div className="text-xs text-green-700">Global delivery</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <Building2 className="w-5 h-5 text-purple-600" />
            <div>
              <div className="text-sm font-semibold text-purple-900">Verified Suppliers</div>
              <div className="text-xs text-purple-700">Quality checked</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <Users className="w-5 h-5 text-orange-600" />
            <div>
              <div className="text-sm font-semibold text-orange-900">Bulk Pricing</div>
              <div className="text-xs text-orange-700">Volume discounts</div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-card rounded-xl overflow-hidden border border-border">
                  <div className="aspect-[4/3] bg-muted"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              {activeTab === 'liked' && 'You haven\'t saved any products yet'}
              {activeTab === 'featured' && 'No featured products available'}
              {activeTab === 'recent' && 'No recent products available'}
              {activeTab === 'suppliers' && 'No supplier products available'}
            </div>
            {activeTab === 'liked' && (
              <Link to="/products">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Browse Products
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 text-center bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white">
          <h3 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold mb-4">Ready to Source Automotive Parts?</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Connect with verified suppliers and get competitive pricing on quality automotive parts and accessories.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products">
              <Button size="lg" className="bg-card text-blue-600 hover:bg-blue-50 font-semibold">
                Start Sourcing
              </Button>
            </Link>
            <Link to="/become-partner">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-card hover:text-blue-600">
                Become a Supplier
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
