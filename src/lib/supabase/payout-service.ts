import { supabase } from './client';

export const payoutService = {
  async processOrderPayout(orderId: string) {
    try {
      console.log(`💰 Processing payout for order: ${orderId}`);
      
      // 1. Get order details including partner info
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          partner:partner_profiles!orders_partner_id_fkey(
            id,
            user_id,
            commission_rate
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      
      if (!order) {
        throw new Error('Order not found');
      }

      if (!order.partner_id) {
        throw new Error('Order not assigned to a partner');
      }

      if (order.status !== 'completed' && order.status !== 'delivered') {
        throw new Error('Order must be completed or delivered before payout');
      }

      // 2. Calculate partner's earnings
      // For now, let's use commission rate. Adjust based on your business logic
      const commissionRate = order.partner?.commission_rate || 0.10; // 10% default
      const partnerEarnings = order.total_amount * commissionRate;
      
      console.log(`💰 Partner earnings calculation:`, {
        totalAmount: order.total_amount,
        commissionRate,
        partnerEarnings
      });

      // 3. Create wallet transaction for partner
      const { data: transaction, error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: order.partner.user_id,
          order_id: orderId,
          type: 'commission',
          amount: partnerEarnings,
          status: 'completed',
          description: `Commission from Order #${order.order_number}`,
          metadata: {
            order_number: order.order_number,
            total_amount: order.total_amount,
            commission_rate: commissionRate
          }
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // 4. Update partner's wallet balance
      // Get current balance
      const { data: currentBalance, error: balanceError } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', order.partner.user_id)
        .single();

      if (balanceError && balanceError.code === 'PGRST116') {
        // If wallet doesn't exist, create it
        const { error: createError } = await supabase
          .from('wallet_balances')
          .insert({
            user_id: order.partner.user_id,
            balance: partnerEarnings,
            updated_at: new Date().toISOString()
          });

        if (createError) throw createError;
      } else if (balanceError) {
        throw balanceError;
      } else {
        // Update existing wallet
        const newBalance = (currentBalance?.balance || 0) + partnerEarnings;
        const { error: updateError } = await supabase
          .from('wallet_balances')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', order.partner.user_id);

        if (updateError) throw updateError;
      }

      // 5. Mark order as paid_out
      const { error: payoutError } = await supabase
        .from('orders')
        .update({
          paid_out: true,
          payout_amount: partnerEarnings,
          payout_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (payoutError) throw payoutError;

      console.log(`✅ Payout processed successfully: $${partnerEarnings} added to partner's wallet`);
      
      return {
        success: true,
        data: {
          orderId,
          partnerEarnings,
          commissionRate
        }
      };
    } catch (error) {
      console.error('❌ Error processing payout:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to process payout';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle Supabase errors or other object errors
        if ('message' in error) {
          errorMessage = String(error.message);
        } else if ('error' in error) {
          errorMessage = String(error.error);
        } else if ('details' in error) {
          errorMessage = String(error.details);
        } else {
          errorMessage = JSON.stringify(error);
        }
      } else {
        errorMessage = String(error);
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};
