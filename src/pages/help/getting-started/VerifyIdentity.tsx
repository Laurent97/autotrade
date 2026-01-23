import HelpArticle from '@/components/help/HelpArticle';
import { Shield, CheckCircle, AlertCircle, FileText, Camera, User, Clock, Mail } from 'lucide-react';

export default function VerifyIdentity() {
  return (
    <HelpArticle
      title="Verifying Your Identity"
      category="Getting Started"
      lastUpdated="January 23, 2026"
      readTime="6 minutes"
      difficulty="intermediate"
    >
      <h2>Identity Verification on AutoTradeHub</h2>
      <p>Identity verification helps create a trusted marketplace for all users. This guide explains the verification process and its benefits.</p>

      <h3>Why Verification Matters</h3>
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Benefits of Verification
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Increased trust from other users</li>
          <li>• Higher visibility in search results</li>
          <li>• Access to premium features</li>
          <li>• Verified badge on your profile</li>
          <li>• Faster transaction processing</li>
        </ul>
      </div>

      <h3>Verification Levels</h3>
      <p>AutoTradeHub offers different verification levels:</p>
      <ul>
        <li><strong>Email Verification:</strong> Basic verification for all users</li>
        <li><strong>Phone Verification:</strong> Adds phone number to your profile</li>
        <li><strong>ID Verification:</strong> Government-issued ID verification</li>
        <li><strong>Business Verification:</strong> For business accounts</li>
      </ul>

      <h2>Email Verification</h3>
      <p>This is the first step in verification:</p>
      <ol>
        <li>Check your email for a verification message</li>
        <li>Click the verification link within 24 hours</li>
        <li>Your account will be marked as email verified</li>
      </ol>

      <h3>Troubleshooting Email Verification</h3>
      <ul>
        <li>Check your spam folder</li>
        <li>Add noreply@autotradehub.com to your contacts</li>
        <li>Request a new verification email</li>
        <li>Ensure your email address is correct</li>
      </ul>

      <h2>Phone Verification</h2>
      <p>Add your phone number for an extra layer of security:</p>
      <ol>
        <li>Go to Profile Settings</li>
        <li>Click "Add Phone Number"</li>
        <li>Enter your phone number with country code</li>
        <li>Enter the verification code sent via SMS</li>
        <li>Your phone number will be verified</li>
      </ol>

      <h3>Phone Verification Tips</h3>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Important Notes
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Use a mobile number that can receive SMS</li>
          <li>• International numbers are supported</li>
          <li>• Verification codes expire after 10 minutes</li>
          <li>• You can change your phone number later</li>
        </ul>
      </div>

      <h2>ID Verification</h2>
      <p>For maximum trust and access to premium features:</p>

      <h3>Required Documents</h3>
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Accepted Documents
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Driver's License (current, not expired)</li>
          <li>• State ID Card</li>
          <li>• Passport</li>
          <li>• National ID Card</li>
        </ul>
      </div>

      <h3>Verification Process</h3>
      <ol>
        <li>Navigate to Profile Settings → Verification</li>
        <li>Select "Start ID Verification"</li>
        <li>Choose your document type</li>
        <li>Upload clear photos of your document</li>
        <li>Take a selfie for facial verification</li>
        <li>Submit for review</li>
        <li>Wait for verification (usually 1-2 business days)</li>
      </ol>

      <h3>Taking Good Photos</h3>
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Photo Guidelines
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Use good lighting (natural light is best)</li>
          <li>• Ensure all corners of the document are visible</li>
          <li>• Avoid glare and shadows</li>
          <li>• Make sure text is clear and readable</li>
          <li>• For selfies: face forward, neutral expression</li>
        </ul>
      </div>

      <h2>Business Verification</h2>
      <p>For business accounts and partner sellers:</p>

      <h3>Required Documents</h3>
      <ul>
        <li><strong>Business Registration:</strong> Certificate of incorporation</li>
        <li><strong>Business License:</strong> Current business license</li>
        <li><strong>Tax ID:</strong> Business tax identification number</li>
        <li><strong>Proof of Address:</strong> Utility bill or bank statement</li>
        <li><strong>Owner ID:</strong> Government ID of business owner</li>
      </ul>

      <h3>Business Verification Process</h3>
      <ol>
        <li>Complete basic account setup</li>
        <li>Upgrade to business account</li>
        <li>Submit business documents</li>
        <li>Wait for business verification (2-3 business days)</li>
        <li>Receive business verification badge</li>
      </ol>

      <h2>Verification Status</h3>
      <p>Track your verification status in your profile:</p>
      <ul>
        <li><strong>Pending:</strong> Under review</li>
        <li><strong>Verified:</strong> Successfully verified</li>
        <li><strong>Rejected:</strong> Verification failed - resubmit</li>
        <li><strong>Expired:</strong> Re-verification required</li>
      </ul>

      <h3>What to Do If Rejected</h3>
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Common Rejection Reasons
        </h4>
        <ul className="space-y-1 text-sm">
          <li>• Blurry or unreadable documents</li>
          <li>• Expired identification</li>
          <li>• Incomplete information</li>
          <li>• Suspicious or altered documents</li>
        </ul>
      </div>

      <h2>Privacy and Security</h3>
      <p>Your verification information is protected:</p>
      <ul>
        <li>All documents are encrypted and stored securely</li>
        <li>Information is only used for verification purposes</li>
        <li>Documents are automatically deleted after verification</li>
        <li>We comply with data protection regulations</li>
      </ul>

      <h3>Privacy Settings</h3>
      <p>Control who sees your verification status:</p>
      <ul>
        <li>Show verification badge publicly</li>
        <li>Show verification status only to logged-in users</li>
        <li>Keep verification status private</li>
      </ul>

      <h2>Verification Benefits</h3>
      
      <h3>For Buyers</h3>
      <ul>
        <li>Priority customer support</li>
        <li>Access to premium listings</li>
        <li>Higher trust from sellers</li>
        <li>Faster order processing</li>
      </ul>

      <h3>For Sellers</h3>
      <ul>
        <li>Increased visibility in search results</li>
        <li>Higher conversion rates</li>
        <li>Access to advanced selling tools</li>
        <li>Reduced transaction fees</li>
      </ul>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 my-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Pro Tip
        </h4>
        <p className="text-sm">Verified users receive 25% more messages and close deals 40% faster than unverified users!</p>
      </div>

      <h2>Getting Help</h3>
      <p>If you need assistance with verification:</p>
      <ul>
        <li>📧 Email: verification@autotradehub.com</li>
        <li>💬 Live Chat: Available 24/7</li>
        <li>📞 Phone: 1-800-AUTO-HUB (9 AM - 6 PM EST)</li>
      </ul>

      <h2>Next Steps</h3>
      <p>After verification, you can:</p>
      <ul>
        <li>Start buying and selling with confidence</li>
        <li>Access premium features</li>
        <li>Build your reputation on the platform</li>
        <li>Enjoy enhanced security and trust</li>
      </ul>
    </HelpArticle>
  );
}
