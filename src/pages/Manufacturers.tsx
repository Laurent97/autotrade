import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Star, Phone, Mail, Globe, Filter, Grid, List, Heart, Store, ChevronRight, Users, Package, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface PartnerShop {
  id: string;
  user_id: string;
  store_name: string;
  store_slug: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  contact_email?: string;
  contact_phone?: string;
  country?: string;
  city?: string;
  commission_rate: number;
  total_earnings: number;
  total_orders: number;
  rating: number;
  store_visits: number;
  is_active: boolean;
  partner_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: string;
  users?: {
    email: string;
    full_name: string;
  };
}

const sortOptions = [
  { id: "newest", label: "Newest Shops" },
  { id: "rating", label: "Highest Rated" },
  { id: "products", label: "Most Products" },
  { id: "earnings", label: "Top Earners" },
  { id: "orders", label: "Most Orders" },
];

const categoryFilters = [
  { id: "all", label: "All Categories" },
  { id: "parts", label: "Parts" },
  { id: "cars", label: "Cars" },
  { id: "accessories", label: "Accessories" },
];

const countryFilters = [
  { id: "all", label: "All Countries" },
  { id: "US", label: "United States" },
  { id: "UK", label: "United Kingdom" },
  { id: "CA", label: "Canada" },
  { id: "AU", label: "Australia" },
  { id: "DE", label: "Germany" },
  { id: "JP", label: "Japan" },
];

const ShopCard = ({ shop }: { shop: PartnerShop }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const productCount = 0; // Placeholder since we're not using partner_products yet
  const avgProductPrice = 0; // Placeholder since we're not using partner_products yet

  return (
    <Link to={`/store/${shop.store_slug}`} className="group block">
      <Card className="overflow-hidden border border-border hover:border-accent transition-all duration-300 hover:shadow-lg">
        {/* Banner/Logo */}
        <div className="relative h-48 bg-gradient-to-br from-accent/20 to-accent/5">
          {shop.banner_url ? (
            <img
              src={shop.banner_url}
              alt={shop.store_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Store className="w-16 h-16 text-accent/30" />
            </div>
          )}
          
          {/* Logo Overlay */}
          <div className="absolute top-4 left-4">
            <div className="w-16 h-16 rounded-lg bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center overflow-hidden">
              {shop.logo_url ? (
                <img
                  src={shop.logo_url}
                  alt={shop.store_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Status Badges */}
          <div className="absolute top-4 right-4 flex gap-2">
            {shop.is_active && shop.partner_status === 'approved' && (
              <Badge className="bg-green-500 text-white text-xs">
                Active
              </Badge>
            )}
            {shop.rating >= 4.5 && (
              <Badge className="bg-yellow-500 text-white text-xs">
                Top Rated
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4">
          {/* Shop Name */}
          <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-accent transition-colors">
            {shop.store_name}
          </h3>

          {/* Description */}
          {shop.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {shop.description}
            </p>
          )}

          {/* Location */}
          {(shop.city || shop.country) && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
              <MapPin className="w-4 h-4" />
              <span>
                {shop.city && shop.country ? `${shop.city}, ${shop.country}` : shop.city || shop.country}
              </span>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Package className="w-4 h-4 text-accent" />
                <span className="text-xs text-muted-foreground">Products</span>
              </div>
              <div className="font-semibold text-foreground">{productCount}</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs text-muted-foreground">Orders</span>
              </div>
              <div className="font-semibold text-foreground">{formatNumber(shop.total_orders)}</div>
            </div>
          </div>

          {/* Rating */}
          {shop.rating > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(shop.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{shop.rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({shop.total_orders} reviews)</span>
            </div>
          )}

          {/* Contact Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            {shop.contact_email && (
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                <span className="truncate">{shop.contact_email}</span>
              </div>
            )}
            {shop.contact_phone && (
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                <span>{shop.contact_phone}</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button className="w-full group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
            <span className="flex items-center justify-center gap-2">
              Visit Shop
              <ChevronRight className="w-4 h-4" />
            </span>
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
};

export default function Manufacturers() {
  const [shops, setShops] = useState<PartnerShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [stats, setStats] = useState({
    totalShops: 0,
    activeShops: 0,
    totalProducts: 0,
    totalOrders: 0,
  });

  useEffect(() => {
    loadShops();
    loadStats();
  }, [sortBy, categoryFilter, countryFilter]);

  const loadShops = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('partner_profiles')
        .select(`
          *,
          users (
            email,
            full_name
          )
        `)
        .eq('is_active', true)
        .eq('partner_status', 'approved');

      // Apply filters
      if (countryFilter !== "all") {
        query = query.eq('country', countryFilter);
      }

      // Apply sorting
      switch (sortBy) {
        case "rating":
          query = query.order('rating', { ascending: false });
          break;
        case "newest":
          query = query.order('created_at', { ascending: false });
          break;
        case "earnings":
          query = query.order('total_earnings', { ascending: false });
          break;
        case "orders":
          query = query.order('total_orders', { ascending: false });
          break;
        default:
          query = query.order('store_name', { ascending: true });
      }

      const { data, error } = await query;

      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error('Error loading shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: shopsData } = await supabase
        .from('partner_profiles')
        .select('is_active, partner_status');

      const { data: productsData } = await supabase
        .from('partner_products')
        .select('id');

      const totalShops = shopsData?.length || 0;
      const activeShops = shopsData?.filter(s => s.is_active && s.partner_status === 'approved').length || 0;
      const totalProducts = productsData?.length || 0;

      setStats({
        totalShops,
        activeShops,
        totalProducts,
        totalOrders: 0, // Would need to calculate from orders table
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filteredShops = shops.filter(shop => {
    const matchesSearch = 
      shop.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by category (simplified since we're not using partner_products)
    const matchesCategory = categoryFilter === "all"; // Show all shops for now

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="container-wide px-4 sm:px-6">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
              Partner Shops & Manufacturers
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Discover and shop from our trusted partners and manufacturers
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <Store className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-accent" />
                <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.activeShops}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Active Shops</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-green-600" />
                <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalProducts}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total Products</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-blue-600" />
                <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalShops}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total Partners</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-purple-600" />
                <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalOrders}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total Orders</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
            {/* Search */}
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search shops by name, location, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-shadow"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryFilters.map((filter) => (
                    <SelectItem key={filter.id} value={filter.id}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  {countryFilters.map((filter) => (
                    <SelectItem key={filter.id} value={filter.id}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-muted-foreground">
              {loading ? 'Loading...' : `Showing ${filteredShops.length} of ${shops.length} shops`}
            </p>
          </div>

          {/* Shops Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading shops...</p>
              </div>
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No shops found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or filters to find shops.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("all");
                    setCountryFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === "grid" 
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1"
            }`}>
              {filteredShops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
