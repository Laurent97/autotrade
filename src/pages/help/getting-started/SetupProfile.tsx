import HelpArticle from '@/components/help/HelpArticle';
import { User, Camera, MapPin, Phone, Mail, Shield, CheckCircle, Star } from 'lucide-react';

export default function SetupProfile() {
  return (
    <HelpArticle
      title="Setting Up Your Profile"
      category="Getting Started"
      lastUpdated="January 23, 2026"
      readTime="7 minutes"
      difficulty="beginner"
    >
      <h2>Complete Your AutoTradeHub Profile</h2>
      <p>A complete profile helps you build trust with other users and get better recommendations. Follow this guide to set up your profile effectively.</p>

      <h3>Accessing Your Profile</h3>
      <p>To access your profile settings:</p>
      <ol>
        <li>Log in to your AutoTradeHub account</li>
        <li>Click on your profile picture or name in the top right corner</li>
        <li>Select "Profile Settings" from the dropdown menu</li>
      </ol>

      <h3>Profile Picture</h3>
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Photo Guidelines
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Use a clear, recent photo of yourself</li>
          <li>• Recommended size: 400x400 pixels</li>
          <li>• File formats: JPG, PNG, or GIF</li>
          <li>• Maximum file size: 5MB</li>
        </ul>
      </div>

      <h3>Basic Information</h3>
      <p>Complete these essential fields:</p>
      <ul>
        <li><strong>Full Name:</strong> Your real name for verification</li>
        <li><strong>Display Name:</strong> How others will see you on the platform</li>
        <li><strong>Bio:</strong> Brief description about yourself (max 500 characters)</li>
        <li><strong>Location:</strong> Your city and country for local recommendations</li>
      </ul>

      <h3>Contact Information</h3>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Privacy Settings
        </h4>
        <p className="text-sm mb-2">Control who can see your contact information:</p>
        <ul className="space-y-1 text-sm">
          <li>• <strong>Public:</strong> Everyone can see your contact info</li>
          <li>• <strong>Verified Users Only:</strong> Only verified users can contact you</li>
          <li>• <strong>Private:</strong> Contact info hidden from everyone</li>
        </ul>
      </div>

      <h3>Business Information (For Sellers)</h3>
      <p>If you're a partner account holder, complete these additional fields:</p>
      <ul>
        <li><strong>Business Name:</strong> Your registered business name</li>
        <li><strong>Business Type:</strong> Individual, Partnership, Corporation, etc.</li>
        <li><strong>Tax ID:</strong> For tax purposes and invoicing</li>
        <li><strong>Business Address:</strong> Your business location</li>
        <li><strong>Website:</strong> Your business website (optional)</li>
      </ul>

      <h3>Verification Status</h3>
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Benefits of Verification
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Increased trust from buyers and sellers</li>
          <li>• Higher visibility in search results</li>
          <li>• Access to premium features</li>
          <li>• Verified badge on your profile</li>
        </ul>
      </div>

      <h2>Profile Completion Tips</h2>
      
      <h3>Write a Compelling Bio</h3>
      <p>Your bio is your chance to make a great first impression:</p>
      <ul>
        <li>Be authentic and honest</li>
        <li>Mention your automotive experience</li>
        <li>Share your interests in specific car makes or parts</li>
        <li>Keep it professional but friendly</li>
      </ul>

      <h3>Choose the Right Profile Type</h3>
      <ul>
        <li><strong>Personal:</strong> For individual buyers and collectors</li>
        <li><strong>Business:</strong> For automotive businesses and professionals</li>
        <li><strong>Dealer:</strong> For car dealerships and parts stores</li>
      </ul>

      <h3>Set Your Location</h3>
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Location Benefits
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Find local deals and meetups</li>
          <li>• Calculate accurate shipping costs</li>
          <li>• Connect with nearby enthusiasts</li>
          <li>• Get region-specific recommendations</li>
        </ul>
      </div>

      <h2>Profile Statistics</h3>
      <p>Your profile displays these metrics to build credibility:</p>
      <ul>
        <li><strong>Member Since:</strong> When you joined AutoTradeHub</li>
        <li><strong>Transaction Count:</strong> Total completed transactions</li>
        <li><strong>Response Rate:</strong> How quickly you respond to messages</li>
        <li><strong>Rating:</strong> Average rating from other users</li>
      </ul>

      <h2>Managing Your Profile</h3>
      
      <h3>Regular Updates</h3>
      <p>Keep your profile current by:</p>
      <ul>
        <li>Updating your bio with new interests</li>
        <li>Changing your profile picture periodically</li>
        <li>Adding new skills or certifications</li>
        <li>Updating your location if you move</li>
      </ul>

      <h3>Profile Visibility</h3>
      <p>Control your privacy with these settings:</p>
      <ul>
        <li><strong>Search Visibility:</strong> Appear in user searches</li>
        <li><strong>Activity Status:</strong> Show when you're online</li>
        <li><strong>Transaction History:</strong> Display past transactions</li>
      </ul>

      <h2>Troubleshooting</h2>
      
      <h3>Profile Picture Not Uploading?</h3>
      <ul>
        <li>Check file size (max 5MB)</li>
        <li>Ensure file format is supported</li>
        <li>Try a different browser</li>
        <li>Clear your browser cache</li>
      </ul>

      <h3>Information Not Saving?</h3>
      <ul>
        <li>Check your internet connection</li>
        <li>Ensure all required fields are filled</li>
        <li>Try refreshing the page</li>
        <li>Contact support if the issue persists</li>
      </ul>

      <h2>Best Practices</h2>
      
      <h3>For Buyers</h3>
      <ul>
        <li>Complete your profile to build trust with sellers</li>
        <li>Add your location for local pickup options</li>
        <li>Verify your account for better access</li>
        <li>Keep your contact information updated</li>
      </ul>

      <h3>For Sellers</h3>
      <ul>
        <li>Include business information for credibility</li>
        <li>Add professional photos and descriptions</li>
        <li>Verify your business account</li>
        <li>Maintain a high response rate</li>
      </ul>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Star className="w-4 h-4" />
          Pro Tip
        </h4>
        <p className="text-sm">A complete profile with a photo and verification can increase your response rate by up to 75% and help you close deals faster!</p>
      </div>

      <h2>Next Steps</h2>
      <p>After setting up your profile, you can:</p>
      <ul>
        <li><strong>Browse Products:</strong> Start exploring our catalog</li>
        <li><strong>Connect with Users:</strong> Message other members</li>
        <li><strong>Join Groups:</strong> Participate in automotive communities</li>
        <li><strong>Leave Reviews:</strong> Share your experiences</li>
      </ul>
    </HelpArticle>
  );
}
