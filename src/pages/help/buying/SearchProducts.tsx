import HelpArticle from '@/components/help/HelpArticle';
import { Search, Filter, Tag, Star, MapPin, Clock, TrendingUp, AlertCircle } from 'lucide-react';

export default function SearchProducts() {
  return (
    <HelpArticle
      title="How to Search for Products"
      category="Buying"
      lastUpdated="January 23, 2026"
      readTime="10 minutes"
      difficulty="beginner"
    >
      <h2>Master Product Search on AutoTradeHub</h2>
      <p>Finding the right automotive parts is easy with our powerful search tools. This guide will help you become a search expert and find exactly what you need.</p>

      <h3>Basic Search Techniques</h3>
      
      <h4>Simple Keyword Search</h4>
      <p>Start with basic terms:</p>
      <ul>
        <li>Part names: "brake pads", "oil filter", "spark plugs"</li>
        <li>Part numbers: "BOSCH 3397118915", "ACDelco 41-123"</li>
        <li>Vehicle models: "Toyota Camry 2020", "Honda Civic 2018"</li>
        <li>Categories: "engine parts", "brake system", "suspension"</li>
      </ul>

      <h4>Search Bar Features</h4>
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Search className="w-4 h-4" />
          Search Bar Tips
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Auto-suggestions appear as you type</li>
          <li>• Recent searches are saved for quick access</li>
          <li>• Popular searches show trending items</li>
          <li>• Voice search available on mobile app</li>
        </ul>
      </div>

      <h2>Advanced Search Strategies</h3>
      
      <h3>Using Search Operators</h3>
      <p>Refine your search with these operators:</p>
      <ul>
        <li><strong>Quotes (""):</strong> Exact phrase search - "brake caliper"</li>
        <li><strong>Minus (-):</strong> Exclude terms - "brake pads -ceramic"</li>
        <li><strong>OR:</strong> Multiple options - "oil filter OR air filter"</li>
        <li><strong>Asterisk (*):</strong> Wildcard - "brake*"</li>
      </ul>

      <h3>Search Examples</h3>
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800 my-4">
        <h4 className="font-semibold mb-2">Effective Search Queries</h4>
        <ul className="space-y-2 text-sm">
          <li><code>"BOSCH brake pads" Toyota Camry</code> - Exact brand + vehicle</li>
          <li><code>oil filter -synthetic</code> - Oil filters but not synthetic</li>
          <li><code>spark plugs NGK OR Denso</code> - Multiple brands</li>
          <li><code>"2015-2020" Ford F-150</code> - Year range + model</li>
        </ul>
      </div>

      <h2>Using Filters Effectively</h3>
      
      <h3>Vehicle Filters</h3>
      <p>Narrow down by vehicle specifications:</p>
      <ul>
        <li><strong>Make:</strong> Toyota, Honda, Ford, BMW, etc.</li>
        <li><strong>Model:</strong> Camry, Civic, F-150, 3 Series</li>
        <li><strong>Year:</strong> Specific year or year range</li>
        <li><strong>Engine:</strong> 2.0L, V6, Hybrid, Diesel</li>
        <li><strong>Trim:</strong> LE, EX, Sport, Limited</li>
      </ul>

      <h3>Product Filters</h3>
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Essential Filters
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• <strong>Condition:</strong> New, Used, Reconditioned</li>
          <li>• <strong>Brand:</strong> OEM, Aftermarket, Performance</li>
          <li>• <strong>Price Range:</strong> Set your budget</li>
          <li>• <strong>Rating:</strong> Minimum seller rating</li>
          <li>• <strong>Location:</strong> Distance from you</li>
        </ul>
      </div>

      <h3>Advanced Filtering</h3>
      <p>Power users can filter by:</p>
      <ul>
        <li><strong>Specifications:</strong> Dimensions, weight, material</li>
        <li><strong>Features:</strong> Warranty, return policy, shipping</li>
        <li><strong>Seller Type:</strong> Individual, Business, Dealer</li>
        <li><strong>Availability:</strong> In stock, made to order</li>
      </ul>

      <h2>Browse by Category</h3>
      
      <h3>Popular Categories</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-4">
        <div className="p-3 bg-card rounded-lg border border-border">
          <h4 className="font-semibold">Engine System</h4>
          <p className="text-sm text-muted-foreground">Oil filters, spark plugs, belts</p>
        </div>
        <div className="p-3 bg-card rounded-lg border border-border">
          <h4 className="font-semibold">Brake System</h4>
          <p className="text-sm text-muted-foreground">Pads, rotors, calipers</p>
        </div>
        <div className="p-3 bg-card rounded-lg border border-border">
          <h4 className="font-semibold">Suspension</h4>
          <p className="text-sm text-muted-foreground">Shocks, struts, control arms</p>
        </div>
        <div className="p-3 bg-card rounded-lg border border-border">
          <h4 className="font-semibold">Transmission</h4>
          <p className="text-sm text-muted-foreground">Fluids, filters, clutch</p>
        </div>
        <div className="p-3 bg-card rounded-lg border border-border">
          <h4 className="font-semibold">Electrical</h4>
          <p className="text-sm text-muted-foreground">Batteries, alternators, starters</p>
        </div>
        <div className="p-3 bg-card rounded-lg border border-border">
          <h4 className="font-semibold">Body Parts</h4>
          <p className="text-sm text-muted-foreground">Bumpers, mirrors, lights</p>
        </div>
      </div>

      <h3>Navigating Categories</h3>
      <ul>
        <li>Click on main categories to see subcategories</li>
        <li>Use breadcrumb navigation to go back</li>
        <li>Filter within categories for specific items</li>
        <li>Save category searches for later</li>
      </ul>

      <h2>Search Tips and Tricks</h3>
      
      <h3>Find Compatible Parts</h3>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Compatibility Tips
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Always double-check your vehicle details</li>
          <li>Use VIN lookup for exact matches</li>
          <li>Consult your vehicle manual</li>
          <li>Ask sellers about fitment</li>
          <li>Check part interchange data</li>
        </ul>
      </div>

      <h3>Price Comparison</h3>
      <ul>
        <li>Sort by price (low to high or high to low)</li>
        <li>Compare similar items side by side</li>
        <li>Look for sales and discounts</li>
        <li>Consider total cost including shipping</li>
        <li>Factor in warranty value</li>
      </ul>

      <h3>Quality Indicators</h3>
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Star className="w-4 h-4" />
          Quality Signals
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Seller ratings and reviews</li>
          <li>• Product photos and descriptions</li>
          <li>• Warranty and return policies</li>
          <li>• Brand reputation</li>
          <li>• Price vs market average</li>
        </ul>
      </div>

      <h2>Mobile Search Features</h3>
      
      <h3>App-Specific Tools</h3>
      <ul>
        <li><strong>Barcode Scanner:</strong> Scan product barcodes</li>
        <li><strong>VIN Scanner:</strong> Scan vehicle VIN</li>
        <li><strong>Voice Search:</strong> Speak your search</li>
        <li><strong>Image Search:</strong> Upload photos to find parts</li>
        <li><strong>Location Services:</strong> Find nearby parts</li>
      </ul>

      <h3>Mobile Optimization</h3>
      <ul>
        <li>Thumb-friendly interface</li>
        <li>Swipe through product images</li>
        <li>One-tap filtering</li>
        <li>Offline search history</li>
      </ul>

      <h2>Saved Searches and Alerts</h3>
      
      <h3>Save Search Preferences</h3>
      <ul>
        <li>Save frequently used search combinations</li>
        <li>Create custom filter presets</li>
        <li>Set up search alerts for new items</li>
        <li>Share saved searches with others</li>
      </ul>

      <h3>Price Alerts</h3>
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Smart Alerts
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Get notified when prices drop</li>
          <li>• Alerts for new matching products</li>
          <li>• Back-in-stock notifications</li>
          <li>• Price history tracking</li>
        </ul>
      </div>

      <h2>Troubleshooting Search Issues</h3>
      
      <h3>No Results Found?</h3>
      <ul>
        <li>Check spelling and typos</li>
        <li>Try broader search terms</li>
        <li>Remove some filters</li>
        <li>Try different keywords</li>
        <li>Contact support for help</li>
      </ul>

      <h3>Too Many Results?</h3>
      <ul>
        <li>Add more specific keywords</li>
        <li>Use additional filters</li>
        <li>Sort by relevance</li>
        <li>Narrow by category</li>
        <li>Set price range</li>
      </ul>

      <h3>Search Not Working?</h3>
      <ul>
        <li>Clear browser cache and cookies</li>
        <li>Try a different browser</li>
        <li>Check internet connection</li>
        <li>Update the app or browser</li>
        <li>Report technical issues</li>
      </ul>

      <h2>Pro Search Techniques</h3>
      
      <h3>Power User Strategies</h3>
      <ul>
        <li>Use part numbers for exact matches</li>
        <li>Search by OEM part numbers</li>
        <li>Use interchange part numbers</li>
        <li>Search by vehicle specifications</li>
        <li>Use manufacturer catalogs</li>
      </ul>

      <h3>Research Techniques</h3>
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Research Workflow
        </h4>
        <ol className="space-y-1 text-sm">
          <li>1. Research your vehicle's exact specifications</li>
          <li>2. Find OEM part numbers</li>
          <li>3. Search for compatible aftermarket options</li>
          <li>4. Compare prices and reviews</li>
          <li>5. Verify fitment before buying</li>
        </ol>
      </div>

      <h2>Search Best Practices</h3>
      
      <h3>Before You Search</h3>
      <ul>
        <li>Know your vehicle details</li>
        <li>Have your VIN ready</li>
        <li>Research part numbers</li>
        <li>Set your budget</li>
        <li>Read reviews and guides</li>
      </ul>

      <h3>During Search</h3>
      <ul>
        <li>Start broad, then narrow down</li>
        <li>Use multiple search terms</li>
        <li>Compare multiple options</li>
        <li>Read all product details</li>
        <li>Ask sellers questions</li>
      </ul>

      <h3>After Search</h3>
      <ul>
        <li>Save promising searches</li>
        <li>Set up price alerts</li>
        <li>Bookmark favorite items</li>
        <li>Share with friends</li>
        <li>Leave helpful reviews</li>
      </ul>

      <div className="bg-gradient-accent rounded-lg text-white p-6 mt-8 text-center">
        <h3 className="text-xl font-bold mb-2">Become a Search Expert</h3>
        <p className="mb-4">Practice these techniques and you'll find exactly what you need every time!</p>
        <a href="/products" className="inline-block bg-white text-primary px-6 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors">
          Start Searching Now
        </a>
      </div>
    </HelpArticle>
  );
}
