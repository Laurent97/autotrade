import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowLeft, HelpCircle, Lightbulb, Zap, Search, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function Help() {
  const [searchTerm, setSearchTerm] = useState('');

  const articles = [
    {
      category: 'Getting Started',
      icon: Lightbulb,
      items: [
        { title: 'How to create an account', path: '/help/getting-started/create-account' },
        { title: 'Setting up your profile', path: '/help/getting-started/setup-profile' },
        { title: 'Verifying your identity', path: '/help/getting-started/verify-identity' },
        { title: 'First order guide', path: '/help/getting-started/first-order-guide' }
      ]
    },
    {
      category: 'Buying',
      icon: Zap,
      items: [
        { title: 'How to search for products', path: '/help/buying/search-products' },
        { title: 'Understanding product listings', path: '/help/buying/understanding-listings' },
        { title: 'Making an offer', path: '/help/buying/making-offer' },
        { title: 'Completing a purchase', path: '/help/buying/completing-purchase' }
      ]
    },
    {
      category: 'Selling',
      icon: AlertCircle,
      items: [
        { title: 'Become a seller', path: '/help/selling/become-seller' },
        { title: 'Listing your products', path: '/help/selling/listing-products' },
        { title: 'Managing inventory', path: '/help/selling/managing-inventory' },
        { title: 'Processing orders', path: '/help/selling/processing-orders' }
      ]
    },
    {
      category: 'Account',
      icon: Lock,
      items: [
        { title: 'Changing password', path: '/help/account/changing-password' },
        { title: 'Two-factor authentication', path: '/help/account/two-factor-auth' },
        { title: 'Account recovery', path: '/help/account/account-recovery' },
        { title: 'Privacy settings', path: '/help/account/privacy-settings' }
      ]
    }
  ];

  const filteredArticles = articles.map(cat => ({
    ...cat,
    items: cat.items.filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()))
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        {/* Header */}
        <div className="bg-gradient-accent rounded-b-2xl text-white pt-12 pb-8 px-4">
          <div className="container-wide max-w-4xl mx-auto">
            <Link to="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Help Center</h1>
            <p className="text-white/90">Find answers and get support</p>
          </div>
        </div>

        <div className="container-wide max-w-4xl mx-auto py-12 px-4">
          {/* Search */}
          <div className="mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search help articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-card"
              />
            </div>
          </div>

          {/* Articles */}
          <div className="grid md:grid-cols-2 gap-8">
            {(searchTerm ? filteredArticles : articles).map((category, idx) => {
              const Icon = category.icon;
              return (
                <div key={idx} className="bg-card rounded-lg shadow-md p-6 border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                    <h3 className="text-xl font-bold">{category.category}</h3>
                  </div>
                  <ul className="space-y-2">
                    {category.items.map((item, i) => (
                      <li key={i}>
                        <Link 
                          to={item.path}
                          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* No Results */}
          {searchTerm && filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-6">No articles found for "{searchTerm}"</p>
              <Link to="/contact">
                <Button>Contact Support</Button>
              </Link>
            </div>
          )}

          {/* Contact Support */}
          {!searchTerm && (
            <div className="bg-gradient-accent rounded-lg text-white p-8 mt-12 text-center">
              <h3 className="text-2xl font-bold mb-4">Can't find what you're looking for?</h3>
              <p className="mb-6 max-w-2xl mx-auto">
                Our support team is ready to help. Contact us anytime, day or night.
              </p>
              <Link to="/contact">
                <Button className="bg-white text-primary hover:bg-white/90">
                  Contact Support
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
