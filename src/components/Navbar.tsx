import { Link } from "react-router-dom";
import { Search, ShoppingCart, User, Menu, X, ChevronDown, Heart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState("/");
  const { getItemCount } = useCart();
  const { user, userProfile, signOut } = useAuth();

  const navLinks = [
    { name: "Cars", href: "/products?category=cars" },
    { name: "Parts", href: "/products?category=parts" },
    { name: "Accessories", href: "/products?category=accessories" },
    { name: "Partner Shops", href: "/manufacturers" },
    { name: "Become a Partner", href: "#partner", action: "openModal" },
  ];

  // Update dashboard URL when user profile changes
  useEffect(() => {
    if (!user) {
      setDashboardUrl("/auth");
      return;
    }

    const userType = userProfile?.user_type || 'customer';

    if (userType === 'admin') {
      setDashboardUrl("/admin");
    } else if (userType === 'partner' || userProfile?.partner_status === 'approved') {
      // Route to partner dashboard if user is partner OR has approved partner profile
      setDashboardUrl("/partner/dashboard");
    } else {
      // For customers without partner profile, go home
      setDashboardUrl("/");
    }
  }, [user, userProfile]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container-wide">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="AutoTradeHub" className="w-10 h-10" />
            <span className="font-bold text-xl text-foreground">AutoTradeHub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              link.action === "openModal" ? (
                <Button 
                  key={link.name} 
                  variant="nav" 
                  size="sm" 
                  className="text-sm"
                  onClick={() => (window as any).openPartnerModal?.()}
                >
                  {link.name}
                </Button>
              ) : (
                <Link key={link.name} to={link.href}>
                  <Button variant="nav" size="sm" className="text-sm">
                    {link.name}
                  </Button>
                </Link>
              )
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                <ShoppingCart className="w-5 h-5" />
                {getItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-semibold animate-bounce-subtle">
                    {getItemCount()}
                  </span>
                )}
              </Button>
            </Link>
            <Link to="/liked-items">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Heart className="w-5 h-5" />
              </Button>
            </Link>
            {user && (
              <Link to="/my-orders">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="My Orders">
                  <Package className="w-5 h-5" />
                </Button>
              </Link>
            )}
            <ThemeSwitcher />
            {user ? (
              <div className="flex items-center gap-2">
                <Link to={dashboardUrl}>
                  <Button variant="outline" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="accent" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-slide-up">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                link.action === "openModal" ? (
                  <button
                    key={link.name}
                    onClick={() => {
                      (window as any).openPartnerModal?.();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-foreground hover:bg-secondary rounded-lg transition-colors"
                  >
                    {link.name}
                  </button>
                ) : (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-3 text-foreground hover:bg-secondary rounded-lg transition-colors"
                  >
                    {link.name}
                  </Link>
                )
              ))}
              <div className="flex gap-2 px-4 pt-4 border-t border-border mt-2">
                <Link to="/cart" className="flex-1">
                  <Button variant="outline" className="w-full gap-2 relative">
                    <ShoppingCart className="w-4 h-4" />
                    Cart
                    {getItemCount() > 0 && (
                      <span className="absolute top-0 right-2 w-5 h-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-semibold">
                        {getItemCount()}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link to="/liked-items" className="flex-1">
                  <Button variant="outline" className="w-full gap-2">
                    <Heart className="w-4 h-4" />
                    Liked
                  </Button>
                </Link>
                {user && (
                  <Link to="/my-orders" className="flex-1">
                    <Button variant="outline" className="w-full gap-2">
                      <Package className="w-4 h-4" />
                      Orders
                    </Button>
                  </Link>
                )}
                {user ? (
                  <>
                    <Link to={dashboardUrl} className="flex-1">
                      <Button variant="outline" className="w-full gap-2">
                        <User className="w-4 h-4" />
                        Dashboard
                      </Button>
                    </Link>
                    <Button variant="ghost" className="flex-1" onClick={signOut}>
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Link to="/auth" className="flex-1">
                    <Button variant="accent" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
