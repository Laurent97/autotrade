export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    );

    // Find user with verification code
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('verification_code', code)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Check if code has expired
    if (user.verification_expires_at && new Date(user.verification_expires_at) < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Mark email as verified
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        verification_code: null,
        verification_expires_at: null
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    // Send welcome email
    const welcomeEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background: #007bff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
              <span style="color: white; font-size: 24px; font-weight: bold;">A</span>
            </div>
            <h1 style="color: #333; margin: 20px 0 10px;">AutoTradeHub</h1>
            <p style="color: #666; margin: 0;">Welcome to AutoTradeHub!</p>
          </div>
          
          <div style="margin: 30px 0;">
            <h2 style="color: #333; margin: 0 0 15px;">Hi ${user.name || 'User'},</h2>
            <p style="color: #666; line-height: 1.6; margin: 0 0 15px;">
              Thank you for verifying your email address! Your AutoTradeHub account is now active and ready to use.
            </p>
            <p style="color: #666; line-height: 1.6; margin: 0 0 15px;">
              You can now:
            </p>
            <ul style="color: #666; line-height: 1.6; margin: 0 0 20px; padding-left: 20px;">
              <li>Browse thousands of automotive products</li>
              <li>Connect with verified suppliers</li>
              <li>Place orders and track shipments</li>
              <li>Manage your account settings</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://autotrade-ochre.vercel.app'}" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Get Started
              </a>
            </div>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              If you have any questions, feel free to contact our support team at support@athub.store
            </p>
          </div>
        </div>
      </div>
    `;

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'noreply@athub.store',
          to: [email],
          subject: 'Welcome to AutoTradeHub!',
          html: welcomeEmailHtml,
        }),
      });
    }

    return res.status(200).json({ 
      message: 'Email verified successfully!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        email_verified: true
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ error: 'Failed to verify email. Please try again.' });
  }
}
