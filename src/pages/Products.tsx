import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Filter, Grid, List, ChevronDown, Star, MapPin, Heart, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { productService } from "@/lib/supabase/product-service";
import type { Product } from "@/lib/types";
import PublicLayout from "@/components/PublicLayout";

// Keep demo products as fallback if Supabase is not configured
const fallbackProducts = [
  {
    id: "1",
    title: "2023 Toyota Land Cruiser",
    category: "car",
    price: 78500,
    originalPrice: 85000,
    year: 2023,
    mileage: 12000,
    location: "Japan",
    condition: "Used",
    make: "Toyota",
    model: "Land Cruiser",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&auto=format&fit=crop",
    featured: true,
  },
  {
    id: "2",
    title: "V8 Engine Assembly",
    category: "engine",
    price: 12500,
    originalPrice: 15000,
    condition: "New",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1557823217-3a406371c764?w=800&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "Automatic Transmission Kit",
    category: "transmission",
    price: 3200,
    originalPrice: 3800,
    condition: "New",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop",
  },
  {
    id: "4",
    title: "Coilover Suspension System",
    category: "suspension",
    price: 1800,
    originalPrice: 2200,
    condition: "New",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop",
  },
  {
    id: "5",
    title: "Premium Brake Kit",
    category: "brakes",
    price: 450,
    originalPrice: 599,
    condition: "New",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop",
  },
  {
    id: "6",
    title: "LED Headlight Set",
    category: "electrical",
    price: 289,
    condition: "New",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop",
  },
  {
    id: "7",
    title: "Leather Seat Covers",
    category: "interior",
    price: 650,
    originalPrice: 799,
    condition: "New",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop",
  },
  {
    id: "8",
    title: "Carbon Fiber Hood",
    category: "exterior",
    price: 1200,
    originalPrice: 1500,
    condition: "New",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop",
  },
  {
    id: "9",
    title: "Turbocharger Kit",
    category: "performance",
    price: 3500,
    originalPrice: 4200,
    condition: "New",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&auto=format&fit=crop",
  },
  {
    id: "10",
    title: "Mechanic Tool Set",
    category: "tools",
    price: 450,
    originalPrice: 550,
    condition: "New",
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop",
  },
  {
    id: "11",
    title: "Oil Change Kit",
    category: "maintenance",
    price: 89,
    originalPrice: 120,
    condition: "New",
    rating: 4.3,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop",
  },
  {
    id: "12",
    title: "BMW M5 Competition",
    category: "car",
    price: 112000,
    year: 2022,
    mileage: 8500,
    location: "Germany",
    condition: "Used",
    make: "BMW",
    model: "M5",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop",
  },
];

const categories = [
  { id: "all", label: "All Products" },
  { id: "engine", label: "Engine" },
  { id: "transmission", label: "Transmission" },
  { id: "suspension", label: "Suspension" },
  { id: "brakes", label: "Brakes" },
  { id: "electrical", label: "Electrical" },
  { id: "interior", label: "Interior" },
  { id: "exterior", label: "Exterior" },
  { id: "performance", label: "Performance" },
  { id: "tools", label: "Tools" },
  { id: "maintenance", label: "Maintenance" },
  { id: "car", label: "Vehicles" },
  { id: "part", label: "Parts" },
  { id: "accessory", label: "Accessories" },
];

const sortOptions = [
  { id: "popular", label: "Most Popular" },
  { id: "newest", label: "Newest First" },
  { id: "price-low", label: "Price: Low to High" },
  { id: "price-high", label: "Price: High to Low" },
];

