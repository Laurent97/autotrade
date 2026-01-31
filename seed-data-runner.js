import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const seedSamplePartners = async () => {
  try {
    console.log('Starting to seed sample partner data...');

    // Sample partner data
    const samplePartners = [
      {
        store_name: 'AutoParts Pro',
        store_slug: 'autoparts-pro',
        store_tagline: 'Premium Auto Parts Since 2010',
        store_description: 'We specialize in high-quality OEM and aftermarket auto parts for all major vehicle brands. Our extensive inventory includes engine components, brake systems, suspension parts, and more.',
        business_type: 'business',
        store_category: 'premium_auto',
        year_established: 2010,
        store_logo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop&crop=face',
        store_banner: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
        brand_color: '#2563eb',
        accent_color: '#10b981',
        contact_email: 'info@autopartspro.com',
        contact_phone: '+1-555-0123',
        website: 'https://autopartspro.com',
        country: 'US',
        city: 'Detroit',
        timezone: 'America/Detroit',
        commission_rate: 15,
        total_earnings: 125000,
        total_orders: 450,
        rating: 4.8,
        store_visits: 12500,
        is_active: true,
        partner_status: 'approved'
      },
      {
        store_name: 'Speed Performance',
        store_slug: 'speed-performance',
        store_tagline: 'High-Performance Parts for Enthusiasts',
        store_description: 'Your destination for high-performance automotive parts and accessories. We carry everything from turbochargers to exhaust systems for the serious car enthusiast.',
        business_type: 'corporation',
        store_category: 'performance',
        year_established: 2015,
        store_logo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop&crop=face',
        store_banner: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
        brand_color: '#dc2626',
        accent_color: '#f59e0b',
        contact_email: 'sales@speedperformance.com',
        contact_phone: '+1-555-0124',
        website: 'https://speedperformance.com',
        country: 'US',
        city: 'Los Angeles',
        timezone: 'America/Los_Angeles',
        commission_rate: 18,
        total_earnings: 89000,
        total_orders: 320,
        rating: 4.6,
        store_visits: 8900,
        is_active: true,
        partner_status: 'approved'
      },
      {
        store_name: 'CarCare Essentials',
        store_slug: 'carcare-essentials',
        store_tagline: 'Premium Car Care Products',
        store_description: 'We provide premium car care products including waxes, polishes, interior cleaners, and detailing supplies. Keep your vehicle looking its best with our professional-grade products.',
        business_type: 'llc',
        store_category: 'care',
        year_established: 2018,
        store_logo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop&crop=face',
        store_banner: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
        brand_color: '#059669',
        accent_color: '#0891b2',
        contact_email: 'hello@carcareessentials.com',
        contact_phone: '+1-555-0125',
        website: 'https://carcareessentials.com',
        country: 'CA',
        city: 'Toronto',
        timezone: 'America/Toronto',
        commission_rate: 12,
        total_earnings: 45000,
        total_orders: 180,
        rating: 4.9,
        store_visits: 5600,
        is_active: true,
        partner_status: 'approved'
      }
    ];

    // Insert sample partners
    for (const partner of samplePartners) {
      const userId = crypto.randomUUID();
      
      // Generate store ID
      const storeId = 'STORE' + Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Generate referral and invitation codes
      const referralCode = partner.store_name.replace(/\s+/g, '').substring(0, 6).toUpperCase() + '2025';
      const invitationCode = partner.store_name.replace(/\s+/g, '').substring(0, 5).toUpperCase() + 'INV';

      // Create user record
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: `partner${storeId.toLowerCase()}@example.com`,
          full_name: `${partner.store_name} Owner`,
          user_type: 'partner',
          partner_status: 'approved'
        })
        .select()
        .single();

      if (userError) {
        console.error('Error creating user:', userError);
        continue;
      }

      // Create partner profile
      const { data: partnerData, error: partnerError } = await supabase
        .from('partner_profiles')
        .insert({
          user_id: userId,
          store_id: storeId,
          referral_code: referralCode,
          invitation_code: invitationCode,
          ...partner,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (partnerError) {
        console.error('Error creating partner profile:', partnerError);
        continue;
      }

      console.log(`Created partner: ${partner.store_name}`);
    }

    console.log('Sample partner data seeded successfully!');
    return { success: true, message: 'Sample partners created successfully' };

  } catch (error) {
    console.error('Error seeding sample partners:', error);
    return { success: false, error: error.message };
  }
};

// Run the seed function
seedSamplePartners()
  .then(result => {
    console.log('Seed result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error seeding data:', error);
    process.exit(1);
  });
