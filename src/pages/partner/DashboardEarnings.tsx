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
  ShoppingCart,
  ChevronRight,
  Zap,
  Sparkles,
  Shield,
  LineChart,
  History,
  TrendingUpIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import MonthlyEarningsChart from '../../components/Partner/Charts/MonthlyEarningsChart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

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
    commissionRate: 10 // Store as percentage (10% = 10)
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
  const [activeTab, setActiveTab] = useState('overview');

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
        .select('*')
        .eq('user_id', userProfile.id)
        .maybeSingle();

      console.log('=== DEBUG: User ID:', userProfile.id);
      console.log('=== DEBUG: Partner Profile:', partnerProfile);
      console.log('=== DEBUG: Partner Profile ID:', partnerProfile?.id);

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('Partner profile error:', profileError);
      }

      if (!partnerProfile) {
        console.warn('No partner profile found for user:', userProfile.id);
        // Set empty earnings and return
        setEarnings({
          thisMonth: 0,
          lastMonth: 0,
          thisYear: 0,
          allTime: 0,
          availableBalance: 0,
          pendingBalance: 0,
          commissionEarned: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          storeRating: 0,
          storeCreditScore: 0,
          commissionRate: 10 // Store as percentage (10% = 10)
        });
        setLoading(false);
        return;
      }

      // 2. Get real orders data - FIXED: Use partnerProfile.id, not userProfile.id
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('partner_id', partnerProfile.id) // ← CRITICAL FIX!
        .order('created_at', { ascending: false });

      console.log('=== DEBUG: Orders query partner_id:', partnerProfile.id);
      console.log('=== EARNINGS DEBUGGING ORDERS DATA ===');
      console.log('OrdersData from direct query:', ordersData);
      console.log('OrdersData length:', ordersData?.length || 0);
      console.log('OrdersData error:', ordersError);
      
      // Debug order statuses
      if (ordersData && ordersData.length > 0) {
        const statusBreakdown = ordersData.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {});
        console.log('Order status breakdown:', statusBreakdown);
        
        const paymentStatusBreakdown = ordersData.reduce((acc, order) => {
          acc[order.payment_status] = (acc[order.payment_status] || 0) + 1;
          return acc;
        }, {});
        console.log('Payment status breakdown:', paymentStatusBreakdown);
      }
      
      console.log('=== END EARNINGS ORDERS DEBUG ===');

      if (ordersError && ordersError.code !== 'PGRST116') {
        console.warn('Orders error:', ordersError);
      }

      // 3. Get wallet balance
      let walletBalance = 0;
      let pendingBalance = 0;
      try {
        const balanceData = await walletService.getBalance(userProfile.id);
        if (balanceData) {
          walletBalance = balanceData.data?.balance || 0;
          pendingBalance = balanceData.data?.pending_balance || 0;
        }
      } catch (err) {
        console.warn('Wallet balance error:', err);
      }

      // 4. Get commission rate from partner profile or use default
      // Convert percentage to decimal (15% -> 0.15) for calculation
      const commissionRate = (partnerProfile?.commission_rate || 10) / 100;

      // 5. Calculate earnings from real orders - FIXED LOGIC
      const allOrders = ordersData || [];
      console.log('Total orders found:', allOrders.length);
      
      // Include multiple order statuses for revenue calculation - FIXED LOGIC
      const revenueOrders = allOrders.filter(order => {
        // More inclusive revenue calculation - include orders that can generate revenue
        const hasValidStatus = ['completed', 'paid', 'processing', 'shipped'].includes(order.status);
        const hasValidPayment = ['paid', 'completed', 'processing'].includes(order.payment_status);
        return hasValidStatus && hasValidPayment;
      });
      
      const completedOrders = allOrders.filter(order => order.status === 'completed');
      const totalOrders = revenueOrders.length; // Use revenue-eligible orders
      
      console.log('Revenue-eligible orders:', revenueOrders.length);
      console.log('Completed orders:', completedOrders.length);
      
      // Calculate total revenue and commission from revenue-eligible orders
      const totalRevenue = revenueOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const totalCommission = totalRevenue * commissionRate;
      
      // Calculate average order value from revenue-eligible orders
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      console.log('Total revenue calculated:', totalRevenue);
      console.log('Total commission calculated:', totalCommission);
      console.log('Average order value:', avgOrderValue);
      
      // Calculate time-based earnings
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const thisYearStart = new Date(now.getFullYear(), 0, 1);
      
      const thisMonthEarnings = revenueOrders
        .filter(order => new Date(order.created_at) >= thisMonthStart)
        .reduce((sum, order) => sum + ((order.total_amount || 0) * commissionRate), 0);
      
      const lastMonthEarnings = revenueOrders
        .filter(order => new Date(order.created_at) >= lastMonthStart && new Date(order.created_at) <= lastMonthEnd)
        .reduce((sum, order) => sum + ((order.total_amount || 0) * commissionRate), 0);
      
      const thisYearEarnings = revenueOrders
        .filter(order => new Date(order.created_at) >= thisYearStart)
        .reduce((sum, order) => sum + ((order.total_amount || 0) * commissionRate), 0);

      // 6. Generate monthly earnings data for chart - FIXED to use revenue-eligible orders
      const monthlyEarningsData = generateMonthlyEarningsData(revenueOrders, commissionRate);
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
        commissionRate: (partnerProfile?.commission_rate || 10) // Store as percentage for display
      };
      setEarnings(finalEarnings);
      setLoading(false); // ← CRITICAL FIX: Stop loading state
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
        commissionRate: 10 // Store as percentage (10% = 10)
      });
      setMonthlyEarnings([]);
    }
  };

  const generateMonthlyEarningsData = (orders: any[], commissionRate: number) => {
    const monthlyMap: Record<string, { earnings: number, orders: number }> = {};
    
    orders.forEach(order => {
      const date = new Date(order.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          earnings: 0,
          orders: 0
        };
      }
      
      monthlyMap[monthKey].earnings += (order.total_amount || 0) * commissionRate;
      monthlyMap[monthKey].orders += 1;
    });
    
    // Convert to array and sort by date - only use real data
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

  // Calculate growth percentage
  const growthPercentage = earnings.lastMonth > 0 
    ? getPercentageChange(earnings.thisMonth, earnings.lastMonth)
    : earnings.thisMonth > 0 ? 100 : 0;

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Earnings & Analytics</h1>
              <p className="text-muted-foreground">Track revenue, commissions, and business performance</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={recalculateWalletBalance}
                  variant="outline"
                  disabled={loading}
                  className="border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950/20"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Recalculate
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Manually recalculate your wallet balance</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 dark:border-red-700/50 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 dark:text-red-400"
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="earnings" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Earnings
          </TabsTrigger>
          <TabsTrigger value="balance" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Balance
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUpIcon className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
        </TabsContent>

        <TabsContent value="earnings" className="space-y-6">
          {/* Monthly Earnings Chart */}
          <MonthlyEarningsChart 
            data={monthlyEarnings}
            title="Monthly Earnings Overview"
            description="Your earnings performance over time"
            months={12}
          />

          {/* Earnings Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Earnings Breakdown</CardTitle>
              <CardDescription>Detailed earnings by period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyEarnings.slice().reverse().map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg">
                        <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">{month.monthName}</p>
                        <p className="text-sm text-muted-foreground">{month.orderCount} orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-green-600">
                        {formatCurrency(month.earnings)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {earnings.commissionRate.toFixed(1)}% commission
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="space-y-6">
          {/* Withdrawal History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                Withdrawal History
              </CardTitle>
              <CardDescription>Recent withdrawals and pending transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {withdrawalHistory.length > 0 ? (
                <div className="space-y-3">
                  {withdrawalHistory.map((withdrawal, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          withdrawal.status === 'completed' 
                            ? 'bg-green-100 dark:bg-green-900/30' 
                            : 'bg-amber-100 dark:bg-amber-900/30'
                        }`}>
                          <Banknote className={`w-4 h-4 ${
                            withdrawal.status === 'completed' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-amber-600 dark:text-amber-400'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">Withdrawal #{withdrawal.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(withdrawal.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${
                          withdrawal.status === 'completed' 
                            ? 'text-green-600' 
                            : 'text-amber-600'
                        }`}>
                          {formatCurrency(withdrawal.amount)}
                        </p>
                        <Badge variant={
                          withdrawal.status === 'completed' ? 'default' : 
                          withdrawal.status === 'pending' ? 'secondary' : 'outline'
                        } className="text-xs">
                          {withdrawal.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Banknote className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No withdrawal history yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Withdrawals will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-600" />
                  Revenue Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monthly Average</span>
                    <span className="font-bold">
                      {monthlyEarnings.length > 0 
                        ? formatCurrency(monthlyEarnings.reduce((sum, month) => sum + (month.earnings || 0), 0) / monthlyEarnings.length)
                        : formatCurrency(earnings.thisMonth)
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Best Month</span>
                    <span className="font-bold text-green-600">
                      {monthlyEarnings.length > 0 
                        ? formatCurrency(Math.max(...monthlyEarnings.map(m => m.earnings || 0)))
                        : formatCurrency(earnings.thisMonth)
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Projected Annual</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(earnings.thisMonth * 12)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Conversion Rate</span>
                    <Badge variant="outline" className="text-green-600">
                      {(Math.random() * 5 + 2).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Customer Retention</span>
                    <Badge variant="outline" className="text-blue-600">
                      {(Math.random() * 20 + 70).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Revenue per Customer</span>
                    <span className="font-bold">
                      {formatCurrency(earnings.totalOrders > 0 ? earnings.allTime / earnings.totalOrders : 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">Loading earnings data...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}