import { supabase } from './client';

export const adminService = {
  // Get all users with their details
  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Update user information
  async updateUser(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  },

  // Update user wallet balance
  async updateWalletBalance(userId: string, amount: number, type: 'add' | 'subtract', reason: string) {
    // Get current balance
    const { data: currentBalance } = await supabase
      .from('wallet_balances')
      .select('balance')
      .eq('user_id', userId)
      .single();

    const current = currentBalance?.balance || 0;
    const newBalance = type === 'add' ? current + amount : current - amount;

    if (newBalance < 0) {
      throw new Error('Cannot set negative balance');
    }

    // Update balance
    const { error: balanceError } = await supabase
      .from('wallet_balances')
      .upsert({
        user_id: userId,
        balance: newBalance,
        updated_at: new Date().toISOString()
      });

    if (balanceError) throw balanceError;

    return { success: true, newBalance };
  },

  // Generate new Store ID
  async generateStoreId() {
    const { data, error } = await supabase.rpc('generate_store_id');
    return { data, error };
  },

  // Validate Store ID
  async validateStoreId(storeId: string) {
    const { data, error } = await supabase.rpc('validate_store_id', { store_id: storeId });
    return { data, error };
  },

  // Update partner Store ID
  async updatePartnerStoreId(partnerId: string, storeId: string) {
    const { data, error } = await supabase
      .from('partner_profiles')
      .update({ store_id: storeId })
      .eq('id', partnerId)
      .select()
      .single();

    return { data, error };
  },

  // Get partners with Store ID search
  async getPartnersWithStoreId(search?: string) {
    let query = supabase
      .from('partner_profiles')
      .select(`
        *,
        users!partner_profiles_user_id_fkey (
          email,
          full_name,
          phone
        )
      `);

    if (search) {
      query = query.or(`store_id.ilike.%${search}%,store_name.ilike.%${search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    return { data, error };
  },

  // Get partner statistics by Store ID
  async getPartnerStatsByStoreId(storeId: string, period: 'week' | 'month' | 'year' = 'month') {
    // Get partner info
    const { data: partner, error: partnerError } = await supabase
      .from('partner_profiles')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (partnerError) throw partnerError;

    // Calculate period start date
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // month
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get orders for this partner in the period
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('total_amount, status, created_at')
      .eq('partner_id', partner.user_id)
      .gte('created_at', startDate.toISOString());

    if (ordersError) throw ordersError;

    // Get products count for this partner
    const { count: productCount, error: productError } = await supabase
      .from('partner_products')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', partner.user_id);

    if (productError) throw productError;

    // Calculate period revenue
    const periodRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const periodOrders = orders?.length || 0;

    return {
      storeId,
      storeName: partner.store_name,
      period,
      stats: {
        totalRevenue: partner.total_earnings || 0,
        totalOrders: partner.store_visits || 0,
        totalProducts: productCount || 0,
        rating: partner.conversion_rate || 0,
        periodRevenue,
        periodOrders,
        pendingOrders: orders?.filter(o => o.status === 'pending').length || 0,
        conversionRate: productCount > 0 ? ((periodOrders / productCount) * 100).toFixed(2) : '0'
      }
    };
  },

  // Search partners by Store ID or name
  async searchPartners(query: string) {
    const { data, error } = await supabase
      .from('partner_profiles')
      .select(`
        store_id,
        store_name,
        store_slug,
        is_active,
        partner_status,
        created_at,
        users!partner_profiles_user_id_fkey (
          email,
          full_name
        )
      `)
      .or(`store_id.ilike.%${query}%,store_name.ilike.%${query}%,store_slug.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(10);

    return { data, error };
  },

  // Get all orders with details
  async getAllOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Assign order to partner
  async assignOrderToPartner(orderId: string, partnerId: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({
        partner_id: partnerId,
        status: 'pending', // Ensure order starts in pending status when assigned
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    return { data, error };
  },

  // Update order status
  async updateOrderStatus(orderId: string, status: string) {
    // Determine payment status based on order status
    let paymentStatus = 'pending';
    if (status === 'completed' || status === 'shipped' || status === 'processing') {
      paymentStatus = 'paid';
    } else if (status === 'cancelled') {
      paymentStatus = 'cancelled';
    }

    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    // Process partner commission when order is delivered or completed
    if ((status === 'delivered' || status === 'completed') && data?.partner_id) {
      try {
        console.log(`💰 Processing partner commission for order ${orderId} with status ${status}`);
        const { partnerTransactionService } = await import('./partner-transaction-service');
        const payoutResult = await partnerTransactionService.processPartnerPayout(orderId, data.partner_id);
        
        if (payoutResult.success) {
          console.log(`✅ Partner commission processed successfully for order ${orderId}`);
        } else {
          console.error(`❌ Failed to process partner commission for order ${orderId}:`, payoutResult.error);
        }
      } catch (commissionError) {
        console.error(`❌ Error processing partner commission for order ${orderId}:`, commissionError);
      }
    }

    return { data, error };
  },

  // Cancel order and refund to partner wallet (Updated for immediate UI updates)
  async cancelOrder(orderId: string, reason: string, refundPartner: boolean = true): Promise<{
    success: boolean;
    message?: string;
    order?: any;
    error?: string;
  }> {
    try {
      console.log('❌ Starting cancel operation for order:', orderId, 'reason:', reason);
      
      // Fetch order details first
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError) {
        console.error('❌ Failed to fetch order:', fetchError);
        throw fetchError;
      }
      if (!order) {
        console.error('❌ Order not found:', orderId);
        throw new Error('Order not found');
      }

      console.log('📋 Order found:', order.order_number || orderId);

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'CANCELLED',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('❌ Update error:', updateError);
        // If cancelled_at column doesn't exist, try without it
        if (updateError.message?.includes('cancelled_at')) {
          console.log('🔄 Retrying without cancelled_at column...');
          const { error: retryError } = await supabase
            .from('orders')
            .update({
              status: 'CANCELLED',
              cancellation_reason: reason,
              updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

          if (retryError) {
            console.error('❌ Retry failed:', retryError);
            throw retryError;
          }
          console.log('✅ Order updated successfully (retry)');
        } else {
          throw updateError;
        }
      } else {
        console.log('✅ Order updated successfully');
      }

      // Refund to partner wallet if paid
      if (refundPartner && order.payment_status === 'paid' && order.partner_id) {
        const { data: wallet } = await supabase
          .from('wallet_balances')
          .select('balance')
          .eq('user_id', order.partner_id)
          .single();

        if (wallet) {
          // Update wallet balance
          await supabase
            .from('wallet_balances')
            .update({ 
              balance: wallet.balance + order.total_amount,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', order.partner_id);

          // Log refund transaction
          await supabase
            .from('wallet_transactions')
            .insert({
              user_id: order.partner_id,
              amount: order.total_amount,
              type: 'order_refund',
              description: `Admin refund for cancelled order ${order.order_number || orderId}: ${reason}`,
              order_id: order.order_number || orderId, // Ensure order_id is always provided
              status: 'completed',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
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

  // Delete order completely
  async deleteOrder(orderId: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
    error?: string;
  }> {
    try {
      console.log('🗑️ Starting delete operation for order:', orderId);
      
      // Get current admin user ID for audit
      const { data: { user } } = await supabase.auth.getUser();
      
      // Use the database function with correct parameter order (admin_user_id, order_uuid)
      const { data, error } = await supabase.rpc('delete_order_completely', {
        admin_user_id: user?.id || null,
        order_uuid: orderId
      });

      if (error) {
        console.error('❌ Transaction failed:', error);
        return { 
          success: false, 
          message: 'Database error', 
          error: error.message 
        };
      }

      // Parse JSONB response
      if (data?.success === true) {
        console.log('✅ Transaction completed successfully');
        return { 
          success: true, 
          message: data?.message || 'Order deleted successfully',
          data: data
        };
      } else {
        console.error('❌ Transaction returned false');
        return { 
          success: false, 
          message: data?.message || 'Failed to delete order',
          error: data?.error || 'Database transaction failed'
        };
      }
    } catch (error) {
      console.error('💥 Error in deleteOrder function:', error);
      return { 
        success: false, 
        message: 'Unexpected error occurred',
        error: error instanceof Error ? error.message : 'Order deletion failed' 
      };
    }
  },

  // Mark order as shipped with tracking
  async markOrderAsShipped(orderId: string, trackingNumber: string, carrier: string) {
    try {
      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'shipped',
          tracking_number: trackingNumber,
          carrier: carrier,
          shipped_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update order tracking
      const { error: logisticsError } = await supabase
        .from('order_tracking')
        .upsert({
          order_id: orderId,
          tracking_number: trackingNumber,
          carrier: carrier,
          status: 'shipped',
          shipped_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'order_id'
        });

      if (logisticsError) throw logisticsError;

      return { success: true, message: 'Order marked as shipped' };
    } catch (error) {
      console.error('Error marking order as shipped:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to mark order as shipped' 
      };
    }
  },

  // Mark order as completed
  async completeOrder(orderId: string) {
    try {
      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          delivered_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update order tracking
      const { error: logisticsError } = await supabase
        .from('order_tracking')
        .upsert({
          order_id: orderId,
          status: 'delivered',
          actual_delivery: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'order_id'
        });

      if (logisticsError) throw logisticsError;

      return { success: true, message: 'Order marked as completed' };
    } catch (error) {
      console.error('Error completing order:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to complete order' 
      };
    }
  },

  // Update order information
  async updateLogistics(orderId: string, logisticsData: any) {
    const { data, error } = await supabase
      .from('order_tracking')
      .upsert({
        order_id: orderId,
        ...logisticsData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'order_id'
      })
      .select()
      .single();

    return { data, error };
  },

  // Get dashboard statistics
  async getDashboardStats() {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get total partners
    const { count: totalPartners } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('user_type', 'partner')
      .eq('partner_status', 'approved');

    // Get total orders
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    // Get total revenue
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('payment_status', 'paid');

    const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

    // Get pending partner applications
    const { count: pendingPartners } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('partner_status', 'pending');

    return {
      totalUsers: totalUsers || 0,
      totalPartners: totalPartners || 0,
      totalOrders: totalOrders || 0,
      totalRevenue,
      pendingPartners: pendingPartners || 0
    };
  }
};
