import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { walletService } from '../lib/supabase/wallet-service';
import { useRealtimeSubscription } from './useRealtimeSubscription';

interface WalletBalance {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  pending_balance?: number;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'order_payment' | 'order_refund' | 'commission' | 'bonus';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  created_at: string;
  payment_method?: string;
  order_id?: string;
  transaction_hash?: string;
}

interface WalletStats {
  totalEarnings: number;
  totalWithdrawn: number;
  totalDeposits: number;
  pendingBalance: number;
  availableBalance: number;
  transactionCount: number;
}

export function useWalletData() {
  const { user } = useAuth();
  
  // Real-time wallet balance data
  const { data: walletData, loading: walletLoading, refresh: refreshWallet } = useRealtimeSubscription(
    async () => {
      if (!user) return [];
      const { data } = await walletService.getBalance(user.id);
      return data ? [data] : [];
    },
    {
      table: 'wallet_balances',
      event: '*',
      filter: `user_id=eq.${user?.id}`
    }
  );

  // Real-time transactions data
  const { data: transactions, loading: transactionsLoading, refresh: refreshTransactions } = useRealtimeSubscription(
    async () => {
      if (!user) return [];
      const { data } = await walletService.getTransactions(user.id, 50); // Get more transactions for stats
      return data || [];
    },
    {
      table: 'wallet_transactions',
      event: '*',
      filter: `user_id=eq.${user?.id}`
    }
  );

  // Calculate stats from transactions and wallet balance
  const stats: WalletStats = {
    totalEarnings: transactions
      ?.filter(t => (t.type === 'commission' || t.type === 'bonus') && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0) || 0,
    
    totalWithdrawn: transactions
      ?.filter(t => t.type === 'withdrawal' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0) || 0,
    
    totalDeposits: transactions
      ?.filter(t => t.type === 'deposit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0) || 0,
    
    pendingBalance: transactions
      ?.filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0) || 0,
    
    availableBalance: walletData?.[0]?.balance || 0,
    
    transactionCount: transactions?.length || 0
  };

  const wallet = walletData?.[0] || null;

  const refreshAll = async () => {
    await Promise.all([refreshWallet(), refreshTransactions()]);
  };

  return {
    wallet,
    transactions,
    stats,
    loading: walletLoading || transactionsLoading,
    refresh: refreshAll,
    refreshWallet,
    refreshTransactions
  };
}

// Export individual values for easy consumption
export function useWalletBalance() {
  const { wallet, loading, refresh } = useWalletData();
  return {
    balance: wallet?.balance || 0,
    pendingBalance: wallet?.pending_balance || 0,
    currency: wallet?.currency || 'USD',
    loading,
    refresh
  };
}

export function useWalletStats() {
  const { stats, loading, refresh } = useWalletData();
  return { stats, loading, refresh };
}

export function useWalletTransactions() {
  const { transactions, loading, refresh } = useWalletData();
  return { transactions, loading, refresh };
}
