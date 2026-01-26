import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Search, Car, Wrench, Package, Building2, Globe, Shield, TrendingUp, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import heroImage from "@/assets/hero-car.jpg";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const businessStats = [
    { icon: Building2, value: "10,000+", label: "Verified Suppliers" },
    { icon: Globe, value: "150+", label: "Countries Served" },
    { icon: Shield, value: "100%", label: "Quality Guaranteed" },
    { icon: TrendingUp, value: "$50M+", label: "Annual Trade Volume" }
  ];

  return (
    <section className="relative min-h-[85vh] bg-gradient-to-br from-muted to-card border-b border-border">
      {/* Professional Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(0,0,0,0.1)_1px,transparent_0)] [background-size:30px_30px]" />
      </div>

      {/* Main Content */}
      <div className="relative container-wide py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            {/* B2B Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 mb-6">
              <Building2 className="w-4 h-4" />
              <span className="text-sm font-semibold">B2B AUTOMOTIVE MARKETPLACE</span>
            </div>

            {/* Professional Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Global Automotive
              <span className="block text-blue-600">Trading Platform</span>
            </h1>

            {/* B2B Description */}
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              Connect with verified automotive suppliers worldwide. Source vehicles, parts, and accessories at wholesale prices with secure trade protection.
            </p>

            {/* Professional Search Bar */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-2 mb-8">
              <div className="flex flex-col lg:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products, suppliers, or part numbers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full h-12 pl-12 pr-4 bg-transparent text-foreground placeholder:text-gray-400 border-0 focus:ring-0 outline-none"
                  />
                </div>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 font-semibold"
                  onClick={handleSearch}
                >
                  Search Products
                </Button>
              </div>
              
              {/* Quick Links */}
              <div className="flex flex-wrap gap-2 mt-3 px-2">
                <span className="text-sm text-gray-500">Popular:</span>
                {["Toyota Parts", "BMW Engines", "Auto Accessories", "Truck Parts"].map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setSearchQuery(term);
                      handleSearch();
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* B2B Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link to="/products">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold gap-2"
                >
                  <Car className="w-5 h-5" />
                  Browse Categories
                </Button>
              </Link>
              <Link to="/become-partner">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-2 border-slate-600 text-muted-foreground hover:bg-slate-600 hover:text-white font-semibold gap-2"
                >
                  <Building2 className="w-5 h-5" />
                  Become a Supplier
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Trade Assurance</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Worldwide Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-600" />
                <span>Secure Payment</span>
              </div>
            </div>
          </div>

          {/* Right Content - Business Stats */}
          <div className="hidden lg:block">
            <div className="bg-gradient-to-br from-blue-600 to-slate-800 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Platform Statistics</h3>
              <div className="grid grid-cols-2 gap-6">
                {businessStats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="text-center">
                      <div className="w-12 h-12 bg-card/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-2xl font-bold mb-1">{stat.value}</div>
                      <div className="text-sm text-blue-100">{stat.label}</div>
                    </div>
                  );
                })}
              </div>
              
              {/* CTA for Suppliers */}
              <div className="mt-8 pt-6 border-t border-white/20">
                <p className="text-sm text-blue-100 mb-4">
                  Join thousands of suppliers growing their business on our platform
                </p>
                <Link to="/become-partner">
                  <Button className="w-full bg-card text-blue-600 hover:bg-blue-50 font-semibold">
                    Start Selling Today
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Categories Bar */}
      <div className="bg-muted border-t border-border py-6">
        <div className="container-wide">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Top Categories</h3>
            <Link to="/products" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { icon: Car, name: "Vehicles", count: "15K+" },
              { icon: Wrench, name: "Engine Parts", count: "25K+" },
              { icon: Settings, name: "Transmission", count: "8K+" },
              { icon: Package, name: "Accessories", count: "30K+" },
              { icon: Shield, name: "Body Parts", count: "12K+" },
              { icon: Building2, name: "Tools", count: "5K+" }
            ].map((category, index) => {
              const Icon = category.icon;
              return (
                <Link
                  key={index}
                  to={`/products?category=${category.name.toLowerCase().replace(' ', '-')}`}
                  className="bg-card rounded-lg border border-border p-4 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground text-sm">{category.name}</div>
                      <div className="text-xs text-gray-500">{category.count} Products</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
