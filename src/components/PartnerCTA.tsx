import { Link } from "react-router-dom";
import { ArrowRight, Store, TrendingUp, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    icon: Store,
    title: "Your Own Store",
    description: "Create a branded storefront with your logo and custom pricing",
  },
  {
    icon: DollarSign,
    title: "Competitive Margins",
    description: "Set your own prices and earn generous commissions on every sale",
  },
  {
    icon: TrendingUp,
    title: "Analytics Dashboard",
    description: "Track visitors, conversions, and revenue in real-time",
  },
  {
    icon: Users,
    title: "Growing Network",
    description: "Join 500+ successful partners across 80+ countries",
  },
];

const PartnerCTA = () => {
  return (
    <section className="section-padding bg-primary relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      {/* Accent Blur */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />

      <div className="container-wide relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 text-accent mb-6">
              <Store className="w-4 h-4" />
              <span className="text-sm font-medium">Partner Program</span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6 leading-tight">
              Start Your Own
              <span className="block text-gradient">Auto Business</span>
            </h2>
            
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-lg">
              Become a drop-shipping partner and sell cars, parts, and accessories from our catalog. 
              No inventory needed — we handle shipping and logistics.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/become-partner">
                <Button 
                  variant="hero" 
                  size="xl" 
                  className="gap-2 w-full sm:w-auto"
                >
                  Become a Partner
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/partner/info">
                <Button variant="hero-outline" size="xl" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Content - Benefits */}
          <div className="grid sm:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-primary-foreground/5 border border-primary-foreground/10 backdrop-blur-sm hover:bg-primary-foreground/10 transition-colors animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-primary-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-primary-foreground/70">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnerCTA;
