import { supabase } from './client';

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'order_payment' | 'order_refund' | 'commission' | 'bonus';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  payment_method?: string;
  order_id?: string;
  transaction_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface WalletBalance {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface WalletStats {
  totalEarnings: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingBalance: number;
  availableBalance: number;
  transactionCount: number;
  lastTransaction?: WalletTransaction;
}

export const walletService = {
  // Get wallet balance
  async getBalance(userId: string): Promise<{ data: WalletBalance | null; error: any }> {
    try {
      console.log('Fetching wallet balance for user:', userId);
      const { data, error } = await supabase
        .from('wallet_balances')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        console.log('Creating new wallet for user:', userId);
        // Create new wallet if it doesn't exist
        const { data: newBalance, error: createError } = await supabase
          .from('wallet_balances')
          .insert({
            user_id: userId,
            balance: 0,
            currency: 'USD'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating wallet:', createError);
          return { data: null, error: createError };
        }

        console.log('New wallet created successfully for user:', userId);
        return { data: newBalance, error: null };
      }

      if (error) {
        console.error('Error fetching wallet balance:', error);
      } else {
        console.log('Wallet balance fetched successfully:', data?.balance);
      }

      return { data, error };
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      return { data: null, error };
    }
  },

  // Recalculate wallet balance from transactions
  async recalculateBalance(userId: string): Promise<{ data: WalletBalance | null; error: any }> {
    try {
      console.log('🔄 Recalculating wallet balance for user:', userId);
      
      // Get all completed transactions
      const { data: transactions, error: transactionError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (transactionError) {
        console.error('Error fetching transactions for recalculation:', transactionError);
        return { data: null, error: transactionError };
      }

      console.log('📋 Found transactions:', transactions?.length || 0);
      console.log('📋 Transaction details:', transactions);

      // Calculate balance from transactions
      let calculatedBalance = 0;
      
      if (transactions && transactions.length > 0) {
        calculatedBalance = transactions.reduce((balance, transaction) => {
          switch (transaction.type) {
            case 'deposit':
            case 'commission':
            case 'bonus':
            case 'order_refund':
              return balance + transaction.amount;
            case 'withdrawal':
            case 'order_payment':
              return balance - transaction.amount;
            default:
              return balance;
          }
        }, 0);
      }

      console.log('💰 Calculated balance from transactions:', calculatedBalance);

      // Also check if there are any transactions (including non-completed)
      const { data: allTransactions, error: allTxError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId);

      if (!allTxError) {
        console.log('📊 All transactions (any status):', allTransactions?.length || 0);
        console.log('📊 All transaction details:', allTransactions);
      }

      // If no transactions, try calculating from orders (this might be the expected balance)
      if (calculatedBalance === 0) {
        console.log('🔍 No wallet transactions found, trying to calculate from orders...');
        
        // Get partner ID from user ID
        const { data: partnerProfile } = await supabase
          .from('partner_profiles')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (partnerProfile) {
          console.log('👤 Found partner profile:', partnerProfile.id);
          
          // Get all paid orders for this partner
          const { data: orders } = await supabase
            .from('orders')
            .select('total_amount, payment_status')
            .eq('partner_id', partnerProfile.id)
            .eq('payment_status', 'paid');

          if (orders && orders.length > 0) {
            const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
            const commissionEarned = totalRevenue * 0.1; // 10% commission
            
            console.log('💵 Total revenue from orders:', totalRevenue);
            console.log('💰 Commission earned (10%):', commissionEarned);
            
            calculatedBalance = commissionEarned;
          }
        }
      }

      // Update wallet balance
      const { data: updatedWallet, error: updateError } = await supabase
        .from('wallet_balances')
        .update({
          balance: calculatedBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating wallet balance:', updateError);
        return { data: null, error: updateError };
      }

      console.log('✅ Wallet balance updated successfully:', updatedWallet?.balance);
      return { data: updatedWallet, error: null };

    } catch (error) {
      console.error('Error recalculating wallet balance:', error);
      return { data: null, error };
    }
  },

  // Get wallet transactions
  async getTransactions(userId: string, limit = 50, offset = 0): Promise<{ data: WalletTransaction[]; error: any }> {
    try {
      console.log('Fetching transactions for user:', userId);
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.warn('Transactions table might not exist:', error);
        return { data: [], error: null };
      }

      console.log('Transactions fetched successfully:', data?.length || 0, 'transactions');
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      return { data: [], error };
    }
  },

  // Get wallet statistics
  async getWalletStats(userId: string): Promise<{ data: WalletStats | null; error: any }> {
    try {
      const { data: balance, error: balanceError } = await this.getBalance(userId);
      if (balanceError) throw balanceError;

      const { data: transactions, error: transactionError } = await this.getTransactions(userId, 100);
      if (transactionError) throw transactionError;

      const stats: WalletStats = {
        totalEarnings: transactions?.filter(t => t.type === 'commission' || t.type === 'bonus').reduce((sum, t) => sum + t.amount, 0) || 0,
        totalDeposits: transactions?.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0) || 0,
        totalWithdrawals: Math.abs(transactions?.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0) || 0),
        pendingBalance: 0, // Calculate from pending transactions if needed
        availableBalance: balance?.balance || 0,
        transactionCount: transactions?.length || 0,
        lastTransaction: transactions?.[0] || undefined
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error fetching wallet stats:', error);
      return { data: null, error };
    }
  },

  // Add getStats method for compatibility
  async getStats(userId: string): Promise<{ data: WalletStats | null; error: any }> {
    try {
      const { data: stats, error } = await this.getWalletStats(userId);
      return { data: stats, error };
    } catch (error) {
      console.error('Error fetching wallet stats:', error);
      return { data: null, error };
    }
  },

  // Add funds to wallet (pending approval)
  async addFunds(userId: string, amount: number, paymentMethod: string, description: string): Promise<{ data: WalletTransaction | null; error: any }> {
    try {
      const { data: transaction, error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          type: 'deposit',
          amount,
          status: 'pending', // Changed from 'completed' to 'pending'
          description,
          payment_method: paymentMethod,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Do NOT update wallet balance immediately - wait for admin approval
      return { data: transaction, error: null };
    } catch (error) {
      console.error('Error adding funds:', error);
      return { data: null, error };
    }
  },

  // Withdraw funds from wallet (pending approval)
  async withdrawFunds(userId: string, amount: number, paymentMethod: string, description: string): Promise<{ data: WalletTransaction | null; error: any }> {
    try {
      const { data: balance, error: balanceError } = await this.getBalance(userId);
      if (balanceError) throw balanceError;

      if (!balance || balance.balance < amount) {
        throw new Error('Insufficient balance');
      }

      const { data: transaction, error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          type: 'withdrawal',
          amount,
          status: 'pending', // Changed from 'completed' to 'pending'
          description,
          payment_method: paymentMethod,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Do NOT update wallet balance immediately - wait for admin approval
      return { data: transaction, error: null };
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      return { data: null, error };
    }
  },

  // Get available balance
  async getAvailableBalance(userId: string): Promise<{ data: number; error: any }> {
    try {
      const { data, error } = await this.getBalance(userId);
      return { data: data?.balance || 0, error };
    } catch (error) {
      console.error('Error fetching available balance:', error);
      return { data: 0, error };
    }
  },

  // Update wallet balance (for internal use)
  async updateBalance(userId: string, updates: Partial<WalletBalance>): Promise<{ data: WalletBalance | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('wallet_balances')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      return { data: null, error };
    }
  },

  // Admin: Approve pending deposit
  async approveDeposit(transactionId: string): Promise<{ data: WalletTransaction | null; error: any }> {
    try {
      // Get the transaction
      const { data: transaction, error: fetchError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (fetchError) throw fetchError;

      if (transaction.status !== 'pending') {
        throw new Error('Transaction is not pending approval');
      }

      // Update transaction status to completed
      const { data: updatedTransaction, error: updateError } = await supabase
        .from('wallet_transactions')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update wallet balance
      const { error: balanceError } = await supabase
        .from('wallet_balances')
        .update({
          balance: transaction.amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', transaction.user_id);

      if (balanceError) throw balanceError;

      return { data: updatedTransaction, error: null };
    } catch (error) {
      console.error('Error approving deposit:', error);
      return { data: null, error };
    }
  },

  // Admin: Approve pending withdrawal
  async approveWithdrawal(transactionId: string): Promise<{ data: WalletTransaction | null; error: any }> {
    try {
      // Get the transaction
      const { data: transaction, error: fetchError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (fetchError) throw fetchError;

      if (transaction.status !== 'pending') {
        throw new Error('Transaction is not pending approval');
      }

      // Update transaction status to completed
      const { data: updatedTransaction, error: updateError } = await supabase
        .from('wallet_transactions')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update wallet balance (reduce by withdrawal amount)
      const { data: currentBalance, error: fetchBalanceError } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', transaction.user_id)
        .single();

      if (fetchBalanceError) throw fetchBalanceError;

      const { error: balanceError } = await supabase
        .from('wallet_balances')
        .update({
          balance: currentBalance.balance - transaction.amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', transaction.user_id);

      if (balanceError) throw balanceError;

      return { data: updatedTransaction, error: null };
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      return { data: null, error };
    }
  },

  // Admin: Reject transaction
  async rejectTransaction(transactionId: string, reason: string): Promise<{ data: WalletTransaction | null; error: any }> {
    try {
      const { data: transaction } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      const { data: updatedTransaction, error } = await supabase
        .from('wallet_transactions')
        .update({
          status: 'rejected',
          description: `${transaction?.description || ''} - Rejected: ${reason}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .select()
        .single();

      return { data: updatedTransaction, error };
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      return { data: null, error };
    }
  }
};
