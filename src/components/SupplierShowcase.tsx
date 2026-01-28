import { Link } from "react-router-dom";
import { Star, MapPin, Building2, CheckCircle, ArrowRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

const topSuppliers = [
  {
    id: 1,
    name: "Global Auto Parts Ltd",
    location: "Shanghai, China",
    rating: 4.9,
    reviews: 2847,
    products: 1250,
    verified: true,
    specialties: ["Engine Parts", "Transmission", "Electrical"],
    responseTime: "2 hours",
    annualRevenue: "$5M+"
  },
  {
    id: 2,
    name: "European Motors GmbH",
    location: "Munich, Germany",
    rating: 4.8,
    reviews: 1923,
    products: 890,
    verified: true,
    specialties: ["Performance Parts", "Brakes", "Suspension"],
    responseTime: "1 hour",
    annualRevenue: "$3M+"
  },
  {
    id: 3,
    name: "American Auto Supply",
    location: "Detroit, USA",
    rating: 4.7,
    reviews: 1654,
    products: 2100,
    verified: true,
    specialties: ["Body Parts", "Interior", "Accessories"],
    responseTime: "3 hours",
    annualRevenue: "$4M+"
  },
  {
    id: 4,
    name: "Tokyo Automotive Co",
    location: "Tokyo, Japan",
    rating: 4.9,
    reviews: 3102,
    products: 1567,
    verified: true,
    specialties: ["Electronics", "Sensors", "Lighting"],
    responseTime: "1 hour",
    annualRevenue: "$6M+"
  }
];

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    company: "Fleet Management Solutions",
    role: "Procurement Director",
    content: "AutoTradeHub has revolutionized our sourcing process. We've reduced costs by 30% and improved delivery times significantly. The platform is intuitive and the supplier verification gives us confidence.",
    rating: 5,
    image: "/testimonial-1.jpg"
  },
  {
    id: 2,
    name: "Ahmed Hassan",
    company: "Gulf Auto Distributors",
    role: "CEO",
    content: "As a distributor in the Middle East, finding reliable suppliers was challenging. AutoTradeHub connected us with verified manufacturers worldwide. Our business has grown 200% in two years.",
    rating: 5,
    image: "/testimonial-2.jpg"
  },
  {
    id: 3,
    name: "Maria Rodriguez",
    company: "Auto Repair Chain",
    role: "Operations Manager",
    content: "The quality assurance and trade protection features are game-changers. We can order bulk quantities with confidence. The customer support team is exceptional.",
    rating: 5,
    image: "/testimonial-3.jpg"
  }
];

const SupplierCard = ({ supplier }: { supplier: typeof topSuppliers[0] }) => {
  return (
    <div className="bg-card rounded-xl border border-border hover:border-blue-300 hover:shadow-lg transition-all duration-300 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-foreground text-lg">{supplier.name}</h3>
            {supplier.verified && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                <CheckCircle className="w-3 h-3" />
                Verified
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <MapPin className="w-4 h-4" />
            <span>{supplier.location}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-foreground">{supplier.rating}</span>
              <span className="text-sm text-slate-500">({supplier.reviews.toLocaleString()})</span>
            </div>
            <span className="text-sm text-blue-600">{supplier.responseTime} response</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-500">Annual Revenue</div>
          <div className="font-bold text-green-600">{supplier.annualRevenue}</div>
        </div>
      </div>

      {/* Specialties */}
      <div className="mb-4">
        <div className="text-sm font-medium text-slate-700 mb-2">Specialties:</div>
        <div className="flex flex-wrap gap-2">
          {supplier.specialties.map((specialty, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium"
            >
              {specialty}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="font-bold text-foreground">{supplier.products.toLocaleString()}</div>
          <div className="text-xs text-slate-500">Products</div>
        </div>
        <Link to={`/manufacturers`}>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            View Store
          </Button>
        </Link>
      </div>
    </div>
  );
};

const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonials[0] }) => {
  return (
    <div className="bg-card rounded-xl border border-border p-6 relative">
      <Quote className="absolute top-4 right-4 w-8 h-8 text-blue-200" />
      
      <div className="mb-4">
        <div className="flex items-center gap-1 mb-3">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <p className="text-slate-700 leading-relaxed italic">
          "{testimonial.content}"
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
          <Building2 className="w-6 h-6 text-gray-500" />
        </div>
        <div>
          <div className="font-semibold text-foreground">{testimonial.name}</div>
          <div className="text-sm text-muted-foreground">{testimonial.role}</div>
          <div className="text-xs text-blue-600">{testimonial.company}</div>
        </div>
      </div>
    </div>
  );
};

const SupplierShowcase = () => {
  return (
    <section className="section-padding bg-muted">
      <div className="container-wide">
        {/* Top Suppliers Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Top Verified Suppliers
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Partner with industry-leading suppliers who have been thoroughly vetted for quality, 
              reliability, and excellent service. Join thousands of businesses already sourcing with confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {topSuppliers.map((supplier) => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>

          <div className="text-center">
            <Link to="/manufacturers">
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white gap-2">
                View All Suppliers
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Testimonials Section */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Hear from businesses that have transformed their automotive sourcing with AutoTradeHub
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>

          {/* Platform Stats */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white text-center">
            <h3 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold mb-8">Join the Global Automotive Trade Community</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: "50,000+", label: "Active Buyers" },
                { value: "10,000+", label: "Verified Suppliers" },
                { value: "$50M+", label: "Monthly Trade Volume" },
                { value: "150+", label: "Countries" }
              ].map((stat, index) => (
                <div key={index}>
                  <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                  <div className="text-blue-100">{stat.label}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-8">
              <Link to="/auth">
                <Button size="lg" className="bg-card text-blue-600 hover:bg-blue-50 font-semibold">
                  Start Sourcing Today
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SupplierShowcase;
