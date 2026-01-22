import { supabase } from './client';
import type { PartnerProfile, User } from '../types';

export interface PartnerRegistrationData {
  user_id: string;
  store_name: string;
  store_slug: string;
  description?: string;
  contact_email: string;
  contact_phone?: string;
  country?: string;
  city?: string;
  tax_id?: string;
  bank_account_details?: Record<string, any>;
}

export const partnerService = {
  // ... (keep ensureUserExists, registerPartner, getPartnerProfile, updatePartnerProfile methods same)

  /**
   * Get partner's orders (CORRECTED FOR ACTUAL TABLE STRUCTURE)
   */
  async getPartnerOrders(partnerId: string, limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_id,
        total_amount,
        status,
        payment_status,
        shipping_address,
        billing_address,
        created_at,
        updated_at,
        user:users(email, full_name),
        order_items(
          id,
          quantity,
          unit_price,
          subtotal,
          product_id,
          partner_product_id,
          created_at,
          product:products(make, sku, title, sale_price),
          partner_product:partner_products(selling_price, profit_margin)
        )
      `)
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return { data: data || [], error };
  },

  /**
   * Get order by ID (CORRECTED)
   */
  async getOrder(orderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          id,
          quantity,
          unit_price,
          subtotal,
          product_id,
          partner_product_id,
          created_at,
          product:products(make, sku, title, sale_price),
          partner_product:partner_products(selling_price, profit_margin)
        ),
        user:users(*)
      `)
      .eq('id', orderId)
      .single();

    return { data, error };
  },

  /**
   * Process order payment using wallet balance (CORRECTED)
   */
  async processOrderPayment(orderId: string, partnerId: string) {
    try {
      const { data: order, error: orderError } = await this.getOrder(orderId);
      if (orderError) throw orderError;
      if (!order) throw new Error('Order not found');

      if (order.payment_status === 'paid') {
        throw new Error('Order is already paid');
      }

      // ✅ CORRECT: Use wallet_balances table
      const { data: wallet, error: walletError } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', partnerId)
        .single();

      if (walletError || !wallet) {
        if (walletError?.code === 'PGRST116') {
          // Create wallet if doesn't exist
          const { error: createError } = await supabase
            .from('wallet_balances')
            .insert([{
              user_id: partnerId,
              balance: 0,
              currency: 'USD',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }]);
          
          if (createError) throw createError;
          throw new Error('Wallet created with $0 balance. Please add funds.');
        }
        throw walletError || new Error('Partner wallet not found');
      }

      if (wallet.balance < order.total_amount) {
        const needed = order.total_amount - wallet.balance;
        throw new Error(`Insufficient wallet balance. Add $${needed.toFixed(2)} to proceed.`);
      }

      // Process payment
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'processing',  // Or 'waiting_shipment' depending on your workflow
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Deduct from wallet
      const { error: walletUpdateError } = await supabase
        .from('wallet_balances')
        .update({ 
          balance: wallet.balance - order.total_amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', partnerId);

      if (walletUpdateError) throw walletUpdateError;

      // Create wallet transaction record
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert([{
          user_id: partnerId,
          amount: -order.total_amount,
          type: 'order_payment',
          description: `Payment for order ${order.order_number || orderId}`,
          order_id: orderId,
          status: 'completed',
          created_at: new Date().toISOString()
        }]);

      if (transactionError) console.error('Transaction log error:', transactionError);

      return { success: true, message: 'Payment processed successfully' };
    } catch (error) {
      console.error('Error processing order payment:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment processing failed' 
      };
    }
  },

  /**
   * Get customer order history with partner (CORRECTED)
   */
  async getCustomerOrderHistory(customerId: string, partnerId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total_amount,
        status,
        payment_status,
        created_at,
        updated_at,
        order_items(
          id,
          quantity,
          unit_price,
          subtotal,
          product:products(make, sku, title),
          partner_product:partner_products(selling_price)
        )
      `)
      .eq('customer_id', customerId)
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  },

  /**
   * Cancel order with refund (CORRECTED)
   */
  async cancelOrder(orderId: string, partnerId: string, reason: string) {
    try {
      const { data: order, error: orderError } = await this.getOrder(orderId);
      if (orderError) throw orderError;
      if (!order) throw new Error('Order not found');

      if (order.status === 'cancelled') {
        throw new Error('Order is already cancelled');
      }
      if (order.status === 'completed') {
        throw new Error('Cannot cancel completed order');
      }

      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Refund to wallet if paid
      if (order.payment_status === 'paid') {
        const { data: wallet } = await supabase
          .from('wallet_balances')
          .select('balance')
          .eq('user_id', partnerId)
          .single();

        if (wallet) {
          await supabase
            .from('wallet_balances')
            .update({ 
              balance: wallet.balance + order.total_amount,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', partnerId);

          // Log refund transaction
          await supabase
            .from('wallet_transactions')
            .insert([{
              user_id: partnerId,
              amount: order.total_amount,
              type: 'order_refund',
              description: `Refund for cancelled order ${order.order_number || orderId}: ${reason}`,
              order_id: orderId,
              status: 'completed',
              created_at: new Date().toISOString()
            }]);
        }
      }

      return { success: true, data: updatedOrder };
    } catch (error) {
      console.error('Error cancelling order:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Order cancellation failed' 
      };
    }
  },

  /**
   * Get partner statistics (CORRECTED)
   */
  async getPartnerStats(partnerId: string) {
    try {
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('status, total_amount, payment_status')
        .eq('partner_id', partnerId);

      if (ordersError) throw ordersError;

      // ✅ CORRECT: Use wallet_balances
      const { data: wallet, error: walletError } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', partnerId)
        .single();

      // If wallet doesn't exist, create it
      let availableBalance = 0;
      if (walletError?.code === 'PGRST116') {
        const { data: newWallet } = await supabase
          .from('wallet_balances')
          .insert([{
            user_id: partnerId,
            balance: 0,
            currency: 'USD',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
        availableBalance = newWallet?.balance || 0;
      } else if (wallet) {
        availableBalance = wallet.balance;
      }

      const stats = {
        totalOrders: orders?.length || 0,
        totalRevenue: orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
        paidOrders: orders?.filter(o => o.payment_status === 'paid').length || 0,
        pendingOrders: orders?.filter(o => o.status === 'pending').length || 0,
        processingOrders: orders?.filter(o => o.status === 'processing').length || 0,
        shippedOrders: orders?.filter(o => o.status === 'shipped').length || 0,
        completedOrders: orders?.filter(o => o.status === 'completed').length || 0,
        cancelledOrders: orders?.filter(o => o.status === 'cancelled').length || 0,
        availableBalance,
        // These might need to come from partner_earnings table
        totalEarnings: 0, // Get from partner_earnings
        pendingBalance: 0  // Get from partner_earnings
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching partner stats:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch stats' };
    }
  }
};