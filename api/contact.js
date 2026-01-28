export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Create email content
    const emailData = {
      to: ['support@athub.store', 'admin@athub.store'], // Send to both emails
      from: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Form Submission</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          <div style="background: #fff; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Message:</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This message was sent from the AutoTradeHub contact form at ${new Date().toLocaleString()}
          </p>
          <p style="color: #666; font-size: 12px;">
            Sent to: support@athub.store, admin@athub.store
          </p>
        </div>
      `
    };

    // Option 1: Using Resend (recommended - you need to add RESEND_API_KEY to environment)
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    console.log('RESEND_API_KEY exists:', !!RESEND_API_KEY);
    
    if (RESEND_API_KEY) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'support@athub.store', // Use your existing verified email
            to: ['support@athub.store', 'admin@athub.store'], // Send to both emails
            subject: emailData.subject,
            html: emailData.html,
            replyTo: email,
          }),
        });

        console.log('Resend response status:', response.status);
        
        if (response.ok) {
          return res.status(200).json({ message: 'Email sent successfully!' });
        } else {
          const errorText = await response.text();
          console.error('Resend error response:', errorText);
          throw new Error(`Resend API error: ${response.status} - ${errorText}`);
        }
      } catch (fetchError) {
        console.error('Fetch error to Resend:', fetchError);
        throw fetchError;
      }
    }

    // Option 2: Using EmailJS (alternative - you need to configure EmailJS)
    const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
    const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
    const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;

    if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
      const emailjsResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: {
            to_email: 'support@athub.store, admin@athub.store', // Both emails
            from_name: name,
            from_email: email,
            subject: subject,
            message: message,
          },
        }),
      });

      if (emailjsResponse.ok) {
        return res.status(200).json({ message: 'Email sent successfully!' });
      } else {
        throw new Error('Failed to send email via EmailJS');
      }
    }

    // Option 3: Fallback - Log the message and return success
    // This ensures the form works even if email service isn't configured
    console.log('Contact form submission:', {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({ 
      message: 'Message received! We\'ll contact you soon.',
      note: 'Email service configuration pending. Your message has been logged.'
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
}
