import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { 
  Car, 
  Gauge, 
  Settings, 
  Battery, 
  PaintBucket, 
  Wrench, 
  Droplets, 
  Hammer, 
  Star 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Enhanced category structure with icons
const enhancedCategories = [
  {
    id: "vehicles",
    label: "Vehicles",
    icon: Car,
    description: "Cars, trucks, SUVs & more",
    product_type: "cars",
    color: "bg-blue-500"
  },
  {
    id: "engine",
    label: "Engine",
    icon: Gauge,
    description: "Engine components & kits",
    product_type: "parts",
    subcategory: "Engine & Components",
    color: "bg-red-500"
  },
  {
    id: "transmission",
    label: "Transmission",
    icon: Settings,
    description: "Transmission systems",
    product_type: "parts",
    subcategory: "Transmission & Drivetrain",
    color: "bg-green-500"
  },
  {
    id: "suspension",
    label: "Suspension",
    icon: Car,
    description: "Suspension & steering",
    product_type: "parts",
    subcategory: "Suspension & Steering",
    color: "bg-purple-500"
  },
  {
    id: "brakes",
    label: "Brakes",
    icon: Settings,
    description: "Brake systems & components",
    product_type: "parts",
    subcategory: "Brakes & Suspension",
    color: "bg-orange-500"
  },
  {
    id: "electrical",
    label: "Electrical",
    icon: Battery,
    description: "Electrical systems & lighting",
    product_type: "parts",
    subcategory: "Electrical & Lighting",
    color: "bg-yellow-500"
  },
  {
    id: "interior",
    label: "Interior",
    icon: PaintBucket,
    description: "Interior accessories & trim",
    product_type: "accessories",
    subcategory: "Interior & Trim",
    color: "bg-pink-500"
  },
  {
    id: "exterior",
    label: "Exterior",
    icon: Car,
    description: "Exterior accessories & body",
    product_type: "accessories",
    subcategory: "Exterior & Body",
    color: "bg-indigo-500"
  },
  {
    id: "performance",
    label: "Performance",
    icon: Gauge,
    description: "Performance parts & tuning",
    product_type: "parts",
    subcategory: "Performance & Racing",
    color: "bg-teal-500"
  },
  {
    id: "tools",
    label: "Tools",
    icon: Wrench,
    description: "Automotive tools & equipment",
    product_type: "accessories",
    subcategory: "Tools & Equipment",
    color: "bg-gray-500"
  },
  {
    id: "maintenance",
    label: "Maintenance",
    icon: Droplets,
    description: "Fluids, filters & care",
    product_type: "parts",
    subcategory: "Maintenance & Consumables",
    color: "bg-cyan-500"
  },
  {
    id: "parts",
    label: "Parts",
    icon: Hammer,
    description: "General parts & components",
    product_type: "parts",
    color: "bg-amber-500"
  },
  {
    id: "accessories",
    label: "Accessories",
    icon: Star,
    description: "General accessories & gear",
    product_type: "accessories",
    color: "bg-lime-500"
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
  const currentCategory = searchParams.get("category") || "all";
  const currentSubcategory = searchParams.get("subcategory") || "";

  const handleCategoryClick = (category: typeof enhancedCategories[0]) => {
    if (category.id === "all") {
      searchParams.delete("category");
      searchParams.delete("subcategory");
    } else {
      searchParams.set("category", category.product_type);
      if (category.subcategory) {
        searchParams.set("subcategory", category.subcategory);
      } else {
        searchParams.delete("subcategory");
      }
    }
    setSearchParams(searchParams);
  };

  const isActive = (category: typeof enhancedCategories[0]) => {
    if (category.id === "all") {
      return currentCategory === "all";
    }
    const matchesMainCategory = currentCategory === category.product_type;
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
                  ? "bg-accent text-accent-foreground shadow-lg scale-105"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
        {showAllButton && (
          <button
            onClick={() => {
              searchParams.delete("category");
              searchParams.delete("subcategory");
              setSearchParams(searchParams);
            }}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:shadow-lg",
              currentCategory === "all"
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-card hover:border-accent/50 text-foreground"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mb-2">
              <span className="text-white text-lg font-bold">✦</span>
            </div>
            <span className="text-sm font-medium">All</span>
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
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-card hover:border-accent/50 text-foreground"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all group-hover:scale-110",
                active ? category.color : "bg-muted"
              )}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-center">{category.label}</span>
              {!active && (
                <span className="text-xs text-muted-foreground mt-1 text-center line-clamp-2">
                  {category.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Active filters display */}
      {(currentCategory !== "all" || currentSubcategory) && (
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {currentCategory !== "all" && (
            <span className="px-2 py-1 bg-accent/10 text-accent rounded text-sm">
              {enhancedCategories.find(c => c.product_type === currentCategory)?.label || currentCategory}
            </span>
          )}
          {currentSubcategory && (
            <span className="px-2 py-1 bg-accent/10 text-accent rounded text-sm">
              {currentSubcategory}
            </span>
          )}
          <button
            onClick={() => {
              searchParams.delete("category");
              searchParams.delete("subcategory");
              setSearchParams(searchParams);
            }}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
