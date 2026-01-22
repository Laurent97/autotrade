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
        .select('balance, currency, updated_at')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        console.log('Creating new wallet for user:', userId);
        
        const { data: newBalance, error: createError } = await supabase
          .from('wallet_balances')
          .insert({
            user_id: userId,
            balance: 0,
            currency: 'USD',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Failed to create wallet:', createError);
          return { data: newBalance, error: createError.message };
        }
        
        return { data: newBalance as WalletBalance, error: null };
      }

      return { data: data as WalletBalance, error };
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
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

      console.log('Transactions loaded:', data?.length);
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

  // Add funds to wallet
  async addFunds(userId: string, amount: number, paymentMethod: string, description: string): Promise<{ data: WalletTransaction | null; error: any }> {
    try {
      const { data: transaction, error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          type: 'deposit',
          amount,
          status: 'completed',
          description,
          payment_method: paymentMethod,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update wallet balance
      const { data: currentBalance } = await this.getBalance(userId);
      if (currentBalance) {
        const { error: updateError } = await supabase
          .from('wallet_balances')
          .update({
            balance: currentBalance.balance + amount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (updateError) throw updateError;
      }

      return { data: transaction, error: null };
    } catch (error) {
      console.error('Error adding funds:', error);
      return { data: null, error };
    }
  },

  // Withdraw funds from wallet
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
          status: 'completed',
          description,
          payment_method: paymentMethod,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('wallet_balances')
        .update({
          balance: balance.balance - amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

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
  }
};
