import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Star, Phone, Mail, Globe, Filter, Grid, List, Heart, Store, ChevronRight, Users, Package, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { usePartnerProfiles } from "@/hooks/useRealtimeSubscription";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface PartnerShop {
  id: string;
  user_id: string;
  store_name: string;
  store_slug: string;
  store_tagline?: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  brand_color?: string;
  accent_color?: string;
  business_type?: string;
  store_category?: string;
  year_established?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_linkedin?: string;
  country?: string;
  city?: string;
  timezone?: string;
  business_hours?: {
    monday: { open: string; close: string; };
    tuesday: { open: string; close: string; };
    wednesday: { open: string; close: string; };
    thursday: { open: string; close: string; };
    friday: { open: string; close: string; };
    saturday: { open: string; close: string; };
    sunday: { open: string; close: string; };
  };
  commission_rate: number;
  total_earnings: number;
  total_orders: number;
  rating: number;
  store_visits: number;
  is_active: boolean;
  partner_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: string;
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

  const getBusinessTypeLabel = (type?: string) => {
    const types = {
      'individual': 'Individual Seller',
      'business': 'Business',
      'corporation': 'Corporation',
      'partnership': 'Partnership'
    };
    return types[type as keyof typeof types] || type || 'Business';
  };

  const getCategoryLabel = (category?: string) => {
    const categories = {
      'premium_auto': 'Premium Auto Parts',
      'performance': 'Performance Parts',
      'accessories': 'Car Accessories',
      'tools': 'Tools & Equipment',
      'care': 'Car Care Products',
      'electronics': 'Car Electronics'
    };
    return categories[category as keyof typeof categories] || category || 'General';
  };

  return (
    <Link to={`/store/${shop.store_slug}`} className="group block">
      <Card className="overflow-hidden border border-border hover:border-accent transition-all duration-300 hover:shadow-lg">
        {/* Enhanced Banner/Logo */}
        <div className="relative h-48 sm:h-48">
          {shop.banner_url ? (
            <div className="relative w-full h-full">
              <img
                src={shop.banner_url}
                alt={shop.store_name}
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay for better text visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{
                background: shop.brand_color 
                  ? `linear-gradient(135deg, ${shop.brand_color}dd, ${shop.brand_color}99)`
                  : 'linear-gradient(135deg, rgb(59 130 246 / 0.3), rgb(147 51 234 / 0.2))'
              }}
            >
              <Store className="w-12 h-12 sm:w-16 sm:h-16 text-white/50" />
            </div>
          )}
          
          {/* Enhanced Logo Overlay */}
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-white dark:border-gray-700 shadow-lg flex items-center justify-center overflow-hidden">
              {shop.logo_url ? (
                <img
                  src={shop.logo_url}
                  alt={shop.store_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Enhanced Status Badges */}
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex flex-col gap-1 sm:gap-2">
            {shop.is_active && shop.partner_status === 'approved' && (
              <Badge className="bg-green-500 text-white text-xs px-2 py-1 shadow-lg">
                Active
              </Badge>
            )}
            {shop.rating >= 4.5 && (
              <Badge className="bg-yellow-500 text-white text-xs px-2 py-1 shadow-lg">
                Top Rated
              </Badge>
            )}
            {shop.year_established && (
              <Badge className="bg-blue-500 text-white text-xs px-2 py-1 shadow-lg">
                Since {shop.year_established}
              </Badge>
            )}
          </div>

          {/* Store Category Badge */}
          {shop.store_category && (
            <div className="absolute bottom-3 left-3 sm:left-4">
              <span 
                className="px-2 py-1 text-xs font-medium rounded-full shadow-lg"
                style={{
                  backgroundColor: shop.accent_color ? `${shop.accent_color}dd` : 'rgb(59 130 246)',
                  color: 'white'
                }}
              >
                {getCategoryLabel(shop.store_category)}
              </span>
            </div>
          )}
        </div>

        {/* Enhanced Content */}
        <CardContent className="p-3 sm:p-4">
          {/* Shop Name and Tagline */}
          <div className="mb-3">
            <h3 className="font-semibold text-base sm:text-lg text-foreground mb-1 group-hover:text-accent transition-colors">
              {shop.store_name}
            </h3>
            {shop.store_tagline && (
              <p className="text-xs sm:text-sm text-muted-foreground italic line-clamp-1">
                "{shop.store_tagline}"
              </p>
            )}
          </div>

          {/* Business Type */}
          {shop.business_type && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-2">
              <Package className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{getBusinessTypeLabel(shop.business_type)}</span>
            </div>
          )}

          {/* Description */}
          {shop.description && (
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">
              {shop.description}
            </p>
          )}

          {/* Location */}
          {(shop.city || shop.country) && (
            <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mb-3">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="truncate">
                {shop.city && shop.country ? `${shop.city}, ${shop.country}` : shop.city || shop.country}
              </span>
            </div>
          )}

          {/* Rating and Reviews */}
          {shop.rating > 0 && (
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 sm:w-4 sm:h-4 ${
                      i < Math.floor(shop.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-1">
                <span className="text-xs sm:text-sm font-medium">{shop.rating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({shop.total_orders} reviews)</span>
              </div>
            </div>
          )}

          {/* Enhanced Contact Info */}
          <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mb-4">
            {shop.contact_email && (
              <div className="flex items-center gap-1 truncate flex-1 min-w-0">
                <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{shop.contact_email}</span>
              </div>
            )}
            {shop.contact_phone && (
              <div className="flex items-center gap-1 truncate flex-1 min-w-0">
                <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{shop.contact_phone}</span>
              </div>
            )}
            {shop.website && (
              <div className="flex items-center gap-1 truncate flex-1 min-w-0">
                <Globe className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Website</span>
              </div>
            )}
          </div>

          {/* Social Media Links */}
          {(shop.social_facebook || shop.social_instagram || shop.social_linkedin) && (
            <div className="flex gap-2 mb-4">
              {shop.social_facebook && (
                <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-300">f</span>
                </div>
              )}
              {shop.social_instagram && (
                <div className="w-6 h-6 rounded bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-pink-600 dark:text-pink-300">i</span>
                </div>
              )}
              {shop.social_linkedin && (
                <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-300">in</span>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Action Button */}
          <Button 
            className="w-full group-hover:bg-accent group-hover:text-accent-foreground transition-all"
            style={{
              backgroundColor: shop.accent_color ? shop.accent_color : undefined
            }}
          >
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
  const { data: shops, loading, error, refresh, lastUpdate } = usePartnerProfiles();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredShops = (shops || []).filter(shop => {
    const searchLower = searchTerm.toLowerCase();
    const searchWords = searchLower.split(' ').filter(word => word.length > 0);
    
    // If no search term and no category filter, show all shops
    if (searchWords.length === 0 && categoryFilter === 'all' && countryFilter === 'all') {
      return true;
    }
    
    // Enhanced search terms for automotive categories
    const automotiveKeywords = {
      cars: ['car', 'cars', 'vehicle', 'vehicles', 'automotive', 'auto', 'motor', 'motor vehicle'],
      parts: ['part', 'parts', 'component', 'components', 'spare', 'spares', 'replacement', 'oem', 'aftermarket'],
      accessories: ['accessory', 'accessories', 'gear', 'gears', 'equipment', 'tools', 'electronics', 'interior', 'exterior']
    };

    // Check if any search word matches
    const hasSearchMatch = searchWords.some(word => 
      shop.store_name.toLowerCase().includes(word) ||
      shop.description?.toLowerCase().includes(word) ||
      shop.city?.toLowerCase().includes(word) ||
      shop.country?.toLowerCase().includes(word)
    );

    // Check for automotive category matches
    const hasAutomotiveMatch = searchWords.some(word => {
      // Cars/Vehicles category
      if (automotiveKeywords.cars.includes(word)) {
        return shop.description?.toLowerCase().includes('car') || 
               shop.description?.toLowerCase().includes('vehicle') || 
               shop.description?.toLowerCase().includes('automotive') ||
               shop.description?.toLowerCase().includes('motor') ||
               shop.store_name.toLowerCase().includes('car') ||
               shop.store_name.toLowerCase().includes('auto');
      }
      
      // Parts category
      if (automotiveKeywords.parts.includes(word)) {
        return shop.description?.toLowerCase().includes('part') || 
               shop.description?.toLowerCase().includes('component') ||
               shop.description?.toLowerCase().includes('spare') ||
               shop.description?.toLowerCase().includes('oem') ||
               shop.store_name.toLowerCase().includes('part');
      }
      
      // Accessories category
      if (automotiveKeywords.accessories.includes(word)) {
        return shop.description?.toLowerCase().includes('accessory') || 
               shop.description?.toLowerCase().includes('gear') ||
               shop.description?.toLowerCase().includes('equipment') ||
               shop.description?.toLowerCase().includes('interior') ||
               shop.description?.toLowerCase().includes('exterior') ||
               shop.store_name.toLowerCase().includes('accessory');
      }
      
      return false;
    });

    // If no search words, return true (show all shops)
    if (searchWords.length === 0) {
      return true;
    }

    return hasSearchMatch || hasAutomotiveMatch;
  });

  console.log('Final filtered shops count:', filteredShops?.length || 0);

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

          
          {/* Search Only */}
          <div className="mb-6 sm:mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search shops, cars, vehicles, parts, accessories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 sm:h-11 pl-9 sm:pl-10 pr-4 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-shadow text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Results Count and Refresh */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-muted-foreground">
              {loading ? 'Loading...' : `Showing ${filteredShops?.length || 0} of ${shops?.length || 0} shops`}
            </p>
            <div className="flex items-center gap-4">
              {lastUpdate && (
                <span className="text-xs text-muted-foreground">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {/* Shops Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading shops...</p>
              </div>
            </div>
          ) : (filteredShops?.length || 0) === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <Store className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">No shops found</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Try adjusting your search terms or filters to find shops.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4 w-full sm:w-auto"
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
            <div className={`grid gap-4 sm:gap-6 ${
              viewMode === "grid" 
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1"
            }`}>
              {(filteredShops || []).map((shop) => (
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
