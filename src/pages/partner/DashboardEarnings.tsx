import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { partnerService } from '../../lib/supabase/partner-service';
import { walletService } from '../../lib/supabase/wallet-service';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from 'lucide-react';

export default function DashboardEarnings() {
  const { userProfile } = useAuth();
  const [earnings, setEarnings] = useState({
    thisMonth: 0,
    lastMonth: 0,
    thisYear: 0,
    allTime: 0,
    availableBalance: 0,
    pendingBalance: 0,
    commissionEarned: 0,
    averageOrderValue: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
      // Get partner statistics
      const { data: stats } = await partnerService.getPartnerStats(userProfile.id);
      
      // Get wallet balance
      const { data: wallet } = await walletService.getBalance(userProfile.id);
      
      // Calculate earnings based on stats
      const allTimeEarnings = stats?.totalRevenue || 0;
      const availableBalance = wallet?.balance || 0;
      const pendingBalance = stats?.pendingBalance || 0;
      const commissionRate = 0.15; // 15% commission example
      const commissionEarned = allTimeEarnings * commissionRate;
      const orderCount = stats?.totalOrders || 0;
      const averageOrderValue = orderCount > 0 ? allTimeEarnings / orderCount : 0;
      
      // Set earnings data
      setEarnings({
        thisMonth: allTimeEarnings * 0.3, // Example calculation
        lastMonth: allTimeEarnings * 0.2, // Example calculation
        thisYear: allTimeEarnings * 0.8,  // Example calculation
        allTime: allTimeEarnings,
        availableBalance: availableBalance,
        pendingBalance: pendingBalance,
        commissionEarned: commissionEarned,
        averageOrderValue: averageOrderValue
      });

    } catch (err) {
      console.error('Failed to load earnings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
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
          {/* Earnings Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <div className="flex items-center">
                  {earnings.thisMonth > earnings.lastMonth ? (
                    <TrendingUp className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  ) : (
                    <TrendingDown className={`w-4 h-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                  )}
                  <span className={`text-xs ml-1 ${earnings.thisMonth > earnings.lastMonth ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`}>
                    {getPercentageChange(earnings.thisMonth, earnings.lastMonth).toFixed(1)}%
                  </span>
                </div>
              </div>
              <p className={`text-xs mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>This Month</p>
              <p className={`text-xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {formatCurrency(earnings.thisMonth)}
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
                  <Calendar className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <Clock className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <p className={`text-xs mb-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>Last Month</p>
              <p className={`text-xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                {formatCurrency(earnings.lastMonth)}
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
                <TrendingUpIcon className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <p className={`text-xs mb-2 ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>This Year</p>
              <p className={`text-xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                {formatCurrency(earnings.thisYear)}
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
                <DollarSign className={`w-4 h-4 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
              </div>
              <p className={`text-xs mb-2 ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>All Time</p>
              <p className={`text-xl font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                {formatCurrency(earnings.allTime)}
              </p>
            </div>
          </div>

          {/* Additional Earnings Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Available Balance */}
            <div className={`rounded-xl p-6 border-2 transition-all hover:shadow-lg ${
              isDarkMode 
                ? 'bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 border-cyan-700/30' 
                : 'bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${
                  isDarkMode ? 'bg-cyan-900/30' : 'bg-cyan-100'
                }`}>
                  <DollarSign className={`w-5 h-5 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                </div>
              </div>
              <p className={`text-xs mb-2 ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>Available Balance</p>
              <p className={`text-xl font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                {formatCurrency(earnings.availableBalance)}
              </p>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-cyan-400/70' : 'text-cyan-600/70'}`}>
                Ready for withdrawal
              </p>
            </div>

            {/* Pending Balance */}
            <div className={`rounded-xl p-6 border-2 transition-all hover:shadow-lg ${
              isDarkMode 
                ? 'bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-amber-700/30' 
                : 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${
                  isDarkMode ? 'bg-amber-900/30' : 'bg-amber-100'
                }`}>
                  <Clock className={`w-5 h-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                </div>
              </div>
              <p className={`text-xs mb-2 ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>Pending Balance</p>
              <p className={`text-xl font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                {formatCurrency(earnings.pendingBalance)}
              </p>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-amber-400/70' : 'text-amber-600/70'}`}>
                Clears in 7-14 days
              </p>
            </div>
          </div>

          {/* Commission & Performance Metrics */}
          <div className={`mb-8 p-6 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
            <h3 className={`text-lg font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Performance Metrics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Commission Earned */}
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Commission Earned
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'}`}>
                    15% Rate
                  </span>
                </div>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {formatCurrency(earnings.commissionEarned)}
                </p>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Based on {formatCurrency(earnings.allTime)} in total sales
                </p>
              </div>

              {/* Average Order Value */}
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Average Order Value
                  </span>
                  <TrendingUpIcon className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  {formatCurrency(earnings.averageOrderValue)}
                </p>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Per transaction average
                </p>
              </div>
            </div>

            {/* Earnings Growth Chart Placeholder */}
            <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Earnings Trend (Last 6 Months)
                </span>
                <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'}`}>
                  Growing
                </span>
              </div>
              <div className={`h-40 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} flex items-center justify-center`}>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Chart showing monthly earnings growth
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Earnings Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-white'}`}>
                <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Monthly Average</p>
                <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(earnings.allTime / 12)}
                </p>
              </div>
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-white'}`}>
                <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>YTD Growth</p>
                <p className={`text-lg font-bold ${earnings.thisYear > (earnings.allTime - earnings.thisYear) ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`}>
                  {getPercentageChange(earnings.thisYear, earnings.allTime - earnings.thisYear).toFixed(1)}%
                </p>
              </div>
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-white'}`}>
                <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Projected Annual</p>
                <p className={`text-lg font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                  {formatCurrency(earnings.thisMonth * 12)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}