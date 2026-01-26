import { Link } from "react-router-dom";
import { Search, ShoppingCart, User, Menu, X, ChevronDown, Heart, Package, Bell, Building2, Globe, Shield, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import NotificationsModal from "@/components/Notifications/NotificationsModal";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState("/");
  const { getItemCount } = useCart();
  const { user, userProfile, signOut } = useAuth();

  // Make notifications modal globally accessible
  useEffect(() => {
    (window as any).openNotificationsModal = () => setIsNotificationsOpen(true);
    (window as any).closeNotificationsModal = () => setIsNotificationsOpen(false);
    
    return () => {
      delete (window as any).openNotificationsModal;
      delete (window as any).closeNotificationsModal;
    };
  }, []);

  const navLinks = [
    { name: "Products", href: "/products", dropdown: [
      { name: "All Products", href: "/products" },
      { name: "Vehicles", href: "/products?category=cars" },
      { name: "Engine Parts", href: "/products?category=engine" },
      { name: "Accessories", href: "/products?category=accessories" },
    ]},
    { name: "Suppliers", href: "/manufacturers", dropdown: [
      { name: "All Suppliers", href: "/manufacturers" },
      { name: "Verified Suppliers", href: "/manufacturers?verified=true" },
      { name: "Top Rated", href: "/manufacturers?rating=5" },
    ]},
    { name: "Services", href: "#", dropdown: [
      { name: "Trade Assurance", href: "/trade-assurance" },
      { name: "Logistics", href: "/shipping" },
      { name: "Inspection Service", href: "/inspection" },
      { name: "Financing", href: "/financing" },
    ]},
    { name: "Resources", href: "#", dropdown: [
      { name: "Buyer Guide", href: "/help" },
      { name: "Supplier Guide", href: "/partner/info" },
      { name: "FAQ", href: "/faq" },
      { name: "Support", href: "/contact" },
    ]},
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
    <>
      {/* Top Business Bar */}
      <div className="bg-slate-900 text-white py-2 px-4 text-sm">
        <div className="container-wide flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              Trade Assurance
            </span>
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              Worldwide Shipping
            </span>
            <span className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-400" />
              10,000+ Suppliers
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">Mon-Fri: 9AM-6PM EST</span>
            <Button variant="ghost" size="sm" className="text-white hover:bg-slate-800 h-auto p-0">
              <Headphones className="w-4 h-4 mr-1" />
              Support
            </Button>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="container-wide">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.svg" alt="AutoTradeHub" className="w-10 h-10" />
              <div>
                <span className="font-bold text-xl text-foreground">AutoTradeHub</span>
                <div className="text-xs text-muted-foreground">B2B Automotive Marketplace</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <div key={link.name} className="relative group">
                  <Link 
                    to={link.href}
                    className="flex items-center gap-1 px-4 py-2 text-foreground hover:text-blue-600 font-medium text-sm transition-colors"
                  >
                    {link.name}
                    {link.dropdown && <ChevronDown className="w-4 h-4" />}
                  </Link>
                  
                  {/* Dropdown Menu */}
                  {link.dropdown && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      {link.dropdown.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className="block px-4 py-3 text-sm text-foreground hover:bg-blue-50 hover:text-blue-600 transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Search Button */}
              <Link to="/products">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-600">
                  <Search className="w-4 h-4" />
                </Button>
              </Link>
              
              <Link to="/cart">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-600 relative">
                  <ShoppingCart className="w-4 h-4" />
                  {getItemCount() > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold">
                      {getItemCount()}
                    </span>
                  )}
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-blue-600 relative"
                onClick={() => setIsNotificationsOpen(true)}
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500"></span>
              </Button>
              
              <Link to="/liked-items">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-600">
                  <Heart className="w-4 h-4" />
                </Button>
              </Link>
              
              {user && (
                <Link to="/my-orders">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-600" title="My Orders">
                    <Package className="w-4 h-4" />
                  </Button>
                </Link>
              )}
              
              <ThemeSwitcher />
              
              <div className="flex items-center gap-2 pl-3 border-l border-border">
                {user ? (
                  <>
                    <Link to={dashboardUrl}>
                      <Button variant="outline" size="sm" className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                        <User className="w-3 h-3 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-600" onClick={signOut}>
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-600">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/become-partner">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        Become Supplier
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className="lg:hidden py-4 border-t border-border">
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <div key={link.name}>
                    <Link
                      to={link.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between px-4 py-3 text-foreground hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <span className="font-medium">{link.name}</span>
                      {link.dropdown && <ChevronDown className="w-4 h-4" />}
                    </Link>
                    
                    {/* Mobile Dropdown */}
                    {link.dropdown && (
                      <div className="pl-4 pr-4 pb-2">
                        {link.dropdown.map((item) => (
                          <Link
                            key={item.name}
                            to={item.href}
                            onClick={() => setIsOpen(false)}
                            className="block px-4 py-2 text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="flex flex-col gap-2 px-4 pt-4 border-t border-border mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Link to="/cart" className="flex-1">
                      <Button variant="outline" className="w-full gap-2 relative text-xs">
                        <ShoppingCart className="w-3 h-3" />
                        Cart
                        {getItemCount() > 0 && (
                          <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold">
                            {getItemCount()}
                          </span>
                        )}
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2 relative text-xs"
                      onClick={() => setIsNotificationsOpen(true)}
                    >
                      <Bell className="w-3 h-3" />
                      Notif
                      <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-red-500"></span>
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link to="/liked-items" className="flex-1">
                      <Button variant="outline" className="w-full gap-2 text-xs">
                        <Heart className="w-3 h-3" />
                        Liked
                      </Button>
                    </Link>
                    {user && (
                      <Link to="/my-orders" className="flex-1">
                        <Button variant="outline" className="w-full gap-2 text-xs">
                          <Package className="w-3 h-3" />
                          Orders
                        </Button>
                      </Link>
                    )}
                  </div>
                  {user ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Link to={dashboardUrl} className="flex-1">
                        <Button variant="outline" className="w-full gap-2 text-xs">
                          <User className="w-3 h-3" />
                          Dashboard
                        </Button>
                      </Link>
                      <Button variant="ghost" className="flex-1 text-xs" onClick={signOut}>
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Link to="/auth" className="flex-1">
                        <Button variant="outline" className="w-full text-xs">
                          Sign In
                        </Button>
                      </Link>
                      <Link to="/become-partner" className="flex-1">
                        <Button className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white">
                          Supplier
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
      
      {/* Notifications Modal */}
      <NotificationsModal 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
      />
    </>
  );
};

export default Navbar;
