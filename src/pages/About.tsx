import { Link } from 'react-router-dom';
import PublicLayout from '@/components/PublicLayout';
import { ArrowLeft, Award, Globe, Users, Zap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function About() {
  return (
    <PublicLayout>
      <main className="pt-8">
        {/* Header */}
        <div className="bg-gradient-accent rounded-b-2xl text-white pt-12 pb-8 px-4">
          <div className="container-wide max-w-4xl mx-auto">
            <Link to="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">About AutoVault</h1>
            <p className="text-white/90">Your trusted global automotive marketplace</p>
          </div>
        </div>

        <div className="container-wide max-w-4xl mx-auto py-12 px-4 space-y-12">
          {/* Mission */}
          <div className="bg-card rounded-lg shadow-md p-8 border border-border">
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              AutoTradehub is dedicated to revolutionizing the automotive marketplace by connecting buyers and sellers from around the world. We believe that everyone deserves access to quality vehicles, parts, and accessories at fair prices, delivered with excellence and integrity.
            </p>
          </div>

          {/* Why Choose Us */}
          <div>
            <h2 className="text-3xl font-bold mb-8">Why Choose AutoTradeHub?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Globe,
                  title: 'Global Marketplace',
                  description: 'Access over 150 countries with products from trusted sellers worldwide'
                },
                {
                  icon: Award,
                  title: 'Quality Guaranteed',
                  description: 'Every product is verified and meets our strict quality standards'
                },
                {
                  icon: Zap,
                  title: 'Fast Shipping',
                  description: 'Express delivery options available for urgent orders'
                },
                {
                  icon: Users,
                  title: '50K+ Happy Customers',
                  description: 'Join thousands of satisfied customers worldwide'
                },
                {
                  icon: TrendingUp,
                  title: 'Competitive Prices',
                  description: 'Best prices on vehicles, parts, and accessories'
                },
                {
                  icon: Award,
                  title: '24/7 Support',
                  description: 'Our dedicated team is always here to help'
                }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="bg-card rounded-lg p-6 border border-border hover:shadow-lg transition-shadow">
                    <Icon className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Company Stats */}
          <div className="bg-gradient-accent rounded-lg text-white p-8">
            <h2 className="text-3xl font-bold mb-8 text-center">By The Numbers</h2>
            <div className="grid md:grid-cols-4 gap-8 text-center">
              {[
                { number: '15K+', label: 'Vehicles Listed' },
                { number: '100K+', label: 'Parts Available' },
                { number: '150+', label: 'Countries Served' },
                { number: '50K+', label: 'Active Customers' }
              ].map((stat, idx) => (
                <div key={idx}>
                  <div className="text-4xl font-bold mb-2">{stat.number}</div>
                  <div className="text-white/80">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Our Story */}
          <div className="bg-card rounded-lg shadow-md p-8 border border-border">
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Founded in 2020, AutoTradeHub started with a simple vision: to make automotive shopping accessible and affordable for everyone. What began as a small marketplace has grown into a thriving global platform serving customers across 150+ countries.
              </p>
              <p>
                Today, we're proud to offer the largest selection of vehicles, parts, and accessories online, with competitive prices and reliable shipping to your doorstep.
              </p>
              <p>
                Our commitment to quality, transparency, and customer service has made us the trusted choice for automotive enthusiasts and professionals worldwide.
              </p>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="bg-gradient-accent rounded-lg text-white p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Get In Touch</h3>
            <p className="mb-6 max-w-2xl mx-auto">
              Have questions? We'd love to hear from you. Contact our team for any inquiries.
            </p>
            <Link to="/contact">
              <Button className="bg-white text-primary hover:bg-white/90">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}
