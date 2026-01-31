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

export const populateSampleData = async () => {
  try {
    console.log('Starting to populate sample orders and visits...');

    // Get existing partners
    const { data: partners, error: partnersError } = await supabase
      .from('partner_profiles')
      .select('id, user_id, store_name');

    if (partnersError) {
      console.error('Error fetching partners:', partnersError);
      return { success: false, error: partnersError.message };
    }

    if (!partners || partners.length === 0) {
      console.log('No partners found. Please run seed-data-runner.js first.');
      return { success: false, error: 'No partners found' };
    }

    console.log(`Found ${partners.length} partners`);

    // 1. Populate sample orders for each partner
    for (const partner of partners) {
      console.log(`Creating orders for ${partner.store_name}...`);
      
      for (let i = 0; i < 15; i++) {
        const orderAmount = Math.floor(Math.random() * 450 + 50); // $50-$500
        const status = Math.random() <= 0.6 ? 'completed' : 
                      Math.random() <= 0.8 ? 'paid' : 
                      Math.random() <= 0.95 ? 'processing' : 'pending';
        const paymentStatus = Math.random() <= 0.8 ? 'paid' : 'pending';
        
        // Create order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            partner_id: partner.id,
            customer_id: `customer_${partner.id}_${i}`,
            total_amount: orderAmount,
            status: status,
            payment_status: paymentStatus,
            created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
          })
          .select()
          .single();

        if (orderError) {
          console.error(`Error creating order for ${partner.store_name}:`, orderError);
          continue;
        }

        // Create order items
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            product_id: `product_${Math.floor(Math.random() * 50) + 1}`,
            quantity: Math.floor(Math.random() * 3) + 1,
            unit_price: orderAmount / (Math.floor(Math.random() * 3) + 1),
            total_price: orderAmount
          });

        if (itemsError) {
          console.error(`Error creating order items for ${partner.store_name}:`, itemsError);
        }
      }
    }

    // 2. Add wallet transactions for earnings
    for (const partner of partners) {
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('partner_id', partner.id)
        .in('status', ['completed', 'paid'])
        .eq('payment_status', 'paid');

      if (orders && orders.length > 0) {
        for (const order of orders) {
          const { error: transactionError } = await supabase
            .from('wallet_transactions')
            .insert({
              user_id: partner.user_id,
              amount: order.total_amount * 0.15, // 15% commission
              type: 'commission',
              status: 'completed',
              created_at: order.created_at,
              updated_at: order.created_at
            });

          if (transactionError) {
            console.error(`Error creating transaction for ${partner.store_name}:`, transactionError);
          }
        }
      }
    }

    // 3. Add store visits
    for (const partner of partners) {
      for (let i = 0; i < 25; i++) {
        const pages = ['/products', '/store', '/about', '/contact'];
        const page = pages[Math.floor(Math.random() * pages.length)];
        
        const { error: visitError } = await supabase
          .from('store_visits')
          .insert({
            partner_id: partner.user_id,
            visitor_id: `visitor_${partner.user_id}_${i}_${Date.now()}`,
            page_visited: page,
            session_duration: Math.floor(Math.random() * 240) + 60, // 60-300 seconds
            created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
          });

        if (visitError) {
          console.error(`Error creating visit for ${partner.store_name}:`, visitError);
        }
      }
    }

    // 4. Create wallet balances
    for (const partner of partners) {
      const { data: transactions } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('user_id', partner.user_id)
        .eq('status', 'completed');

      if (transactions) {
        const totalBalance = transactions.reduce((sum, t) => sum + t.amount, 0);
        
        const { error: walletError } = await supabase
          .from('wallet_balances')
          .upsert({
            user_id: partner.user_id,
            balance: totalBalance,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (walletError) {
          console.error(`Error creating wallet for ${partner.store_name}:`, walletError);
        }
      }
    }

    // 5. Update partner profiles with some metrics
    for (const partner of partners) {
      const { data: orderCount } = await supabase
        .from('orders')
        .select('id')
        .eq('partner_id', partner.id);

      const { data: visitCount } = await supabase
        .from('store_visits')
        .select('id')
        .eq('partner_id', partner.user_id);

      const { error: updateError } = await supabase
        .from('partner_profiles')
        .update({
          total_products: Math.floor(Math.random() * 50) + 10,
          active_products: Math.floor(Math.random() * 30) + 5,
          store_rating: (Math.random() * 1.5 + 3.5).toFixed(1), // 3.5-5.0
          store_credit_score: Math.floor(Math.random() * 200) + 650, // 650-850
          updated_at: new Date().toISOString()
        })
        .eq('id', partner.id);

      if (updateError) {
        console.error(`Error updating partner profile for ${partner.store_name}:`, updateError);
      } else {
        console.log(`Updated ${partner.store_name}: ${orderCount?.length || 0} orders, ${visitCount?.length || 0} visits`);
      }
    }

    console.log('Sample data populated successfully!');
    return { success: true, message: 'Sample orders, visits, and transactions created successfully' };

  } catch (error) {
    console.error('Error populating sample data:', error);
    return { success: false, error: error.message };
  }
};

// Run the populate function
populateSampleData()
  .then(result => {
    console.log('Populate result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error populating data:', error);
    process.exit(1);
  });
