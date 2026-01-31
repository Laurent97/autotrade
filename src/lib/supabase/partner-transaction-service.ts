import { supabase } from './client';
import { walletService } from './wallet-service';

export interface PartnerTransaction {
  id: string;
  partner_id: string;
  order_id?: string;
  transaction_type: 'payment' | 'payout' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  payment_method?: string;
  transaction_reference?: string;
  created_at: string;
  processed_at?: string;
  failed_at?: string;
  failure_reason?: string;
  metadata?: Record<string, any>;
  orders?: {
    order_number: string;
    total_amount: number;
    status: string;
  };
}

export interface PartnerOrderPayment {
  base_cost_total: number;
  partner_payment_amount: number;
  partner_payout_amount: number;
  partner_payment_status: 'pending' | 'completed' | 'failed';
  partner_payout_status: 'pending' | 'completed' | 'failed';
}

export const partnerTransactionService = {
  /**
   * Create a partner transaction record
   */
  async createTransaction(data: Omit<PartnerTransaction, 'id' | 'created_at' | 'processed_at' | 'failed_at'>) {
    try {
      const { data: transaction, error } = await supabase
        .from('partner_transactions')
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          metadata: data.metadata || {}
        })
        .select()
        .single();

      if (error) throw error;
      return { data: transaction, error: null };
    } catch (error) {
      console.error('Error creating partner transaction:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to create transaction' 
      };
    }
  },

  /**
   * Get partner transactions with pagination and filtering
   */
  async getPartnerTransactions(
    partnerId: string, 
    options: {
      type?: 'payment' | 'payout' | 'refund';
      status?: 'pending' | 'completed' | 'failed' | 'cancelled';
      limit?: number;
      offset?: number;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ) {
    try {
      let query = supabase
        .from('partner_transactions')
        .select(`
          *,
          orders:order_id(
            order_number,
            total_amount,
            status
          )
        `)
        .eq('partner_id', partnerId);

      // Apply filters
      if (options.type) {
        query = query.eq('transaction_type', options.type);
      }
      if (options.status) {
        query = query.eq('status', options.status);
      }
      if (options.dateFrom) {
        query = query.gte('created_at', options.dateFrom);
      }
      if (options.dateTo) {
        query = query.lte('created_at', options.dateTo);
      }

      // Apply pagination
      const limit = options.limit || 50;
      const offset = options.offset || 0;

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching partner transactions:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch transactions' 
      };
    }
  },

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    transactionId: string, 
    status: 'pending' | 'completed' | 'failed' | 'cancelled',
    failureReason?: string
  ) {
    try {
      const updateData: any = { status };
      
      if (status === 'completed') {
        updateData.processed_at = new Date().toISOString();
      } else if (status === 'failed') {
        updateData.failed_at = new Date().toISOString();
        updateData.failure_reason = failureReason;
      }

      const { data, error } = await supabase
        .from('partner_transactions')
        .update(updateData)
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating transaction status:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to update transaction status' 
      };
    }
  },

  /**
   * Calculate base cost total for order items
   */
  async calculateOrderBaseCost(orderId: string): Promise<number> {
    try {
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          partner_product:partner_product_id(
            base_cost_price
          )
        `)
        .eq('order_id', orderId);

      if (error) throw error;

      const baseCostTotal = orderItems?.reduce((total, item) => {
        const baseCost = item.partner_product?.base_cost_price || 0;
        return total + (baseCost * item.quantity);
      }, 0) || 0;

      return baseCostTotal;
    } catch (error) {
      console.error('Error calculating order base cost:', error);
      throw error;
    }
  },

  /**
   * Process partner payment when order is assigned
   */
  async processPartnerPayment(orderId: string, partnerId: string): Promise<{
    success: boolean;
    error?: string;
    transaction?: PartnerTransaction;
  }> {
    try {
      console.log('Processing partner payment for order:', orderId, 'partner:', partnerId);

      // 1. Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('order_number, total_amount, partner_payment_status')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      if (!order) throw new Error('Order not found');

      // 2. Check if payment already processed
      if (order.partner_payment_status === 'completed') {
        throw new Error('Payment already processed for this order');
      }

      // 3. Calculate base cost total
      const baseCostTotal = await this.calculateOrderBaseCost(orderId);

      if (baseCostTotal <= 0) {
        throw new Error('Invalid base cost total');
      }

      console.log('Base cost total calculated:', baseCostTotal);

      // 4. Get partner user ID for wallet operations
      const { data: partnerProfile, error: profileError } = await supabase
        .from('partner_profiles')
        .select('user_id')
        .eq('id', partnerId)
        .single();

      if (profileError) throw profileError;
      if (!partnerProfile) throw new Error('Partner profile not found');

      // 5. Check wallet balance
      const { data: wallet, error: walletError } = await walletService.getBalance(partnerProfile.user_id);
      
      if (walletError || !wallet) {
        throw new Error('Failed to fetch wallet balance');
      }

      if (wallet.balance < baseCostTotal) {
        throw new Error(`Insufficient balance. Required: $${baseCostTotal.toFixed(2)}, Available: $${wallet.balance.toFixed(2)}`);
      }

      // 6. Create payment transaction
      const { data: transaction, error: transactionError } = await this.createTransaction({
        partner_id: partnerId,
        order_id: orderId,
        transaction_type: 'payment',
        amount: baseCostTotal,
        status: 'pending',
        description: `Payment for order ${order.order_number} (base cost)`,
        payment_method: 'wallet'
      });

      if (transactionError) throw transactionError;
      if (!transaction) throw new Error('Failed to create transaction');

      // 7. Process wallet deduction
      const { error: deductError } = await walletService.updateBalance(partnerProfile.user_id, {
        balance: wallet.balance - baseCostTotal
      });

      if (deductError) {
        // Mark transaction as failed
        await this.updateTransactionStatus(transaction.id, 'failed', 'Wallet deduction failed');
        throw deductError;
      }

      // 8. Update order payment status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          base_cost_total: baseCostTotal,
          partner_payment_amount: baseCostTotal,
          partner_payout_amount: order.total_amount, // Full selling price
          partner_payment_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        // Rollback wallet transaction
        await walletService.updateBalance(partnerProfile.user_id, {
          balance: wallet.balance
        });
        await this.updateTransactionStatus(transaction.id, 'failed', 'Order update failed');
        throw updateError;
      }

      // 9. Mark transaction as completed
      await this.updateTransactionStatus(transaction.id, 'completed');

      // 10. Create wallet transaction record
      await supabase
        .from('wallet_transactions')
        .insert({
          user_id: partnerProfile.user_id,
          amount: -baseCostTotal,
          type: 'partner_payment',
          description: `Payment for order ${order.order_number} (base cost)`,
          order_id: orderId,
          status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      console.log('Partner payment processed successfully');
      return { success: true, transaction };
    } catch (error) {
      console.error('Error processing partner payment:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment processing failed' 
      };
    }
  },

  /**
   * Process partner payout when order is completed
   */
  async processPartnerPayout(orderId: string, partnerId: string): Promise<{
    success: boolean;
    error?: string;
    transaction?: PartnerTransaction;
  }> {
    try {
      console.log('Processing partner payout for order:', orderId, 'partner:', partnerId);

      // 1. Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('order_number, total_amount, partner_payout_status, partner_payout_amount')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      if (!order) throw new Error('Order not found');

      // 2. Check if payout already processed
      if (order.partner_payout_status === 'completed') {
        throw new Error('Payout already processed for this order');
      }

      // 3. Get partner commission rate and calculate payout amount
      const { data: partnerProfile, error: profileError } = await supabase
        .from('partner_profiles')
        .select('user_id, commission_rate')
        .eq('id', partnerId)
        .single();

      if (profileError) throw profileError;
      if (!partnerProfile) throw new Error('Partner profile not found');

      // Convert percentage to decimal (15% -> 0.15) for calculation
      const commissionRate = (partnerProfile.commission_rate || 10) / 100;
      const payoutAmount = order.partner_payout_amount || (order.total_amount * commissionRate);

      if (payoutAmount <= 0) {
        throw new Error('Invalid payout amount');
      }

      console.log('Payout calculation:', {
        totalAmount: order.total_amount,
        commissionRate: commissionRate,
        payoutAmount
      });

      // 5. Create payout transaction
      const { data: transaction, error: transactionError } = await this.createTransaction({
        partner_id: partnerId,
        order_id: orderId,
        transaction_type: 'payout',
        amount: payoutAmount,
        status: 'pending',
        description: `Commission payout for order ${order.order_number} - ${order.total_amount} × ${commissionRate} = ${payoutAmount}`,
        payment_method: 'wallet'
      });

      if (transactionError) throw transactionError;
      if (!transaction) throw new Error('Failed to create transaction');

      // 6. Get current wallet balance
      const { data: wallet, error: walletError } = await walletService.getBalance(partnerProfile.user_id);
      
      if (walletError || !wallet) {
        throw new Error('Failed to fetch wallet balance');
      }

      // 7. Process wallet credit
      const { error: creditError } = await walletService.updateBalance(partnerProfile.user_id, {
        balance: wallet.balance + payoutAmount
      });

      if (creditError) {
        // Mark transaction as failed
        await this.updateTransactionStatus(transaction.id, 'failed', 'Wallet credit failed');
        throw creditError;
      }

      // 8. Update order payout status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          partner_payout_status: 'completed',
          partner_payout_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        // Rollback wallet transaction
        await walletService.updateBalance(partnerProfile.user_id, {
          balance: wallet.balance
        });
        await this.updateTransactionStatus(transaction.id, 'failed', 'Order update failed');
        throw updateError;
      }

      // 9. Mark transaction as completed
      await this.updateTransactionStatus(transaction.id, 'completed');

      // 10. Create wallet transaction record
      await supabase
        .from('wallet_transactions')
        .insert({
          user_id: partnerProfile.user_id,
          amount: payoutAmount,
          type: 'partner_payout',
          description: `Payout for order ${order.order_number} (selling price)`,
          order_id: orderId,
          status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      console.log('Partner payout processed successfully');
      return { success: true, transaction };
    } catch (error) {
      console.error('Error processing partner payout:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payout processing failed' 
      };
    }
  },

  /**
   * Get partner financial summary
   */
  async getPartnerFinancialSummary(partnerId: string) {
    try {
      const { data, error } = await supabase
        .from('partner_financial_summary')
        .select('*')
        .eq('partner_id', partnerId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data yet, return default values
          return {
            data: {
              partner_id: partnerId,
              total_orders: 0,
              completed_orders: 0,
              total_payments: 0,
              total_payouts: 0,
              total_profit: 0,
              avg_profit_per_order: 0,
              total_revenue: 0,
              platform_revenue: 0
            },
            error: null
          };
        }
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching partner financial summary:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch financial summary' 
      };
    }
  },

  /**
   * Get transaction statistics
   */
  async getTransactionStats(partnerId: string, period: '7d' | '30d' | '90d' | '1y' = '30d') {
    try {
      const now = new Date();
      let dateFrom: Date;

      switch (period) {
        case '7d':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }

      const { data, error } = await supabase
        .from('partner_transactions')
        .select('transaction_type, amount, status, created_at')
        .eq('partner_id', partnerId)
        .gte('created_at', dateFrom.toISOString())
        .eq('status', 'completed');

      if (error) throw error;

      const stats = {
        totalPayments: data?.filter(t => t.transaction_type === 'payment').reduce((sum, t) => sum + t.amount, 0) || 0,
        totalPayouts: data?.filter(t => t.transaction_type === 'payout').reduce((sum, t) => sum + t.amount, 0) || 0,
        totalRefunds: data?.filter(t => t.transaction_type === 'refund').reduce((sum, t) => sum + t.amount, 0) || 0,
        netProfit: 0,
        transactionCount: data?.length || 0
      };

      stats.netProfit = stats.totalPayouts - stats.totalPayments;

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error fetching transaction stats:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch transaction stats' 
      };
    }
  }
};
