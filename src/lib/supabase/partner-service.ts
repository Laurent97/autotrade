import { supabase } from './client';
import { walletService } from './wallet-service';
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
  /**
   * Get partner's orders (FINAL CORRECTED VERSION)
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
          product:products(
            make,
            sku,
            description,
            title,
            sale_price,
            original_price,
            condition
          ),
          partner_product:partner_products(
            selling_price,
            profit_margin,
            is_active
          )
        )
      `)
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return { data: data || [], error };
  },

  /**
   * Get order by ID (FINAL CORRECTED VERSION)
   */
  async getOrder(orderId: string) {
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
          product:products(
            make,
            sku,
            description,
            title,
            sale_price,
            original_price,
            condition
          ),
          partner_product:partner_products(
            selling_price,
            profit_margin,
            is_active
          )
        )
      `)
      .eq('id', orderId)
      .single();

    return { data, error };
  },

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: 'pending' | 'waiting_confirmation' | 'processing' | 'waiting_shipment' | 'shipped' | 'completed' | 'cancelled') {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Process order payment using wallet balance (FINAL CORRECTED VERSION)
   */
  async processOrderPayment(orderId: string, userId: string) {
    try {
      console.log('Processing payment for order:', orderId, 'by user:', userId);
      
      // Get partner profile for this user first
      const { data: partnerProfile, error: profileError } = await supabase
        .from('partner_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (profileError || !partnerProfile) {
        throw new Error('Partner profile not found');
      }

      console.log('Partner profile ID:', partnerProfile.id);
      
      // Get order details first
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, payment_status, partner_id')
        .eq('id', orderId)
        .single();

      if (orderError) {
        console.error('Order fetch error:', orderError);
        throw new Error(`Order not found: ${orderError.message}`);
      }
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      if (order.payment_status === 'paid') {
        throw new Error('Order is already paid');
      }

      // Verify the order belongs to this partner using partner profile ID
      if (order.partner_id !== partnerProfile.id) {
        console.error('Order partner_id:', order.partner_id, 'Partner profile ID:', partnerProfile.id);
        throw new Error('This order is not assigned to you');
      }

      console.log('Order details:', { orderNumber: order.order_number, amount: order.total_amount });

      // Get wallet balance using wallet service for consistency
      const { data: wallet, error: walletError } = await walletService.getBalance(userId);
      
      if (walletError) {
        console.error('Wallet fetch error:', walletError);
        throw new Error(`Failed to fetch wallet: ${walletError}`);
      }

      if (!wallet || wallet.balance === undefined) {
        throw new Error('Wallet not found or invalid');
      }

      console.log('Current wallet balance:', wallet.balance);

      if (wallet.balance < order.total_amount) {
        const needed = order.total_amount - wallet.balance;
        throw new Error(`Insufficient wallet balance. Current: $${wallet.balance.toFixed(2)}, Required: $${order.total_amount.toFixed(2)}. Need additional $${needed.toFixed(2)}.`);
      }

      console.log('Sufficient balance, processing payment...');

      // Start transaction-like operations
      const newBalance = wallet.balance - order.total_amount;
      
      // Update order status first
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'waiting_confirmation',
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Order update error:', updateError);
        throw new Error(`Failed to update order: ${updateError.message}`);
      }

      console.log('Order updated successfully');

      // Deduct from wallet using wallet service
      const { error: walletUpdateError } = await walletService.updateBalance(userId, {
        balance: newBalance
      });
      
      if (walletUpdateError) {
        console.error('Wallet update error:', walletUpdateError);
        // Try to rollback order status
        await supabase
          .from('orders')
          .update({
            status: 'pending',
            payment_status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
        throw new Error(`Failed to update wallet: ${walletUpdateError}`);
      }

      console.log('Wallet updated successfully');

      // Create wallet transaction record
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          amount: -order.total_amount,
          type: 'order_payment',
          description: `Payment for order ${order.order_number || orderId}`,
          order_id: orderId,
          status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (transactionError) {
        console.error('Transaction log error:', transactionError);
        // Don't fail the payment, just log the error
      }

      console.log('Payment processed successfully');
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
   * Cancel order with refund (ADMIN ONLY - Partners cannot cancel orders)
   * This function is kept for admin use but should not be exposed to partners
   */
  async cancelOrder(orderId: string, partnerId: string, reason: string): Promise<{
    success: boolean;
    message?: string;
    order?: any;
    error?: string;
  }> {
    // NOTE: This function should only be called by admin users
    // Partners should not be able to cancel orders directly
    console.warn('⚠️ Partner cancelOrder called - this should be admin only');
    
    try {
      // Get order details
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, payment_status')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;
      if (!order) throw new Error('Order not found');

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'CANCELLED',
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
            .insert({
              user_id: partnerId,
              amount: order.total_amount,
              type: 'order_refund',
              description: `Refund for cancelled order ${order.order_number || orderId}: ${reason}`,
              order_id: orderId,
              status: 'completed',
              created_at: new Date().toISOString()
            });
        }
      }

      // Return minimal data for immediate UI update
      return { 
        success: true, 
        message: 'Order cancelled successfully',
        order: {
          id: orderId,
          status: 'CANCELLED',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error cancelling order:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Order cancellation failed' 
      };
    }
  },

  /**
   * Get partner profile by user ID
   */
  async getPartnerProfile(userId: string) {
    try {
      console.log('🔍 Fetching partner profile for user:', userId);
      
      const { data, error } = await supabase
        .from('partner_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching partner profile:', error);
        
        // Handle case where profile doesn't exist
        if (error.code === 'PGRST116') {
          return { 
            data: null, 
            error: 'Partner profile not found. Please complete registration.' 
          };
        }
        
        throw error;
      }

      console.log('✅ Partner profile loaded:', data?.store_name);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Error in getPartnerProfile:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch partner profile' 
      };
    }
  },

  /**
   * Get partner statistics (FINAL CORRECTED VERSION)
   */
  async getPartnerStats(partnerId: string) {
    try {
      console.log('📊 Fetching stats for partner:', partnerId);
      
      // Get orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, status, payment_status')
        .eq('partner_id', partnerId);

      if (ordersError) throw ordersError;

      // Get wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', partnerId)
        .single();

      let availableBalance = 0;
      if (walletError?.code === 'PGRST116') {
        // Wallet doesn't exist yet
        console.log('Wallet not found, creating default...');
        availableBalance = 0;
      } else if (wallet) {
        availableBalance = wallet.balance;
      }

      // Calculate stats
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const paidOrders = orders?.filter(o => o.payment_status === 'paid').length || 0;
      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
      const processingOrders = orders?.filter(o => o.status === 'processing').length || 0;
      const shippedOrders = orders?.filter(o => o.status === 'shipped').length || 0;
      const completedOrders = orders?.filter(o => o.status === 'completed').length || 0;
      const cancelledOrders = orders?.filter(o => o.status === 'CANCELLED' || o.status === 'cancelled').length || 0;

      const stats = {
        totalOrders,
        totalRevenue,
        paidOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        completedOrders,
        cancelledOrders,
        availableBalance,
        totalEarnings: totalRevenue * 0.1, // 10% commission
        pendingBalance: 0
      };

      console.log('✅ Stats loaded:', stats);
      return { success: true, data: stats, error: null };
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      return { 
        success: false, 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch stats' 
      };
    }
  },

  async getRecentOrders(partnerId: string, limit = 5) {
    try {
      console.log('📋 Fetching recent orders for partner:', partnerId);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          status,
          created_at,
          user:users(email, full_name)
        `)
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ Error fetching recent orders:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch recent orders' 
      };
    }
  },

  /**
   * Get partner settings
   */
  async getPartnerSettings(userId: string) {
    try {
      console.log('🔍 Fetching partner settings for user:', userId);
      
      const { data, error } = await supabase
        .from('partner_profiles')
        .select(`
          store_name,
          description,
          contact_email,
          contact_phone,
          country,
          city,
          tax_id
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching partner settings:', error);
        
        // Handle case where profile doesn't exist
        if (error.code === 'PGRST116') {
          return { 
            data: null, 
            error: 'Partner profile not found. Please complete registration.' 
          };
        }
        
        throw error;
      }

      console.log('✅ Partner settings loaded:', data?.store_name);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Error in getPartnerSettings:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch partner settings' 
      };
    }
  },

  /**
   * Update partner settings
   */
  async updatePartnerSettings(userId: string, settings: {
    store_name?: string;
    description?: string;
    contact_email?: string;
    contact_phone?: string;
    country?: string;
    city?: string;
    tax_id?: string;
  }) {
    try {
      console.log('📝 Updating partner settings for user:', userId);
      
      const { data, error } = await supabase
        .from('partner_profiles')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating partner settings:', error);
        throw error;
      }

      console.log('✅ Partner settings updated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('❌ Error in updatePartnerSettings:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to update partner settings' 
      };
    }
  }
};
