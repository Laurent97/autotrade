import { Link } from "react-router-dom";
import { ArrowRight, Store, TrendingUp, DollarSign, Users, Building2, Globe, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    icon: Store,
    title: "Professional Storefront",
    description: "Create a branded digital showroom with custom pricing and catalogs",
    features: ["Custom branding", "Product catalog", "Price management"]
  },
  {
    icon: DollarSign,
    title: "Competitive Commissions",
    description: "Earn generous margins with flexible pricing and volume bonuses",
    features: ["Up to 25% commission", "Volume discounts", "Performance bonuses"]
  },
  {
    icon: TrendingUp,
    title: "Business Analytics",
    description: "Advanced dashboard with real-time insights and growth metrics",
    features: ["Real-time data", "Sales analytics", "Market insights"]
  },
  {
    icon: Users,
    title: "Global Network",
    description: "Connect with 500+ successful partners across 80+ countries",
    features: ["Global reach", "Partner community", "Networking events"]
  }
];

const PartnerCTA = () => {
  return (
    <section className="section-padding bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.3)_1px,transparent_0)] [background-size:40px_40px]" />
      </div>
      
      {/* Accent Elements */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />

      <div className="container-wide relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            {/* B2B Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 mb-6">
              <Building2 className="w-4 h-4" />
              <span className="text-sm font-semibold">PARTNER PROGRAM</span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Grow Your Automotive
              <span className="block text-gradient bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Business with Us
              </span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Join our global B2B marketplace and connect with thousands of buyers worldwide. 
              Leverage our platform, logistics, and expertise to scale your automotive business.
            </p>

            {/* Key Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { value: "500+", label: "Partners" },
                { value: "80+", label: "Countries" },
                { value: "$2M+", label: "Avg. Revenue" }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{stat.value}</div>
                  <div className="text-xs text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link to="/become-partner">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 w-full sm:w-auto"
                >
                  Become a Partner
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/partner/info">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-slate-600 text-muted-foreground hover:bg-slate-800 hover:text-white w-full sm:w-auto"
                >
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                <span>Quick approval</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" />
                <span>Global support</span>
              </div>
            </div>
          </div>

          {/* Right Content - Benefits */}
          <div className="grid sm:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 hover:border-blue-600/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-bold text-white mb-3 text-lg">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {benefit.description}
                </p>
                <ul className="space-y-2">
                  {benefit.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Partner Testimonial */}
        <div className="mt-16 p-8 bg-slate-800/50 rounded-2xl border border-slate-700">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-600/20 border border-green-500/30 text-green-400 mb-4">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">SUCCESS STORIES</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Join Thousands of Successful Partners
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              "AutoTradeHub transformed our business. We reached international markets we never thought possible 
              and increased our revenue by 300% in the first year."
            </p>
            <div className="mt-4">
              <div className="font-semibold text-white">Michael Chen</div>
              <div className="text-sm text-slate-400">CEO, Chen Automotive Parts</div>
            </div>
          </div>
          
          {/* Partner Logos */}
          <div className="flex flex-wrap justify-center items-center gap-8 mt-8 pt-8 border-t border-slate-700">
            <div className="text-slate-500 text-sm">Trusted by leading automotive brands:</div>
            {["AutoParts Pro", "Global Motors", "Speed Components", "Elite Auto"].map((brand, index) => (
              <div key={index} className="px-4 py-2 bg-slate-700/50 rounded-lg text-slate-400 text-sm font-medium">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnerCTA;
