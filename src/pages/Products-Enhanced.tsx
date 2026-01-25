import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Filter, Grid, List, ChevronDown, Star, MapPin, Heart, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { productService } from "@/lib/supabase/product-service";
import { supabase } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SimpleLikeButton } from "@/components/liked-items/LikeButton";
import EnhancedCategoryNavigation from "@/components/EnhancedCategoryNavigation";

// Keep demo products as fallback if Supabase is not configured
const fallbackProducts = [
  {
    id: "1",
    title: "2023 Toyota Land Cruiser",
    category: "car",
    category_path: { product_type: "cars", category_name: "Used Cars" },
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
    title: "BMW M5 Competition",
    category: "car",
    category_path: { product_type: "cars", category_name: "New Cars" },
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
  {
    id: "3",
    title: "Premium Brake Kit",
    category: "part",
    category_path: { product_type: "parts", category_name: "Brakes & Suspension" },
    price: 450,
    originalPrice: 599,
    condition: "New",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1620231684732-9d61fd9c2b69?w=800&auto=format&fit=crop",
  },
  {
    id: "4",
    title: "LED Headlight Assembly",
    category: "part",
    category_path: { product_type: "parts", category_name: "Electrical & Lighting" },
    price: 280,
    originalPrice: 350,
    condition: "New",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&auto=format&fit=crop",
  },
  {
    id: "5",
    title: "Leather Seat Covers",
    category: "accessory",
    category_path: { product_type: "accessories", category_name: "Seat Covers" },
    price: 180,
    originalPrice: 220,
    condition: "New",
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1449130505668-e4cdce0b94b7?w=800&auto=format&fit=crop",
  },
  {
    id: "6",
    title: "Car Phone Holder",
    category: "accessory",
    category_path: { product_type: "accessories", category_name: "Phone Holders" },
    price: 45,
    condition: "New",
    rating: 4.3,
    image: "https://images.unsplash.com/photo-1511707171634-98f02eb6575e?w=800&auto=format&fit=crop",
  },
  {
    id: "7",
    title: "Performance Exhaust System",
    category: "part",
    category_path: { product_type: "parts", category_name: "Engine & Components" },
    price: 1200,
    originalPrice: 1500,
    condition: "New",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&auto=format&fit=crop",
  },
  {
    id: "8",
    title: "Carbon Fiber Steering Wheel",
    category: "accessory",
    category_path: { product_type: "accessories", category_name: "Interior & Trim" },
    price: 850,
    condition: "New",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1449130505668-e4cdce0b94b7?w=800&auto=format&fit=crop",
  },
  {
    id: "9",
    title: "Turbo Engine Kit",
    category: "part",
    category_path: { product_type: "parts", category_name: "Engine & Components" },
    price: 3500,
    originalPrice: 4200,
    condition: "New",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&auto=format&fit=crop",
  },
  {
    id: "10",
    title: "2022 Ford F-150 Truck",
    category: "vehicle",
    category_path: { product_type: "vehicles", category_name: "Trucks" },
    price: 45000,
    originalPrice: 52000,
    year: 2022,
    mileage: 25000,
    location: "USA",
    condition: "Used",
    make: "Ford",
    model: "F-150",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop",
  },
  {
    id: "11",
    title: "2021 Honda Civic Sedan",
    category: "cars",
    category_path: { product_type: "cars", category_name: "Sedans" },
    price: 22000,
    originalPrice: 25000,
    year: 2021,
    mileage: 15000,
    location: "Japan",
    condition: "Used",
    make: "Honda",
    model: "Civic",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&auto=format&fit=crop",
  },
];

// Enhanced category structure
const mainCategories = [
  { id: "all", label: "All Products", product_type: null },
  { id: "parts", label: "Parts", product_type: "parts" },
  { id: "cars", label: "Cars", product_type: "cars" },
  { id: "accessories", label: "Accessories", product_type: "accessories" },
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
    <Link to={`/products/${product.id}`} className="group block">
      <div className="bg-card rounded-xl overflow-hidden border border-border hover:border-accent transition-all duration-300 hover:shadow-lg">
        {/* Image */}
        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.featured && (
            <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
              Featured
            </Badge>
          )}
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
              status: 'active' // Add status field
            }}
            className="absolute top-3 right-3"
          />
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category Badge */}
          <div className="mb-2">
            <Badge variant="secondary" className="text-xs">
              {product.category_path && 
               typeof product.category_path === 'object' && 
               product.category_path.category_name 
                ? product.category_path.category_name 
                : product.category}
            </Badge>
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

          {/* Details for parts */}
          {product.category === "part" && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              {product.make && <span>{product.make}</span>}
              {product.model && <span>{product.model}</span>}
              {product.condition && <span>{product.condition}</span>}
            </div>
          )}

          {/* Details for accessories */}
          {product.category === "accessory" && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              {product.condition && <span>{product.condition}</span>}
              {product.make && <span>{product.make}</span>}
            </div>
          )}

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-1 mb-3">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{product.rating}</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-foreground">
              {formatPrice(Number(product.original_price))}
            </span>
            {product.original_price && product.price && product.price < product.original_price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(Number(product.price))}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function ProductsEnhanced() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  
  const categoryFilter = searchParams.get("category") || "all";
  const subcategoryFilter = searchParams.get("subcategory") || "";
  const sortBy = searchParams.get("sort") || "popular";
  const searchQuery = searchParams.get("q") || "";

  // Fetch categories from database
  useEffect(() => {
    loadCategories();
  }, []);

  // Fetch products from Supabase
  useEffect(() => {
    loadProducts();
  }, [categoryFilter, subcategoryFilter, searchQuery, sortBy, currentPage]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('product_type, level, sort_order');

      if (error) throw error;
      setCategories(data || []);
      
      // Extract unique subcategories based on selected main category
      if (categoryFilter !== 'all') {
        const filtered = data?.filter(cat => cat.product_type === categoryFilter && cat.level === 2) || [];
        setSubcategories(filtered);
      } else {
        setSubcategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      // Try to fetch from Supabase first
      const result = await productService.getProducts(currentPage);
      
      if (result.data && result.data.length > 0) {
        // Apply filters client-side for now
        let filtered = result.data.filter((product: any) => {
          // Filter by main category - exact category matching
          if (categoryFilter !== "all") {
            const productType = product.category_path?.product_type;
            const productCategory = product.category;
            
            // Enhanced category mapping for exact matching
            const categoryMap: Record<string, string[]> = {
              "cars": ["cars", "car"], // Show products uploaded as 'cars' or 'car'
              "vehicles": ["vehicles", "vehicle"], // Show products uploaded as 'vehicles' or 'vehicle'
              "parts": ["parts", "part"], // Show products uploaded as 'parts' or 'part'
              "accessories": ["accessories", "accessory"], // Show products uploaded as 'accessories' or 'accessory'
              "engine": ["parts"], // Engine is a subcategory of parts
              "transmission": ["parts"], // Transmission is a subcategory of parts
              "suspension": ["parts"], // Suspension is a subcategory of parts
              "brakes": ["parts"], // Brakes is a subcategory of parts
              "electrical": ["parts"], // Electrical is a subcategory of parts
              "interior": ["accessories"], // Interior is a subcategory of accessories
              "exterior": ["accessories"], // Exterior is a subcategory of accessories
              "performance": ["parts"], // Performance is a subcategory of parts
              "tools": ["accessories"], // Tools is a subcategory of accessories
              "maintenance": ["parts"], // Maintenance is a subcategory of parts
            };
            
            const allowedCategories = categoryMap[categoryFilter] || [categoryFilter];
            
            // Check if product matches any of the allowed categories
            const matchesCategory = allowedCategories.includes(productCategory) || 
                                  allowedCategories.includes(productType);
            
            // For subcategories, also check the category_path
            const matchesSubcategory = subcategoryFilter && 
                                      product.category_path?.category_name === subcategoryFilter;
            
            if (subcategoryFilter) {
              return matchesSubcategory;
            }
            
            return matchesCategory;
          }
          
          // Filter by subcategory
          if (subcategoryFilter && product.category_path?.category_name !== subcategoryFilter) return false;
          
          // Filter by search query
          if (searchQuery && !product.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
          
          return true;
        });

        // Apply sorting
        filtered.sort((a: any, b: any) => {
          switch (sortBy) {
            case 'price-low':
              return (a.original_price || 0) - (b.original_price || 0);
            case 'price-high':
              return (b.original_price || 0) - (a.original_price || 0);
            case 'newest':
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            default:
              return 0; // popular - keep original order
          }
        });

        setProducts(filtered);
        setTotal(filtered.length);
      } else {
        // Fallback to demo data
        let filtered = fallbackProducts.filter((product: any) => {
          // Filter by main category - exact category matching
          if (categoryFilter !== "all") {
            const productType = product.category_path?.product_type;
            const productCategory = product.category;
            
            // Enhanced category mapping for exact matching
            const categoryMap: Record<string, string[]> = {
              "cars": ["cars", "car"], // Show products uploaded as 'cars' or 'car'
              "vehicles": ["vehicles", "vehicle"], // Show products uploaded as 'vehicles' or 'vehicle'
              "parts": ["parts", "part"], // Show products uploaded as 'parts' or 'part'
              "accessories": ["accessories", "accessory"], // Show products uploaded as 'accessories' or 'accessory'
              "engine": ["parts"], // Engine is a subcategory of parts
              "transmission": ["parts"], // Transmission is a subcategory of parts
              "suspension": ["parts"], // Suspension is a subcategory of parts
              "brakes": ["parts"], // Brakes is a subcategory of parts
              "electrical": ["parts"], // Electrical is a subcategory of parts
              "interior": ["accessories"], // Interior is a subcategory of accessories
              "exterior": ["accessories"], // Exterior is a subcategory of accessories
              "performance": ["parts"], // Performance is a subcategory of parts
              "tools": ["accessories"], // Tools is a subcategory of accessories
              "maintenance": ["parts"], // Maintenance is a subcategory of parts
            };
            
            const allowedCategories = categoryMap[categoryFilter] || [categoryFilter];
            
            // Check if product matches any of the allowed categories
            const matchesCategory = allowedCategories.includes(productCategory) || 
                                  allowedCategories.includes(productType);
            
            // For subcategories, also check the category_path
            const matchesSubcategory = subcategoryFilter && 
                                      product.category_path?.category_name === subcategoryFilter;
            
            if (subcategoryFilter) {
              return matchesSubcategory;
            }
            
            return matchesCategory;
          }
          
          // Filter by subcategory
          if (subcategoryFilter && product.category_path?.category_name !== subcategoryFilter) return false;
          
          // Enhanced search with automotive keywords
          if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            const searchWords = searchLower.split(' ').filter(word => word.length > 0);
            
            // Enhanced search terms for automotive categories
            const automotiveKeywords = {
              cars: ['car', 'cars', 'vehicle', 'vehicles', 'automotive', 'auto', 'motor', 'motor vehicle'],
              parts: ['part', 'parts', 'component', 'components', 'spare', 'spares', 'replacement', 'oem', 'aftermarket'],
              accessories: ['accessory', 'accessories', 'gear', 'gears', 'equipment', 'tools', 'electronics', 'interior', 'exterior']
            };

            // Check if any search word matches
            const hasSearchMatch = searchWords.some(word => 
              product.title.toLowerCase().includes(word) ||
              product.make?.toLowerCase().includes(word) ||
              product.model?.toLowerCase().includes(word) ||
              product.description?.toLowerCase().includes(word)
            );

            // Check for automotive category matches
            const hasAutomotiveMatch = searchWords.some(word => {
              // Cars/Vehicles category
              if (automotiveKeywords.cars.includes(word)) {
                return product.category === 'car' || 
                       product.title.toLowerCase().includes('car') || 
                       product.title.toLowerCase().includes('vehicle') || 
                       product.title.toLowerCase().includes('automotive') ||
                       product.title.toLowerCase().includes('motor');
              }
              
              // Parts category
              if (automotiveKeywords.parts.includes(word)) {
                return product.category === 'part' || 
                       product.title.toLowerCase().includes('part') || 
                       product.title.toLowerCase().includes('component') ||
                       product.title.toLowerCase().includes('spare') ||
                       product.title.toLowerCase().includes('oem');
              }
              
              // Accessories category
              if (automotiveKeywords.accessories.includes(word)) {
                return product.category === 'accessory' || 
                       product.title.toLowerCase().includes('accessory') || 
                       product.title.toLowerCase().includes('gear') ||
                       product.title.toLowerCase().includes('equipment') ||
                       product.title.toLowerCase().includes('interior') ||
                       product.title.toLowerCase().includes('exterior');
              }
              
              return false;
            });

            return hasSearchMatch || hasAutomotiveMatch;
          }
          
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
          quantity_available: 1,
          images: p.image ? [p.image] : [],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          make: p.make,
          model: p.model,
          year: p.year,
          mileage: p.mileage,
          condition: p.condition?.toLowerCase() as 'new' | 'used' | 'reconditioned' | undefined,
          category_path: p.category_path || {},
          featured: p.featured || false,
          rating: p.rating,
        }));
        
        setProducts(convertedProducts);
        setTotal(convertedProducts.length);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      // Fallback to demo data
      const filtered = fallbackProducts.filter((product: any) => {
        // Filter by main category - exact category matching
        if (categoryFilter !== "all") {
          const productType = product.category_path?.product_type;
          const productCategory = product.category;
          
          // Enhanced category mapping for exact matching
          const categoryMap: Record<string, string[]> = {
            "cars": ["cars", "car"], // Show products uploaded as 'cars' or 'car'
            "vehicles": ["vehicles"], // Show products uploaded as 'vehicles'
            "parts": ["parts", "part"], // Show products uploaded as 'parts' or 'part'
            "accessories": ["accessories", "accessory"], // Show products uploaded as 'accessories' or 'accessory'
            "engine": ["parts"], // Engine is a subcategory of parts
            "transmission": ["parts"], // Transmission is a subcategory of parts
            "suspension": ["parts"], // Suspension is a subcategory of parts
            "brakes": ["parts"], // Brakes is a subcategory of parts
            "electrical": ["parts"], // Electrical is a subcategory of parts
            "interior": ["accessories"], // Interior is a subcategory of accessories
            "exterior": ["accessories"], // Exterior is a subcategory of accessories
            "performance": ["parts"], // Performance is a subcategory of parts
            "tools": ["accessories"], // Tools is a subcategory of accessories
            "maintenance": ["parts"], // Maintenance is a subcategory of parts
          };
          
          const allowedCategories = categoryMap[categoryFilter] || [categoryFilter];
          
          // Check if product matches any of the allowed categories
          const matchesCategory = allowedCategories.includes(productCategory) || 
                                allowedCategories.includes(productType);
          
          // For subcategories, also check the category_path
          const matchesSubcategory = subcategoryFilter && 
                                    product.category_path?.category_name === subcategoryFilter;
          
          if (subcategoryFilter) {
            return matchesSubcategory;
          }
          
          return matchesCategory;
        }
        if (subcategoryFilter && product.category_path?.category_name !== subcategoryFilter) return false;
        if (searchQuery && !product.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });
      
      const convertedProducts: Product[] = filtered.map((p: any) => ({
        id: p.id,
        sku: p.id,
        title: p.title,
        description: '',
        category: p.category as 'car' | 'part' | 'accessory',
        original_price: p.price || p.originalPrice || 0,
        quantity_available: 1,
        images: p.image ? [p.image] : [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        make: p.make,
        model: p.model,
        year: p.year,
        mileage: p.mileage,
        condition: p.condition?.toLowerCase() as 'new' | 'used' | 'reconditioned' | undefined,
        category_path: p.category_path || {},
        featured: p.featured || false,
        rating: p.rating,
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
      searchParams.delete("subcategory");
    } else {
      searchParams.set("category", category);
      searchParams.delete("subcategory"); // Reset subcategory when main category changes
    }
    setSearchParams(searchParams);
  };

  const handleSubcategoryChange = (subcategory: string) => {
    if (subcategory === "") {
      searchParams.delete("subcategory");
    } else {
      searchParams.set("subcategory", subcategory);
    }
    setSearchParams(searchParams);
  };

  const getSelectedCategoryLabel = () => {
    if (subcategoryFilter) {
      return subcategories.find(cat => cat.name === subcategoryFilter)?.name || subcategoryFilter;
    }
    return mainCategories.find(c => c.id === categoryFilter)?.label || "All Products";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container-wide">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              {getSelectedCategoryLabel()}
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
                placeholder="Search cars, parts, accessories..."
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

            {/* Category and Subcategory Filters */}
            <div className="flex items-center gap-3">
              {/* Main Category */}
              <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {mainCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Subcategory (only show if main category is selected and has subcategories) */}
              {categoryFilter !== "all" && subcategories.length > 0 && (
                <Select value={subcategoryFilter} onValueChange={handleSubcategoryChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Subcategories</SelectItem>
                    {subcategories.map((subcategory) => (
                      <SelectItem key={subcategory.id} value={subcategory.name}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Sort */}
              <Select value={sortBy} onValueChange={(value) => {
                searchParams.set("sort", value);
                setSearchParams(searchParams);
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View Mode */}
            <div className="flex items-center gap-2">
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

          {/* Enhanced Category Navigation */}
          <div className="mb-8">
            <EnhancedCategoryNavigation compact={false} />
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search terms to find what you're looking for.
                </p>
              </div>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === "grid" 
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                : "grid-cols-1"
            }`}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
