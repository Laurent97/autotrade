import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { walletService } from '../../lib/supabase/wallet-service';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign,
  RefreshCw,
  Download,
  Upload,
  History,
  AlertCircle,
  Clock
} from 'lucide-react';

interface WalletBalance {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
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

export default function DashboardWallet() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalWithdrawn: 0,
    totalDeposits: 0,
    pendingBalance: 0,
    availableBalance: 0,
    transactionCount: 0
  });

  // Check for dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const htmlElement = document.documentElement;
    setIsDarkMode(htmlElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    loadWalletData();
  }, [user, userProfile]);

  const loadWalletData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load wallet balance
      const { data: walletData } = await walletService.getBalance(user.id);
      setWallet(walletData);

      // Load recent transactions
      const { data: transactionsData } = await walletService.getTransactions(user.id, 20);
      setTransactions(transactionsData);

      // Load wallet stats
      const { data: statsData } = await walletService.getStats(user.id);
      console.log('Wallet Dashboard - Wallet Stats:', statsData);
      console.log('Wallet Dashboard - Available Balance:', statsData?.availableBalance);
      setStats({
        totalEarnings: statsData.totalEarnings,
        totalWithdrawn: statsData.totalWithdrawals,
        totalDeposits: statsData.totalDeposits,
        pendingBalance: statsData.pendingBalance,
        availableBalance: statsData.availableBalance,
        transactionCount: statsData.transactionCount
      });
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  const handleDeposit = () => {
    // Navigate to wallet deposit page
    navigate('/partner/dashboard/wallet/deposit');
  };

  const handleWithdraw = () => {
    // Navigate to withdrawal page (can be implemented later)
    navigate('/payment/withdraw');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    const iconClass = isDarkMode ? "w-4 h-4" : "w-4 h-4";
    switch (type) {
      case 'deposit':
        return <ArrowUpRight className={`${iconClass} ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />;
      case 'withdrawal':
        return <ArrowDownRight className={`${iconClass} ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />;
      case 'order_payment':
        return <DollarSign className={`${iconClass} ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />;
      case 'order_refund':
        return <RefreshCw className={`${iconClass} ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />;
      default:
        return <Wallet className={`${iconClass} ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />;
    }
  };

  const getStatusColor = (status: string) => {
    if (isDarkMode) {
      switch (status) {
        case 'completed':
          return 'text-green-400 bg-green-900/30';
        case 'pending':
          return 'text-yellow-400 bg-yellow-900/30';
        case 'failed':
          return 'text-red-400 bg-red-900/30';
        default:
          return 'text-gray-400 bg-gray-900/30';
      }
    } else {
      switch (status) {
        case 'completed':
          return 'text-green-600 bg-green-100';
        case 'pending':
          return 'text-yellow-600 bg-yellow-100';
        case 'failed':
          return 'text-red-600 bg-red-100';
        default:
          return 'text-gray-600 bg-gray-100';
      }
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center py-16 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Wallet</h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage your earnings and payments</p>
        </div>

        {/* Main Balance Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-xl p-8 text-white mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Wallet className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-semibold">Available Balance</h2>
                <p className="text-blue-100 dark:text-blue-200/80">Automatically used for order payments</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              disabled={refreshing}
              title="Refresh wallet data"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="text-4xl font-bold mb-6">
            {formatCurrency(stats.availableBalance || 0)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 dark:bg-white/5 rounded-lg p-4">
              <p className="text-blue-100 dark:text-blue-200/80 text-sm">Pending Balance</p>
              <p className="text-xl font-semibold">{formatCurrency(stats.pendingBalance || 0)}</p>
            </div>
            <div className="bg-white/10 dark:bg-white/5 rounded-lg p-4">
              <p className="text-blue-100 dark:text-blue-200/80 text-sm">Total Earnings</p>
              <p className="text-xl font-semibold">{formatCurrency(stats.totalEarnings || 0)}</p>
            </div>
            <div className="bg-white/10 dark:bg-white/5 rounded-lg p-4">
              <p className="text-blue-100 dark:text-blue-200/80 text-sm">Last Updated</p>
              <p className="text-xl font-semibold">
                {wallet?.updated_at ? formatDate(wallet.updated_at) : 'Never'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={handleDeposit}
            className={`rounded-xl p-6 border transition-all group ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700 hover:border-green-500 hover:shadow-lg hover:shadow-green-500/10' 
                : 'bg-white border-gray-200 hover:border-green-500 hover:shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-green-900/30 group-hover:bg-green-900/50' 
                    : 'bg-green-100 group-hover:bg-green-200'
                }`}>
                  <Download className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <div className="text-left">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add Funds</h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Deposit money to your wallet</p>
                </div>
              </div>
              <ArrowUpRight className={`w-5 h-5 transition-colors ${
                isDarkMode 
                  ? 'text-gray-500 group-hover:text-green-400' 
                  : 'text-gray-400 group-hover:text-green-600'
              }`} />
            </div>
          </button>

          <button
            onClick={handleWithdraw}
            className={`rounded-xl p-6 border transition-all group ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10' 
                : 'bg-white border-gray-200 hover:border-blue-500 hover:shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-blue-900/30 group-hover:bg-blue-900/50' 
                    : 'bg-blue-100 group-hover:bg-blue-200'
                }`}>
                  <Upload className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div className="text-left">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Withdraw Funds</h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Transfer money to your account</p>
                </div>
              </div>
              <ArrowUpRight className={`w-5 h-5 transition-colors ${
                isDarkMode 
                  ? 'text-gray-500 group-hover:text-blue-400' 
                  : 'text-gray-400 group-hover:text-blue-600'
              }`} />
            </div>
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className={`rounded-lg p-4 border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Earnings</span>
              <TrendingUp className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(stats.totalEarnings)}
            </p>
          </div>
          
          <div className={`rounded-lg p-4 border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Available</span>
              <Wallet className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(stats.availableBalance)}
            </p>
          </div>
          
          <div className={`rounded-lg p-4 border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending</span>
              <Clock className={`w-4 h-4 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
            </div>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(stats.pendingBalance)}
            </p>
          </div>
          
          <div className={`rounded-lg p-4 border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Withdrawn</span>
              <TrendingDown className={`w-4 h-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
            </div>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(stats.totalWithdrawn)}
            </p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className={`rounded-xl border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className={`p-6 border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Recent Transactions
              </h3>
              <button className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} text-sm font-medium`}>
                View All
              </button>
            </div>
          </div>
          
          <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {transactions.length === 0 ? (
              <div className="p-8 text-center">
                <History className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>No transactions yet</p>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Your transaction history will appear here
                </p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className={`p-6 transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {transaction.description}
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {transaction.payment_method && `via ${transaction.payment_method} • `}
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'deposit' || transaction.type === 'order_payment' 
                          ? isDarkMode ? 'text-green-400' : 'text-green-600'
                          : isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`}>
                        {transaction.type === 'deposit' || transaction.type === 'order_payment' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        getStatusColor(transaction.status)
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className={`mt-8 rounded-xl p-6 border ${
          isDarkMode ? 'bg-blue-900/20 border-blue-800/50' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start space-x-3">
            <AlertCircle className={`w-5 h-5 mt-0.5 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <div>
              <h4 className={`font-semibold mb-2 ${
                isDarkMode ? 'text-blue-300' : 'text-blue-900'
              }`}>How Your Wallet Works</h4>
              <ul className={`text-sm space-y-1 ${
                isDarkMode ? 'text-blue-200/80' : 'text-blue-800'
              }`}>
                <li>• Your available balance is automatically used when customers purchase from your store</li>
                <li>• Pending balance includes earnings from orders that are still processing</li>
                <li>• You can add funds via PayPal, credit card, or cryptocurrency</li>
                <li>• Withdrawals are processed within 24-48 hours</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}