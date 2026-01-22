import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { partnerService } from '../../lib/supabase/partner-service';
import { walletService } from '../../lib/supabase/wallet-service';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  CreditCard,
  Wallet,
  Banknote,
  Coins,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock
} from 'lucide-react';

export default function DashboardEarnings() {
  const { userProfile } = useAuth();
  const [earnings, setEarnings] = useState({
    thisMonth: 0,
    lastMonth: 0,
    thisYear: 0,
    allTime: 0,
    availableBalance: 0,
    pendingBalance: 0
  });
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawalData, setWithdrawalData] = useState({
    amount: 0,
    method: 'bank_transfer' as 'bank_transfer' | 'paypal' | 'cryptocurrency',
  });

  // Check for dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const htmlElement = document.documentElement;
    setIsDarkMode(htmlElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    loadEarnings();
  }, [userProfile]);

  const loadEarnings = async () => {
    if (!userProfile?.id) return;
    
    setLoading(true);
    setError(null);
    try {
      // Use getPartnerStats instead of getEarningsSummary
      const { data: stats } = await partnerService.getPartnerStats(userProfile.id);
      
      // Get wallet balance
      const { data: wallet } = await walletService.getBalance(userProfile.id);
      
      // Calculate earnings based on stats
      // Note: You might need to adjust these calculations based on your actual data
      const allTimeEarnings = stats?.totalRevenue || 0;
      const availableBalance = wallet?.balance || 0;
      
      // For now, using simple calculations - you should implement proper time-based queries
      setEarnings({
        thisMonth: allTimeEarnings * 0.3, // Example: 30% of all-time in current month
        lastMonth: allTimeEarnings * 0.2, // Example: 20% in previous month
        thisYear: allTimeEarnings * 0.8,  // Example: 80% in current year
        allTime: allTimeEarnings,
        availableBalance: availableBalance,
        pendingBalance: stats?.pendingBalance || 0
      });

      // Get wallet transactions instead of withdrawals
      try {
        const { data: transactions } = await walletService.getTransactions(userProfile.id);
        // Filter for withdrawal transactions
        const withdrawalTransactions = transactions?.filter(t => t.type === 'withdrawal') || [];
        setWithdrawals(withdrawalTransactions);
      } catch (err) {
        console.warn('Transactions not available:', err);
        setWithdrawals([]);
      }
    } catch (err) {
      console.error('Failed to load earnings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestWithdrawal = async () => {
    if (!userProfile?.id) return;

    if (withdrawalData.amount <= 0) {
      setError('Withdrawal amount must be greater than 0');
      return;
    }

    if (withdrawalData.amount > earnings.availableBalance) {
      setError('Insufficient balance');
      return;
    }

    try {
      // Use walletService.withdrawFunds
      const { error } = await walletService.withdrawFunds(
        userProfile.id,
        withdrawalData.amount,
        withdrawalData.method,
        `Withdrawal via ${withdrawalData.method}`
      );
      
      if (error) throw error;

      // Add to local state
      setWithdrawals([
        {
          id: Date.now(),
          amount: withdrawalData.amount,
          payment_method: withdrawalData.method,
          status: 'completed',
          created_at: new Date().toISOString(),
        },
        ...withdrawals,
      ]);

      // Update earnings (deduct from available balance)
      setEarnings(prev => ({
        ...prev,
        availableBalance: prev.availableBalance - withdrawalData.amount
      }));

      setShowWithdrawalForm(false);
      setWithdrawalData({
        amount: 0,
        method: 'bank_transfer',
      });
      
      setError(null);
    } catch (err) {
      console.error('Failed to request withdrawal:', err);
      setError(err instanceof Error ? err.message : 'Failed to request withdrawal');
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'bank_transfer': return 'Bank Transfer';
      case 'paypal': return 'PayPal';
      case 'cryptocurrency': return 'Cryptocurrency';
      default: return method;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer': return <Banknote className="w-4 h-4" />;
      case 'paypal': return <CreditCard className="w-4 h-4" />;
      case 'cryptocurrency': return <Coins className="w-4 h-4" />;
      default: return <Wallet className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    if (isDarkMode) {
      switch (status) {
        case 'completed':
          return 'text-green-400 bg-green-900/30 border-green-700/50';
        case 'pending':
          return 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50';
        case 'failed':
          return 'text-red-400 bg-red-900/30 border-red-700/50';
        default:
          return 'text-gray-400 bg-gray-900/30 border-gray-700/50';
      }
    } else {
      switch (status) {
        case 'completed':
          return 'text-green-800 bg-green-100 border-green-200';
        case 'pending':
          return 'text-yellow-800 bg-yellow-100 border-yellow-200';
        case 'failed':
          return 'text-red-800 bg-red-100 border-red-200';
        default:
          return 'text-gray-800 bg-gray-100 border-gray-200';
      }
    }
  };

  return (
    <div className={`rounded-lg shadow-lg p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
      <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Your Earnings</h2>

      {error && (
        <div className={`mb-4 p-4 rounded-lg border ${
          isDarkMode ? 'bg-red-900/20 border-red-800/50 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Earnings Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* This Month */}
            <div className={`rounded-xl p-6 border-2 transition-all hover:shadow-lg ${
              isDarkMode 
                ? 'bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-700/30' 
                : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${
                  isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                }`}>
                  <Calendar className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <TrendingUp className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <p className={`text-sm mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>This Month</p>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                ${earnings.thisMonth.toFixed(2)}
              </p>
            </div>

            {/* Last Month */}
            <div className={`rounded-xl p-6 border-2 transition-all hover:shadow-lg ${
              isDarkMode 
                ? 'bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-700/30' 
                : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${
                  isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
                }`}>
                  <Clock className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <TrendingDown className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <p className={`text-sm mb-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>Last Month</p>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                ${earnings.lastMonth.toFixed(2)}
              </p>
            </div>

            {/* This Year */}
            <div className={`rounded-xl p-6 border-2 transition-all hover:shadow-lg ${
              isDarkMode 
                ? 'bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-700/30' 
                : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${
                  isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
                }`}>
                  <Calendar className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <TrendingUp className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <p className={`text-sm mb-2 ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>This Year</p>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                ${earnings.thisYear.toFixed(2)}
              </p>
            </div>

            {/* All Time */}
            <div className={`rounded-xl p-6 border-2 transition-all hover:shadow-lg ${
              isDarkMode 
                ? 'bg-gradient-to-br from-orange-900/20 to-orange-800/10 border-orange-700/30' 
                : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${
                  isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100'
                }`}>
                  <TrendingUp className={`w-5 h-5 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                </div>
                <TrendingUp className={`w-4 h-4 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
              </div>
              <p className={`text-sm mb-2 ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>All Time</p>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                ${earnings.allTime.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Withdrawals Section */}
          <div className={`mb-8 p-6 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Withdrawal Requests
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Manage your earnings withdrawal requests
                </p>
              </div>
              <button
                onClick={() => setShowWithdrawalForm(!showWithdrawalForm)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-green-700 hover:bg-green-600 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                Request Withdrawal
              </button>
            </div>

            {/* Withdrawal Form */}
            {showWithdrawalForm && (
              <div className={`mb-6 p-6 rounded-xl border ${
                isDarkMode 
                  ? 'bg-green-900/20 border-green-800/50' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <h4 className={`font-semibold mb-4 ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
                  Request a Withdrawal
                </h4>
                <div className="space-y-4 mb-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      value={withdrawalData.amount}
                      onChange={(e) => setWithdrawalData({ ...withdrawalData, amount: parseFloat(e.target.value) })}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-green-500 focus:ring-green-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-500'
                      }`}
                      placeholder="0.00"
                      step="0.01"
                      max={earnings.availableBalance}
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                        Available: ${earnings.availableBalance.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setWithdrawalData({ ...withdrawalData, amount: earnings.availableBalance })}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        Use Max
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Withdrawal Method
                    </label>
                    <select
                      value={withdrawalData.method}
                      onChange={(e) => setWithdrawalData({ 
                        ...withdrawalData, 
                        method: e.target.value as any 
                      })}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-green-500 focus:ring-green-500'
                      }`}
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="paypal">PayPal</option>
                      <option value="cryptocurrency">Cryptocurrency</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleRequestWithdrawal}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isDarkMode 
                        ? 'bg-green-700 hover:bg-green-600 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    Submit Request
                  </button>
                  <button
                    onClick={() => setShowWithdrawalForm(false)}
                    className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300' 
                        : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Withdrawals Table */}
            {withdrawals.length === 0 ? (
              <div className={`text-center py-8 rounded-lg ${
                isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'
              }`}>
                <div className={`p-3 rounded-full w-12 h-12 mx-auto mb-4 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <Wallet className={`w-6 h-6 mx-auto ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                </div>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  No withdrawal requests yet
                </p>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Submit your first withdrawal request to get started
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-full">
                  <thead className={`border-b ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-sm font-semibold ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Date
                      </th>
                      <th className={`px-6 py-3 text-left text-sm font-semibold ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Amount
                      </th>
                      <th className={`px-6 py-3 text-left text-sm font-semibold ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Method
                      </th>
                      <th className={`px-6 py-3 text-left text-sm font-semibold ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${
                    isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                  }`}>
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className={`transition-colors ${
                        isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                      }`}>
                        <td className={`px-6 py-4 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {new Date(withdrawal.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className={`px-6 py-4 font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          ${withdrawal.amount?.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded ${
                              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {getMethodIcon(withdrawal.payment_method)}
                            </div>
                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                              {getMethodLabel(withdrawal.payment_method)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(withdrawal.status)}`}>
                            {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}