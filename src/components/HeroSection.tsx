import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Search, Car, Wrench, Package } from "lucide-react";
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
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-primary">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Luxury car"
          className="w-full h-full object-cover object-center opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container-wide py-32">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 text-accent mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-medium">Trusted by 50,000+ customers worldwide</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-primary-foreground leading-tight mb-6 animate-slide-up">
            Your Global
            <span className="block text-gradient">Automotive</span>
            Marketplace
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-primary-foreground max-w-xl mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Discover premium vehicles, parts, and accessories from trusted sellers worldwide. Quality guaranteed, delivered to your doorstep.
          </p>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search cars, parts, accessories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full h-14 pl-12 pr-4 rounded-xl bg-card text-foreground placeholder:text-muted-foreground border-0 focus:ring-2 focus:ring-accent outline-none shadow-lg"
              />
            </div>
            <Button variant="hero" size="xl" className="gap-2" onClick={handleSearch}>
              Search Now
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Quick Categories */}
          <div className="flex flex-wrap gap-3 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <Link to="/products?category=car">
              <Button variant="hero-outline" size="lg" className="gap-2">
                <Car className="w-5 h-5" />
                Browse Cars
              </Button>
            </Link>
            <Link to="/products?category=part">
              <Button variant="hero-outline" size="lg" className="gap-2">
                <Wrench className="w-5 h-5" />
                Shop Parts
              </Button>
            </Link>
            <Link to="/products?category=accessory">
              <Button variant="hero-outline" size="lg" className="gap-2">
                <Package className="w-5 h-5" />
                Accessories
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="absolute bottom-12 right-8 hidden lg:grid grid-cols-3 gap-8 animate-slide-in-right" style={{ animationDelay: "0.4s" }}>
          {[
            { value: "15K+", label: "Vehicles" },
            { value: "100K+", label: "Parts" },
            { value: "150+", label: "Countries" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-black text-accent mb-1">{stat.value}</div>
              <div className="text-sm text-primary-foreground/80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