const ProductCard = ({ product }: { product: Product }) => {
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
    : '/placeholder.svg';

  return (
    <Link
      to={`/products/${product.id}`}
      className="group bg-card rounded-2xl overflow-hidden border border-border card-hover"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {product.stock_quantity === 0 && (
            <Badge variant="secondary" className="bg-destructive text-destructive-foreground">
              Out of Stock
            </Badge>
          )}
        </div>
        
        {/* Wishlist Button */}
        <button
          aria-label="Add to favorites"
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent hover:text-accent-foreground"
        >
          <Heart className="w-5 h-5" />
        </button>
        
        {/* Condition Badge */}
        {product.condition && (
        <div className="absolute bottom-3 left-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
              product.condition === "new" 
              ? "bg-success/20 text-success" 
              : "bg-info/20 text-info"
          }`}>
            {product.condition}
          </span>
        </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {product.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground mb-2 group-hover:text-accent transition-colors line-clamp-2">
          {product.title}
        </h3>

        {/* Details for cars */}
        {product.category === "car" && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            {product.year && <span>{product.year}</span>}
            {product.mileage && <span>{product.mileage.toLocaleString()} km</span>}
            {product.make && product.model && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {product.make} {product.model}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-foreground">
            {formatPrice(Number(product.original_price))}
          </span>
        </div>
      </div>
    </Link>
  );
};

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([
    { id: "all", label: "All Products" }
  ]);
  
  const categoryFilter = searchParams.get("category") || "all";
  const sortBy = searchParams.get("sort") || "popular";
  const searchQuery = searchParams.get("q") || "";

  // Fetch categories from database
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      console.log('=== LOADING CATEGORIES FROM DATABASE ===');
      const filterOptions = await productService.getFilterOptions();
      console.log('Filter options result:', filterOptions);
      console.log('Categories from database:', filterOptions.categories);
      
      if (filterOptions.categories) {
        const dbCategories = filterOptions.categories.map((cat: string) => ({
          id: cat.toLowerCase().replace(/\s+/g, '-'),
          label: cat.charAt(0).toUpperCase() + cat.slice(1)
        }));
        console.log('Formatted categories:', dbCategories);
        setCategories([{ id: "all", label: "All Products" }, ...dbCategories]);
        console.log('Final categories state:', [{ id: "all", label: "All Products" }, ...dbCategories]);
      } else {
        console.log('No categories found in database');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Keep hardcoded categories as fallback
      console.log('Using fallback categories');
    }
  };

  // Fetch products from Supabase
  useEffect(() => {
    loadProducts();
  }, [categoryFilter, searchQuery, sortBy, currentPage]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // Determine sort field and order
      let sortField: 'created_at' | 'title' = 'created_at';
      let sortOrder: 'asc' | 'desc' = 'desc';
      
      if (sortBy === 'price-low') {
        // For price sorting, we'll handle it manually since SortOptions doesn't support 'original_price'
        sortField = 'created_at';
        sortOrder = 'desc';
      } else if (sortBy === 'price-high') {
        sortField = 'created_at';
        sortOrder = 'desc';
      } else if (sortBy === 'newest') {
        sortField = 'created_at';
        sortOrder = 'desc';
      }

      const filters: any = {};
      if (categoryFilter !== 'all') {
        filters.category = categoryFilter;
      }
      if (searchQuery) {
        filters.search = searchQuery;
      }

      const result = await productService.getProducts(
        currentPage,
        20,
        filters,
        { field: sortField, order: sortOrder }
      );

      if (result.data) {
        setProducts(result.data);
        setTotal(result.total);
      } else {
        // Fallback to demo data if Supabase is not configured
        const filtered = fallbackProducts.filter((product: any) => {
          if (categoryFilter !== "all" && product.category !== categoryFilter) return false;
          if (searchQuery && !product.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
          return true;
        });
        // Convert fallback products to Product format
        const convertedProducts: Product[] = filtered.map((p: any) => ({
          id: p.id,
          sku: p.id,
          title: p.title,
          description: '',
          category: p.category as 'car' | 'part' | 'accessory',
          original_price: Number(p.price || p.originalPrice || 0),
          stock_quantity: 1,
          images: p.image ? [p.image] : [],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          make: p.make,
          model: p.model,
          year: p.year,
          mileage: p.mileage,
          condition: p.condition?.toLowerCase() as 'new' | 'used' | 'reconditioned' | undefined,
        })) as Product[];
        setProducts(convertedProducts);
        setTotal(convertedProducts.length);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      // Fallback to demo data
      const filtered = fallbackProducts.filter((product: any) => {
    if (categoryFilter !== "all" && product.category !== categoryFilter) return false;
    if (searchQuery && !product.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
      // Convert fallback products to Product format
      const convertedProducts: Product[] = filtered.map((p: any) => ({
        id: p.id,
        sku: p.id,
        title: p.title,
        description: '',
        category: p.category as 'car' | 'part' | 'accessory',
        original_price: p.price || p.originalPrice || 0,
        stock_quantity: 1,
        images: p.image ? [p.image] : [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        make: p.make,
        model: p.model,
        year: p.year,
        mileage: p.mileage,
        condition: p.condition?.toLowerCase() as 'new' | 'used' | 'reconditioned' | undefined,
      }));
      setProducts(convertedProducts);
      setTotal(convertedProducts.length);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    if (category === "all") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", category);
    }
    setSearchParams(searchParams);
  };

  return (
    <PublicLayout>
      <main className="pt-8 pb-16">
        <div className="container-wide">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              {categoryFilter === "all" ? "All Products" : categories.find(c => c.id === categoryFilter)?.label}
            </h1>
            <p className="text-muted-foreground">
              {loading ? 'Loading...' : `${total} products found`}
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
            {/* Search */}
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => {
                  if (e.target.value) {
                    searchParams.set("q", e.target.value);
                  } else {
                    searchParams.delete("q");
                  }
                  setSearchParams(searchParams);
                }}
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-shadow"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                className="gap-2 md:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </Button>
              
              <div className="flex items-center gap-2 ml-auto md:ml-0">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Categories Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {/* Debug: Log categories being rendered */}
            {(() => {
              console.log('=== RENDERING CATEGORIES TABS ===');
              console.log('Categories array:', categories);
              console.log('Categories length:', categories.length);
              console.log('Current category filter:', categoryFilter);
              return null;
            })()}
            
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  categoryFilter === category.id
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : products.length > 0 ? (
            <div className={`grid gap-6 ${
              viewMode === "grid" 
                ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                : "grid-cols-1"
            }`}>
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-slide-up"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your search or filters</p>
              <Button variant="accent" onClick={() => setSearchParams({})}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </main>
    </PublicLayout>
  );
};

export default Products;
