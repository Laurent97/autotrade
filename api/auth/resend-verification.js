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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    );

    // Get user info
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check rate limiting (max 3 attempts per 10 minutes)
    if (user.email_verification_attempts >= 3 && 
        user.last_verification_email_sent && 
        new Date(user.last_verification_email_sent) > new Date(Date.now() - 10 * 60 * 1000)) {
      return res.status(429).json({ 
        error: 'Too many verification attempts. Please wait 10 minutes.' 
      });
    }

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://autotrade-ochre.vercel.app'}/verify-email?email=${encodeURIComponent(email)}&code=${verificationCode}`;

    // Update user with new verification code
    await supabase
      .from('users')
      .update({
        verification_code: verificationCode,
        verification_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        last_verification_email_sent: new Date().toISOString(),
        email_verification_attempts: (user.email_verification_attempts || 0) + 1
      })
      .eq('id', user.id);

    // Send verification email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background: #007bff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
              <span style="color: white; font-size: 24px; font-weight: bold;">A</span>
            </div>
            <h1 style="color: #333; margin: 20px 0 10px;">AutoTradeHub</h1>
            <p style="color: #666; margin: 0;">Verify Your Email Address</p>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h2 style="color: #333; margin: 0 0 15px;">Your Verification Code</h2>
            <div style="background: white; border: 2px dashed #007bff; padding: 20px; border-radius: 8px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px;">${verificationCode}</span>
            </div>
            <p style="color: #666; margin: 15px 0 0;">This code will expire in 10 minutes</p>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <p style="color: #666; margin: 0 0 15px;">Or click the link below:</p>
            <a href="${verificationLink}" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              If you didn't request this verification, please ignore this email.
            </p>
            <p style="color: #666; font-size: 14px; margin: 10px 0 0;">
              For security, never share this code with anyone.
            </p>
          </div>
        </div>
      </div>
    `;

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'noreply@athub.store',
          to: [email],
          subject: 'Verify Your AutoTradeHub Account',
          html: emailHtml,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email via Resend');
      }
    } else {
      // Fallback - log the verification
      console.log('Verification email resent:', { email, verificationCode });
    }

    return res.status(200).json({ 
      message: 'Verification code sent successfully!' 
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ error: 'Failed to resend verification code. Please try again.' });
  }
}
