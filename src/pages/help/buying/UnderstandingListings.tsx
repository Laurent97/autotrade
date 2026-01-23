import HelpArticle from '@/components/help/HelpArticle';
import { Eye, Star, Shield, Camera, FileText, AlertCircle, CheckCircle, Clock, MapPin } from 'lucide-react';

export default function UnderstandingListings() {
  return (
    <HelpArticle
      title="Understanding Product Listings"
      category="Buying"
      lastUpdated="January 23, 2026"
      readTime="12 minutes"
      difficulty="beginner"
    >
      <h2>Decoding AutoTradeHub Product Listings</h2>
      <p>Every product listing on AutoTradeHub contains valuable information to help you make informed purchasing decisions. This guide will help you understand all the elements of a product listing.</p>

      <h3>Listing Overview</h3>
      <p>A typical product listing includes:</p>
      <ul>
        <li>Product title and description</li>
        <li>Images and videos</li>
        <li>Price and payment options</li>
        <li>Seller information</li>
        <li>Shipping details</li>
        <li>Customer reviews</li>
      </ul>

      <h2>Product Information</h2>
      
      <h3>Title and Description</h3>
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          What to Look For
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Clear, descriptive title with part name</li>
          <li>Vehicle compatibility information</li>
          <li>Condition details (new, used, reconditioned)</li>
          <li>Brand and manufacturer information</li>
          <li>Part numbers and specifications</li>
        </ul>
      </div>

      <h3>Reading Product Descriptions</h3>
      <p>A good description should include:</p>
      <ul>
        <li><strong>Compatibility:</strong> Vehicle makes, models, years</li>
        <li><strong>Condition:</strong> Detailed condition description</li>
        <li><strong>Features:</strong> Key product features and benefits</li>
        <li><strong>Installation:</strong> Installation requirements or notes</li>
        <li><strong>Warranty:</strong> Warranty information</li>
      </ul>

      <h3>Red Flags in Descriptions</h3>
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Warning Signs
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Vague or incomplete descriptions</li>
          <li>• No compatibility information</li>
          <li>• Poor grammar and spelling</li>
          <li>• Unrealistic claims</li>
          <li>• Missing important details</li>
        </ul>
      </div>

      <h2>Images and Media</h2>
      
      <h3>Photo Quality</h3>
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Good Photo Practices
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Multiple angles of the product</li>
          <li>• Clear, well-lit photos</li>
          <li>• Close-ups of important details</li>
          <li>• Photos of any damage or wear</li>
          <li>• Scale reference (size comparison)</li>
        </ul>
      </div>

      <h3>What to Look for in Photos</h3>
      <ul>
        <li><strong>Overall Condition:</strong> Look for scratches, dents, rust</li>
        <li><strong>Part Numbers:</strong> Verify part numbers match</li>
        <li><strong>Authenticity:</strong> Brand logos and markings</li>
        <li><strong>Completeness:</strong> All included components</li>
        <li><strong>Packaging:</strong> Original packaging if applicable</li>
      </ul>

      <h3>Video Content</h3>
      <p>Some listings include videos showing:</p>
      <ul>
        <li>Product in action</li>
        <li>Installation demonstrations</li>
        <li>360-degree views</li>
        <li>Sound demonstrations (for exhaust, etc.)</li>
      </ul>

      <h2>Pricing Information</h2>
      
      <h3>Understanding Prices</h3>
      <ul>
        <li><strong>Base Price:</strong> The listed price of the item</li>
        <li><strong>Shipping:</strong> Additional shipping costs</li>
        <li><strong>Taxes:</strong> Applicable taxes based on location</li>
        <li><strong>Fees:</strong> Platform or processing fees</li>
        <li><strong>Total Cost:</strong> Final amount you'll pay</li>
      </ul>

      <h3>Price Indicators</h3>
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Price Analysis
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Compare with similar listings</li>
          <li>• Check retail prices</li>
          <li>• Consider condition and age</li>
          <li>• Factor in shipping costs</li>
          <li>• Look for bulk discounts</li>
        </ul>
      </div>

      <h3>Payment Options</h3>
      <p>Common payment methods include:</p>
      <ul>
        <li>Credit/debit cards</li>
        <li>PayPal and digital wallets</li>
        <li>Bank transfers</li>
        <li>Cryptocurrency</li>
        <li>Cash on delivery (local pickup)</li>
      </ul>

      <h2>Seller Information</h2>
      
      <h3>Seller Profile</h3>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Star className="w-4 h-4" />
          Seller Evaluation
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Rating and review count</li>
          <li>• Response time</li>
          <li>• Transaction history</li>
          <li>• Verification status</li>
          <li>• Return policy</li>
        </ul>
      </div>

      <h3>Seller Types</h3>
      <ul>
        <li><strong>Individual:</strong> Private sellers, hobbyists</li>
        <li><strong>Business:</strong> Professional parts stores</li>
        <li><strong>Dealer:</strong> Car dealerships</li>
        <li><strong>Manufacturer:</strong> Direct from manufacturer</li>
      </ul>

      <h3>Seller Reputation</h3>
      <p>Look for these indicators:</p>
      <ul>
        <li>High ratings (4.5+ stars)</li>
        <li>Large number of reviews</li>
        <li>Recent positive feedback</li>
        <li>Quick response times</li>
        <li>Good communication</li>
      </ul>

      <h2>Shipping and Delivery</h2>
      
      <h3>Shipping Options</h3>
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Delivery Methods
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Standard shipping (5-7 days)</li>
          <li>• Express shipping (2-3 days)</li>
          <li>• Overnight shipping (1 day)</li>
          <li>• Local pickup (same day)</li>
          <li>• International shipping</li>
        </ul>
      </div>

      <h3>Shipping Costs</h3>
      <p>Factors affecting shipping cost:</p>
      <ul>
        <li>Package weight and dimensions</li>
        <li>Distance to your location</li>
        <li>Shipping speed</li>
        <li>Insurance options</li>
        <li>Fuel surcharges</li>
      </ul>

      <h3>Delivery Tracking</h3>
      <ul>
        <li>Tracking numbers provided</li>
        <li>Real-time tracking updates</li>
        <li>Delivery notifications</li>
        <li>Signature requirements</li>
        <li>Insurance coverage</li>
      </ul>

      <h2>Condition and Quality</h2>
      
      <h3>Condition Grades</h3>
      <ul>
        <li><strong>New:</strong> Never used, in original packaging</li>
        <li><strong>Like New:</strong> Used minimally, excellent condition</li>
        <li><strong>Very Good:</strong> Light wear, fully functional</li>
        <li><strong>Good:</strong> Moderate wear, functional</li>
        <li><strong>Fair:</strong> Significant wear, may need repair</li>
      </ul>

      <h3>Quality Indicators</h3>
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Quality Signals
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• OEM vs aftermarket</li>
          <li>• Brand reputation</li>
          <li>• Warranty coverage</li>
          <li>• Return policy</li>
          <li>• Professional inspection</li>
        </ul>
      </div>

      <h3>Authenticity</h3>
      <p>How to verify authenticity:</p>
      <ul>
        <li>Check brand logos and markings</li>
        <li>Verify part numbers</li>
        <li>Compare with manufacturer specs</li>
        <li>Ask for documentation</li>
        <li>Research seller reputation</li>
      </ul>

      <h2>Customer Reviews</h2>
      
      <h3>Review Analysis</h3>
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Star className="w-4 h-4" />
          Reading Reviews
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Look for recent reviews</li>
          <li>• Read both positive and negative</li>
          <li>• Check for verified purchases</li>
          <li>• Look for detailed feedback</li>
          <li>• Consider review patterns</li>
        </ul>
      </div>

      <h3>Review Red Flags</h3>
      <ul>
        <li>All reviews are very recent</li>
        <li>Similar wording across reviews</li>
        <li>No negative reviews (suspicious)</li>
        <li>Reviews mention different products</li>
        <li>Generic or vague feedback</li>
      </ul>

      <h2>Listing Best Practices</h2>
      
      <h3>Before Buying</h3>
      <ol>
        <li>Read the entire description carefully</li>
        <li>Examine all photos closely</li>
        <li>Check seller reputation</li>
        <li>Verify compatibility</li>
        <li>Compare prices</li>
        <li>Read recent reviews</li>
        <li>Ask questions if unsure</li>
      </ol>

      <h3>Questions to Ask</h3>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 my-4">
        <h4 className="font-semibold mb-2">Essential Questions</h4>
        <ul className="space-y-1 text-sm">
          <li>• "Is this compatible with my [vehicle]?"</li>
          <li>• "What's the exact condition?"</li>
          <li>• "Does it come with a warranty?"</li>
          <li>• "What's your return policy?"</li>
          <li>• "Can you provide more photos?"</li>
        </ul>
      </div>

      <h3>Trust Your Instincts</h3>
      <ul>
        <li>If it seems too good to be true, it probably is</li>
        <li>Don't rush into purchases</li>
        <li>Walk away if something feels off</li>
        <li>Report suspicious listings</li>
        <li>Use secure payment methods</li>
      </ul>

      <h2>Common Listing Types</h2>
      
      <h3>Auction Listings</h3>
      <ul>
        <li>Bidding system</li>
        <li>Reserve prices</li>
        <li>Bid increments</li>
        <li>End times</li>
        <li>Auto-bid options</li>
      </ul>

      <h3>Fixed Price Listings</h3>
      <ul>
        <li>Set prices</li>
        <li>Best offer options</li>
        <li>Immediate purchase</li>
        <li>Price negotiations</li>
        <li>Bundle deals</li>
      </ul>

      <h3>Classified Ads</h3>
      <ul>
        <li>Contact seller directly</li>
        <li>Local pickup</li>
        <li>Cash transactions</li>
        <li>No platform protection</li>
        <li>Meet in safe locations</li>
      </ul>

      <h2>Troubleshooting Listing Issues</h2>
      
      <h3>Inaccurate Information</h3>
      <ul>
        <li>Contact seller for clarification</li>
        <li>Request additional photos</li>
        <li>Ask for documentation</li>
        <li>Report false information</li>
        <li>Walk away if unsure</li>
      </ul>

      <h3>Communication Problems</h3>
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Warning Signs
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Slow or no response</li>
          <li>• Evasive answers</li>
          <li>• Pressure to buy quickly</li>
          <li>• Requests for off-platform payment</li>
          <li>• Poor grammar and spelling</li>
        </ul>
      </div>

      <h3>Platform Protection</h3>
      <ul>
        <li>Use platform messaging</li>
        <li>Keep all communications</li>
        <li>Document everything</li>
        <li>Know your rights</li>
        <li>Use dispute resolution</li>
      </ul>

      <h2>Advanced Tips</h2>
      
      <h3>Research Techniques</h3>
      <ul>
        <li>Research market prices</li>
        <li>Check part interchange data</li>
        <li>Read professional reviews</li>
        <li>Join enthusiast forums</li>
        <li>Consult with mechanics</li>
      </ul>

      <h3>Negotiation Strategies</h3>
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Smart Negotiation
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Be polite and professional</li>
          <li>• Know the market value</li>
          <li>• Point out any issues</li>
          <li>• Bundle multiple items</li>
          <li>• Be prepared to walk away</li>
        </ul>
      </div>

      <h3>Timing Your Purchase</h3>
      <ul>
        <li>End of month sales</li>
        <li>Holiday promotions</li>
        <li>Seasonal discounts</li>
        <li>New model releases</li>
        <li>Inventory clearance</li>
      </ul>

      <div className="bg-gradient-accent rounded-lg text-white p-6 mt-8 text-center">
        <h3 className="text-xl font-bold mb-2">Become a Smart Buyer</h3>
        <p className="mb-4">Understanding listings is the key to successful online parts shopping!</p>
        <a href="/products" className="inline-block bg-white text-primary px-6 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors">
          Browse Products Now
        </a>
      </div>
    </HelpArticle>
  );
}
