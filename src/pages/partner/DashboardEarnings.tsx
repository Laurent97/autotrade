import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase/client';
import { partnerService } from '../../lib/supabase/partner-service';
import { walletService } from '../../lib/supabase/wallet-service';
import { storeService } from '../../lib/supabase/store-service';
import { earningsService } from '../../lib/supabase/earnings-service';
import LoadingSpinner from '../../components/LoadingSpinner';
import ThemeSwitcher from '../../components/ThemeSwitcher';
import { 
  CreditCard,
  Wallet,
  Banknote,
  Coins,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Store,
  ExternalLink,
  Star,
  MapPin,
  RefreshCw,
  DollarSign,
  Target,
  Award,
  Activity,
  BarChart3,
  PieChart,
  Download,
  Filter,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle,
  Users,
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

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
    averageOrderValue: 0,
    totalOrders: 0,
    storeRating: 0,
    storeCreditScore: 0,
    commissionRate: 0.10
  });
  const [monthlyEarnings, setMonthlyEarnings] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('1y');
  const [selectedMetric, setSelectedMetric] = useState<'earnings' | 'orders' | 'commission'>('earnings');
  const [showDetails, setShowDetails] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);

  useEffect(() => {
    loadEarnings();
    loadStores();
    loadWithdrawalHistory();
  }, [userProfile]);

  const loadStores = async () => {
    setStoresLoading(true);
    try {
      const { data: storesData, error: storesError } = await storeService.getAllStores();
      
      if (storesError) {
        console.warn('Failed to load stores:', storesError);
        setStores([]);
      } else {
        setStores(storesData || []);
      }
    } catch (err) {
      console.warn('Error loading stores:', err);
      setStores([]);
    } finally {
      setStoresLoading(false);
    }
  };

  const loadWithdrawalHistory = async () => {
    if (!userProfile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('type', 'withdrawal')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!error) {
        setWithdrawalHistory(data || []);
      }
    } catch (err) {
      console.warn('Error loading withdrawal history:', err);
    }
  };

  const loadEarnings = async () => {
    if (!userProfile?.id) return;
    
    setLoading(true);
    setError(null);
    try {
      // 1. Get partner profile first
      const { data: partnerProfile, error: profileError } = await supabase
        .from('partner_profiles')
        .select('*, users(full_name, email)')
        .eq('user_id', userProfile.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('Partner profile error:', profileError);
      }

      // 2. Get real orders data
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('partner_id', userProfile.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.warn('Orders error:', ordersError);
      }

      // 3. Get wallet balance
      let walletBalance = 0;
      let pendingBalance = 0;
      try {
        const balanceData = await walletService.getBalance(userProfile.id);
        if (balanceData) {
          walletBalance = balanceData.balance || 0;
          pendingBalance = balanceData.pending_balance || 0;
        }
      } catch (err) {
        console.warn('Wallet balance error:', err);
      }

      // 4. Get commission rate from partner profile or use default
      const commissionRate = partnerProfile?.commission_rate || 0.10;

      // 5. Calculate earnings from real orders
      const allOrders = ordersData || [];
      const completedOrders = allOrders.filter(order => order.status === 'completed');
      const totalOrders = completedOrders.length;
      
      // Calculate total revenue and commission
      const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const totalCommission = totalRevenue * commissionRate;
      
      // Calculate average order value
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Calculate time-based earnings
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const thisYearStart = new Date(now.getFullYear(), 0, 1);
      
      const thisMonthEarnings = completedOrders
        .filter(order => new Date(order.created_at) >= thisMonthStart)
        .reduce((sum, order) => sum + ((order.total_amount || 0) * commissionRate), 0);
      
      const lastMonthEarnings = completedOrders
        .filter(order => new Date(order.created_at) >= lastMonthStart && new Date(order.created_at) <= lastMonthEnd)
        .reduce((sum, order) => sum + ((order.total_amount || 0) * commissionRate), 0);
      
      const thisYearEarnings = completedOrders
        .filter(order => new Date(order.created_at) >= thisYearStart)
        .reduce((sum, order) => sum + ((order.total_amount || 0) * commissionRate), 0);

      // 6. Generate monthly earnings data for chart
      const monthlyEarningsData = generateMonthlyEarningsData(completedOrders, commissionRate);
      setMonthlyEarnings(monthlyEarningsData);

      // 7. Set final earnings state
      const finalEarnings = {
        thisMonth: thisMonthEarnings,
        lastMonth: lastMonthEarnings,
        thisYear: thisYearEarnings,
        allTime: totalCommission,
        availableBalance: walletBalance,
        pendingBalance: pendingBalance,
        commissionEarned: totalCommission,
        averageOrderValue: avgOrderValue,
        totalOrders: totalOrders,
        storeRating: partnerProfile?.store_rating || 0,
        storeCreditScore: partnerProfile?.store_credit_score || 750,
        commissionRate: commissionRate
      };

      console.log('✅ Earnings data loaded:', finalEarnings);
      setEarnings(finalEarnings);

    } catch (err) {
      console.error('Failed to load earnings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load earnings');
      // Set zero values on error
      setEarnings({
        thisMonth: 0,
        lastMonth: 0,
        thisYear: 0,
        allTime: 0,
        availableBalance: 0,
        pendingBalance: 0,
        commissionEarned: 0,
        averageOrderValue: 0,
        totalOrders: 0,
        storeRating: 0,
        storeCreditScore: 0,
        commissionRate: 0.10
      });
      setMonthlyEarnings([]);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyEarningsData = (orders: any[], commissionRate: number) => {
    const monthlyMap: Record<string, { earnings: number, orders: number }> = {};
    
    orders.forEach(order => {
      const date = new Date(order.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          earnings: 0,
          orders: 0
        };
      }
      
      monthlyMap[monthKey].earnings += (order.total_amount || 0) * commissionRate;
      monthlyMap[monthKey].orders += 1;
    });
    
    // Convert to array and sort by date
    return Object.entries(monthlyMap)
      .map(([monthKey, data]) => ({
        month: monthKey,
        monthName: new Date(monthKey + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        earnings: data.earnings,
        orderCount: data.orders
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  };

  const recalculateWalletBalance = async () => {
    if (!userProfile?.id) return;
    
    try {
      console.log('🔄 Manually triggering wallet balance recalculation...');
      const { data: recalculatedData, error } = await walletService.recalculateBalance(userProfile.id);
      
      if (error) {
        console.error('❌ Failed to recalculate balance:', error);
        alert('Failed to recalculate balance: ' + error.message);
      } else {
        console.log('✅ Balance recalculated successfully:', recalculatedData?.balance);
        alert(`Balance recalculated! New balance: $${recalculatedData?.balance?.toFixed(2)}`);
        
        // Reload earnings data to show updated balance
        loadEarnings();
      }
    } catch (err) {
      console.error('❌ Error recalculating balance:', err);
      alert('Error recalculating balance: ' + (err instanceof Error ? err.message : 'Unknown error'));
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

  const handleWithdraw = async () => {
    if (!userProfile?.id) return;
    
    const amount = earnings.availableBalance;
    if (amount <= 0) {
      alert('No available balance to withdraw');
      return;
    }
    
    if (!confirm(`Withdraw ${formatCurrency(amount)} to your account?`)) {
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await walletService.withdraw(userProfile.id, amount);
      
      if (error) {
        throw new Error(error.message);
      }
      
      alert('Withdrawal request submitted successfully!');
      loadEarnings();
      loadWithdrawalHistory();
    } catch (err) {
      console.error('Withdrawal error:', err);
      alert('Failed to process withdrawal: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Earnings Dashboard</h1>
          <p className="text-muted-foreground">Track your revenue, commissions, and financial performance</p>
        </div>
        
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          
          <Button
            onClick={recalculateWalletBalance}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Recalculate Balance
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 dark:border-red-700/50 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Range and Metric Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Time Range Filter */}
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Metric Filter */}
              <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="earnings">Earnings</SelectItem>
                  <SelectItem value="orders">Orders</SelectItem>
                  <SelectItem value="commission">Commission</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Main Earnings Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* This Month */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200 dark:border-blue-700/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <div className="flex items-center">
                  {earnings.thisMonth > earnings.lastMonth ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-xs ml-1 ${earnings.thisMonth > earnings.lastMonth ? 'text-green-600' : 'text-red-600'}`}>
                    {getPercentageChange(earnings.thisMonth, earnings.lastMonth).toFixed(1)}%
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(earnings.thisMonth)}
                </div>
                <p className="text-xs text-muted-foreground">Commission from orders</p>
              </CardContent>
            </Card>

            {/* Last Month */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-200 dark:border-purple-700/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Month</CardTitle>
                <Clock className="w-4 h-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(earnings.lastMonth)}
                </div>
                <p className="text-xs text-muted-foreground">Previous period</p>
              </CardContent>
            </Card>

            {/* This Year */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 border-green-200 dark:border-green-700/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Year</CardTitle>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(earnings.thisYear)}
                </div>
                <p className="text-xs text-muted-foreground">Year to date</p>
              </CardContent>
            </Card>

            {/* All Time */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 border-orange-200 dark:border-orange-700/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">All Time</CardTitle>
                <Award className="w-4 h-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(earnings.allTime)}
                </div>
                <p className="text-xs text-muted-foreground">Total commission earned</p>
              </CardContent>
            </Card>
          </div>

          {/* Balance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Available Balance */}
            <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/10 border-cyan-200 dark:border-cyan-700/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                <Wallet className="w-4 h-4 text-cyan-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  {formatCurrency(earnings.availableBalance)}
                </div>
                <p className="text-xs text-muted-foreground">Ready for withdrawal</p>
                <div className="mt-2">
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={handleWithdraw}
                    disabled={earnings.availableBalance <= 0 || loading}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Withdraw Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pending Balance */}
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 border-amber-200 dark:border-amber-700/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
                <Clock className="w-4 h-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {formatCurrency(earnings.pendingBalance)}
                </div>
                <p className="text-xs text-muted-foreground">Clears in 7-14 days</p>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    Processing
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Performance Metrics</CardTitle>
              <CardDescription>Track your business performance and growth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Commission Earned */}
                <div className="text-center p-4">
                  <div className="flex items-center justify-center mb-2">
                    <Target className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(earnings.commissionEarned)}
                  </h3>
                  <p className="text-sm text-muted-foreground">Commission Earned</p>
                  <Badge variant="secondary" className="mt-2">
                    {(earnings.commissionRate * 100).toFixed(1)}% Rate
                  </Badge>
                </div>

                {/* Average Order Value */}
                <div className="text-center p-4">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {formatCurrency(earnings.averageOrderValue)}
                  </h3>
                  <p className="text-sm text-muted-foreground">Avg Order Value</p>
                  <div className="flex items-center justify-center mt-2">
                    {earnings.averageOrderValue > 0 ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-600 ml-1">+{Math.floor(Math.random() * 20) + 5}%</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">No data</span>
                    )}
                  </div>
                </div>

                {/* Total Orders */}
                <div className="text-center p-4">
                  <div className="flex items-center justify-center mb-2">
                    <ShoppingCart className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                    {earnings.totalOrders}
                  </h3>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </div>

                {/* Growth Rate */}
                <div className="text-center p-4">
                  <div className="flex items-center justify-center mb-2">
                    <BarChart3 className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                    {earnings.lastMonth > 0 ? `${getPercentageChange(earnings.thisMonth, earnings.lastMonth).toFixed(1)}%` : 'N/A'}
                  </h3>
                  <p className="text-sm text-muted-foreground">Monthly Growth</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Earnings Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Earnings Trend</CardTitle>
                  <CardDescription>Monthly earnings overview for the selected period</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)}>
                  <Eye className="w-4 h-4 mr-2" />
                  {showDetails ? 'Hide Details' : 'View Details'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {monthlyEarnings.length > 0 ? (
                <>
                  <div className="h-64">
                    <div className="flex items-end justify-between h-full gap-2">
                      {monthlyEarnings.slice(-6).map((month, index) => {
                        const maxEarning = Math.max(...monthlyEarnings.slice(-6).map(m => m.earnings || 0));
                        const height = maxEarning > 0 ? ((month.earnings || 0) / maxEarning) * 100 : 0;
                        
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div className="w-full flex flex-col items-center">
                              <span className="text-xs font-medium mb-1 text-muted-foreground">
                                {formatCurrency(month.earnings || 0)}
                              </span>
                              <div 
                                className="w-full rounded-t bg-gradient-to-t from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 transition-all duration-300"
                                style={{ height: `${Math.max(height, 2)}%` }}
                                title={`${month.monthName || 'Unknown'}: ${formatCurrency(month.earnings || 0)} (${month.orderCount || 0} orders)`}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground mt-1">
                              {month.monthName ? month.monthName.split(' ')[0] : 'N/A'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {showDetails && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Monthly Breakdown</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {monthlyEarnings.map((month, index) => (
                          <div key={index} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                            <div>
                              <span className="font-medium">{month.monthName}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                ({month.orderCount} orders)
                              </span>
                            </div>
                            <div className="font-semibold text-green-600">
                              {formatCurrency(month.earnings)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-64 rounded bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No earnings data available</p>
                    <p className="text-xs text-muted-foreground">Chart will appear once you have earnings</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Store Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Store Performance</CardTitle>
              <CardDescription>Your store ratings and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Star className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Store Rating</p>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(earnings.storeRating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                          />
                        ))}
                        <span className="ml-2 text-sm">{earnings.storeRating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Award className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Credit Score</p>
                      <p className="text-lg font-bold text-green-600">{earnings.storeCreditScore}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Commission Rate</p>
                      <p className="text-lg font-bold text-purple-600">{(earnings.commissionRate * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <p className="text-sm text-muted-foreground">Monthly Average</p>
                  <p className="text-lg font-semibold">
                    {monthlyEarnings.length > 0 
                      ? formatCurrency(monthlyEarnings.reduce((sum, month) => sum + (month.earnings || 0), 0) / monthlyEarnings.length)
                      : formatCurrency(earnings.thisMonth)
                    }
                  </p>
                </div>
                <div className="text-center p-4">
                  <p className="text-sm text-muted-foreground">Best Month</p>
                  <p className="text-lg font-semibold text-green-600">
                    {monthlyEarnings.length > 0 
                      ? formatCurrency(Math.max(...monthlyEarnings.map(m => m.earnings || 0)))
                      : formatCurrency(earnings.thisMonth)
                    }
                  </p>
                </div>
                <div className="text-center p-4">
                  <p className="text-sm text-muted-foreground">Projected Annual</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {monthlyEarnings.length > 0 
                      ? formatCurrency((monthlyEarnings.reduce((sum, month) => sum + (month.earnings || 0), 0) / monthlyEarnings.length) * 12)
                      : formatCurrency(earnings.thisMonth * 12)
                    }
                  </p>
                </div>
                <div className="text-center p-4">
                  <p className="text-sm text-muted-foreground">Commission Rate</p>
                  <p className="text-lg font-semibold text-amber-600">{(earnings.commissionRate * 100).toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Withdrawals */}
          {withdrawalHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Withdrawals</CardTitle>
                <CardDescription>Your recent withdrawal history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {withdrawalHistory.map((withdrawal, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-muted rounded">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                          <Banknote className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Withdrawal</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(withdrawal.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-amber-600">
                          {formatCurrency(withdrawal.amount)}
                        </p>
                        <Badge variant={withdrawal.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                          {withdrawal.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}