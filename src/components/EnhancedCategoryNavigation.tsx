import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { 
  Car, 
  Gauge, 
  Settings, 
  Battery, 
  PaintBucket, 
  Wrench, 
  Droplets, 
  Hammer, 
  Star,
  Building2,
  Truck,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Enhanced category structure with icons and B2B focus
const enhancedCategories = [
  {
    id: "vehicles",
    label: "Vehicles",
    icon: Car,
    description: "Cars, trucks, SUVs & commercial",
    product_type: "cars",
    color: "bg-blue-600",
    count: "15K+"
  },
  {
    id: "engine",
    label: "Engine Parts",
    icon: Gauge,
    description: "Complete engines & components",
    product_type: "parts",
    subcategory: "Engine & Components",
    color: "bg-red-600",
    count: "25K+"
  },
  {
    id: "transmission",
    label: "Transmission",
    icon: Settings,
    description: "Gearboxes & drivetrain",
    product_type: "parts",
    subcategory: "Transmission & Drivetrain",
    color: "bg-green-600",
    count: "8K+"
  },
  {
    id: "suspension",
    label: "Suspension",
    icon: Car,
    description: "Shocks, struts & steering",
    product_type: "parts",
    subcategory: "Suspension & Steering",
    color: "bg-purple-600",
    count: "12K+"
  },
  {
    id: "brakes",
    label: "Brakes",
    icon: Shield,
    description: "Brake systems & components",
    product_type: "parts",
    subcategory: "Brakes & Suspension",
    color: "bg-orange-600",
    count: "10K+"
  },
  {
    id: "electrical",
    label: "Electrical",
    icon: Battery,
    description: "Wiring, lighting & electronics",
    product_type: "parts",
    subcategory: "Electrical & Lighting",
    color: "bg-yellow-600",
    count: "18K+"
  },
  {
    id: "interior",
    label: "Interior",
    icon: PaintBucket,
    description: "Seats, trim & accessories",
    product_type: "accessories",
    subcategory: "Interior & Trim",
    color: "bg-pink-600",
    count: "20K+"
  },
  {
    id: "exterior",
    label: "Exterior",
    icon: Car,
    description: "Body parts & exterior accessories",
    product_type: "accessories",
    subcategory: "Exterior & Body",
    color: "bg-indigo-600",
    count: "14K+"
  },
  {
    id: "performance",
    label: "Performance",
    icon: Gauge,
    description: "Tuning & racing parts",
    product_type: "parts",
    subcategory: "Performance & Racing",
    color: "bg-teal-600",
    count: "6K+"
  },
  {
    id: "tools",
    label: "Tools & Equipment",
    icon: Wrench,
    description: "Professional automotive tools",
    product_type: "accessories",
    subcategory: "Tools & Equipment",
    color: "bg-gray-600",
    count: "5K+"
  },
  {
    id: "maintenance",
    label: "Maintenance",
    icon: Droplets,
    description: "Fluids, filters & consumables",
    product_type: "parts",
    subcategory: "Maintenance & Consumables",
    color: "bg-cyan-600",
    count: "22K+"
  },
  {
    id: "commercial",
    label: "Commercial",
    icon: Truck,
    description: "Heavy duty & fleet parts",
    product_type: "parts",
    subcategory: "Commercial Vehicles",
    color: "bg-slate-600",
    count: "7K+"
  }
];

interface EnhancedCategoryNavigationProps {
  className?: string;
  showAllButton?: boolean;
  compact?: boolean;
}

export default function EnhancedCategoryNavigation({ 
  className, 
  showAllButton = true,
  compact = false 
}: EnhancedCategoryNavigationProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentCategory = searchParams.get("category") || "all";
  const currentSubcategory = searchParams.get("subcategory") || "";

  const handleCategoryClick = (category: typeof enhancedCategories[0]) => {
    // Navigate to products page with category filter
    const params = new URLSearchParams();
    
    if (category.id === "all") {
      // Navigate to products page without filters
      navigate("/products");
    } else {
      // Navigate to products page with category filter
      params.set("category", category.id);
      if (category.subcategory) {
        params.set("subcategory", category.subcategory);
      }
      navigate(`/products?${params.toString()}`);
    }
  };

  const isActive = (category: typeof enhancedCategories[0]) => {
    if (category.id === "all") {
      return currentCategory === "all";
    }
    const matchesMainCategory = currentCategory === category.id;
    const matchesSubcategory = !category.subcategory || currentSubcategory === category.subcategory;
    return matchesMainCategory && matchesSubcategory;
  };

  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {enhancedCategories.map((category) => {
          const Icon = category.icon;
          const active = isActive(category);
          
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-blue-600 text-white shadow-lg scale-105"
                  : "bg-card border border-border text-foreground hover:border-blue-300 hover:bg-blue-50"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{category.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Shop by Category
          </h2>
          <p className="text-muted-foreground">
            Browse our extensive catalog of automotive products and parts
          </p>
        </div>
        <Link to="/products">
          <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
            View All Categories
          </Button>
        </Link>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {showAllButton && (
          <button
            onClick={() => {
              navigate("/products");
            }}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:shadow-lg group",
              currentCategory === "all"
                ? "border-blue-600 bg-blue-50 text-blue-600"
                : "border-border bg-card hover:border-blue-300 text-foreground"
            )}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <span className="text-white text-xl font-bold">✦</span>
            </div>
            <span className="text-sm font-semibold">All Products</span>
            <span className="text-xs text-muted-foreground mt-1">150K+ Items</span>
          </button>
        )}
        
        {enhancedCategories.map((category) => {
          const Icon = category.icon;
          const active = isActive(category);
          
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:shadow-lg group",
                active
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-border bg-card hover:border-blue-300 text-foreground"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all group-hover:scale-110",
                active ? category.color : "bg-slate-100"
              )}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-center">{category.label}</span>
              <span className="text-xs text-muted-foreground mt-1">{category.count} Products</span>
              {!active && (
                <span className="text-xs text-muted-foreground mt-2 text-center line-clamp-2">
                  {category.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Active filters display */}
      {(currentCategory !== "all" || currentSubcategory) && (
        <div className="mt-6 flex items-center gap-3 flex-wrap p-4 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm font-medium text-blue-900">Active filters:</span>
          {currentCategory !== "all" && (
            <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">
              {enhancedCategories.find(c => c.id === currentCategory)?.label || currentCategory}
            </span>
          )}
          {currentSubcategory && (
            <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm">
              {currentSubcategory}
            </span>
          )}
          <button
            onClick={() => {
              searchParams.delete("category");
              searchParams.delete("subcategory");
              setSearchParams(searchParams);
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* B2B Features */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
          <Shield className="w-5 h-5 text-green-600" />
          <div>
            <div className="text-sm font-semibold text-green-900">Quality Guaranteed</div>
            <div className="text-xs text-green-700">All parts inspected and verified</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Building2 className="w-5 h-5 text-blue-600" />
          <div>
            <div className="text-sm font-semibold text-blue-900">Bulk Pricing</div>
            <div className="text-xs text-blue-700">Discounts for large orders</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <Truck className="w-5 h-5 text-purple-600" />
          <div>
            <div className="text-sm font-semibold text-purple-900">Global Shipping</div>
            <div className="text-xs text-purple-700">Delivery to 150+ countries</div>
          </div>
        </div>
      </div>
    </div>
  );
}
