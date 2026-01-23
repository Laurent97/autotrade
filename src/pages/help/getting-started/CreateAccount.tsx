import HelpArticle from '@/components/help/HelpArticle';
import { Mail, Lock, User, CheckCircle, AlertCircle, Shield, Smartphone, Info } from 'lucide-react';

export default function CreateAccount() {
  return (
    <HelpArticle
      title="How to Create an Account"
      category="Getting Started"
      lastUpdated="January 23, 2026"
      readTime="5 minutes"
      difficulty="beginner"
    >
      <h2>Creating Your AutoTradeHub Account</h2>
      <p>Getting started with AutoTradeHub is quick and easy. Follow this step-by-step guide to create your account and start buying or selling automotive parts.</p>

      <h3>Step 1: Visit the Sign Up Page</h3>
      <p>Navigate to <a href="/auth" className="text-primary hover:underline">AutoTradeHub.com/auth</a> and click on the "Sign Up" button. You can also find the sign-up option in the top navigation menu.</p>

      <h3>Step 2: Choose Your Account Type</h3>
      <p>Select the account type that best fits your needs:</p>
      <ul>
        <li><strong>Customer Account:</strong> For buying automotive parts and accessories</li>
        <li><strong>Partner Account:</strong> For selling products as a store owner</li>
        <li><strong>Admin Account:</strong> For platform administrators (invite only)</li>
      </ul>

      <h3>Step 3: Enter Your Information</h3>
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Required Information
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Email address (must be valid)</li>
          <li>• Password (minimum 8 characters)</li>
          <li>• Full name</li>
          <li>• Phone number (optional but recommended)</li>
        </ul>
      </div>

      <h3>Step 4: Create a Strong Password</h3>
      <p>Your password should contain:</p>
      <ul>
        <li>At least 8 characters</li>
        <li>Both uppercase and lowercase letters</li>
        <li>At least one number</li>
        <li>At least one special character (!@#$%^&*)</li>
      </ul>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Security Tips
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Use a unique password for AutoTradeHub</li>
          <li>• Never share your password with anyone</li>
          <li>• Consider using a password manager</li>
          <li>• Enable two-factor authentication after signup</li>
        </ul>
      </div>

      <h3>Step 5: Verify Your Email</h3>
      <p>After registration, you'll receive a verification email. Click the verification link to activate your account.</p>

      <h3>Step 6: Complete Your Profile</h3>
      <p>Once your account is verified, you can:</p>
      <ul>
        <li>Add your profile picture</li>
        <li>Set your location for better product recommendations</li>
        <li>Add payment methods for quick checkout</li>
        <li>Set up notification preferences</li>
      </ul>

      <h2>Troubleshooting Common Issues</h2>
      
      <h3>Email Not Received?</h3>
      <ul>
        <li>Check your spam or junk folder</li>
        <li>Add noreply@autotradehub.com to your contacts</li>
        <li>Request a new verification email from the login page</li>
      </ul>

      <h3>Password Reset Issues?</h3>
      <ul>
        <li>Use the "Forgot Password" link on the login page</li>
        <li>Check that you're using the correct email address</li>
        <li>Password reset links expire after 24 hours</li>
      </ul>

      <h3>Account Already Exists?</h3>
      <ul>
        <li>Try logging in with your existing credentials</li>
        <li>Use the "Forgot Password" option if you don't remember your password</li>
        <li>Contact support if you believe there's an error</li>
      </ul>

      <h2>What's Next?</h2>
      <p>After creating your account, you can:</p>
      <ul>
        <li><strong>Browse Products:</strong> Start exploring our extensive catalog of automotive parts</li>
        <li><strong>Create a Wishlist:</strong> Save products you're interested in</li>
        <li><strong>Set Up Alerts:</strong> Get notified when products you want are available</li>
        <li><strong>Join the Community:</strong> Connect with other automotive enthusiasts</li>
      </ul>

      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Pro Tip
        </h4>
        <p className="text-sm">Download our mobile app to manage your account on the go and receive instant notifications about your orders and messages.</p>
      </div>

      <h2>Need Help?</h2>
      <p>If you encounter any issues during account creation, our support team is here to help:</p>
      <ul>
        <li>📧 Email: support@autotradehub.com</li>
        <li>💬 Live Chat: Available 24/7 on our website</li>
        <li>📞 Phone: 1-800-AUTO-HUB (9 AM - 6 PM EST)</li>
      </ul>
    </HelpArticle>
  );
}
