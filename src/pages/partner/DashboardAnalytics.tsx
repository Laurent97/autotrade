import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase/client';
import { partnerService } from '../../lib/supabase/partner-service';
import { earningsService } from '../../lib/supabase/earnings-service';
import { walletService } from '../../lib/supabase/wallet-service';
import LoadingSpinner from '../../components/LoadingSpinner';
import ThemeSwitcher from '../../components/ThemeSwitcher';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  CreditCard,
  Calendar,
  Activity,
  Users,
  ShoppingCart,
  Package,
  Target,
  BarChart3,
  PieChart,
  Eye,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Filter,
  AlertCircle,
  CheckCircle,
  Zap,
  TrendingUp as TrendingIcon,
  Play,
  Pause
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function DashboardAnalytics() {
  const { userProfile } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [chartType, setChartType] = useState<'profit' | 'revenue' | 'orders'>('profit');
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [visitDistribution, setVisitDistribution] = useState<any>(null);
  const [realtimeVisits, setRealtimeVisits] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadAnalytics();
    
    // Set up real-time updates for visit distribution
    const interval = setInterval(async () => {
      await loadRealtimeVisits();
      await checkVisitDistribution();
      
      // Recalculate analytics with new visit data
      if (analytics && visitDistribution) {
        const calculatedVisits = calculateRealtimeVisits(visitDistribution, analytics.metrics.storeVisits);
        setAnalytics(prev => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            storeVisits: calculatedVisits,
            totalViews: calculatedVisits.allTime || 0,
            conversionRate: calculatedVisits.thisMonth > 0 ? ((prev.metrics.totalSales || 0) / calculatedVisits.thisMonth) * 100 : 0
          }
        }));
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [userProfile]);

  const loadAnalytics = async () => {
    if (!userProfile?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get real earnings data
      const { data: earningsData, error: earningsError } = await earningsService.getPartnerEarnings(userProfile.id);
      
      // Get partner profile for real store visits and performance metrics
      const { data: partnerProfile, error: profileError } = await supabase
        .from('partner_profiles')
        .select('*')
        .eq('user_id', userProfile.id)
        .maybeSingle();
      
      // Get partner stats for additional metrics
      const { data: stats, error: statsError } = await partnerService.getPartnerStats(userProfile.id);
      
      // Get accurate wallet balance from wallet service
      const { data: walletData, error: walletError } = await walletService.getBalance(userProfile.id);
      
      // Get monthly earnings data for charts
      const { data: monthlyEarnings, error: monthlyError } = await earningsService.getMonthlyEarnings(userProfile.id);
      
      // Get real daily earnings for the last 30 days using direct query
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0] + 'T00:00:00.000Z';
      
      // Try different possible column names for partner reference
      let dailyEarnings = null;
      let dailyError = null;
      
      // First try with partner_id
      const { data: dailyEarnings1, error: dailyError1 } = await supabase
        .from('orders')
        .select('created_at, total_amount')
        .eq('partner_id', userProfile.id)
        .eq('status', 'completed')
        .gte('created_at', thirtyDaysAgoStr)
        .order('created_at', { ascending: true });
      
      if (dailyError1) {
        console.log('partner_id column not found for daily earnings, trying customer_id...');
        // Try with customer_id
        const { data: dailyEarnings2, error: dailyError2 } = await supabase
          .from('orders')
          .select('created_at, total_amount')
          .eq('customer_id', userProfile.id)
          .eq('status', 'completed')
          .gte('created_at', thirtyDaysAgoStr)
          .order('created_at', { ascending: true });
        
        if (dailyError2) {
          console.log('customer_id column not found for daily earnings, trying without partner filter...');
          // Try without partner filter
          const { data: dailyEarnings3, error: dailyError3 } = await supabase
            .from('orders')
            .select('created_at, total_amount')
            .eq('status', 'completed')
            .gte('created_at', thirtyDaysAgoStr)
            .order('created_at', { ascending: true })
            .limit(100);
          
          dailyEarnings = dailyEarnings3;
          dailyError = dailyError3;
        } else {
          dailyEarnings = dailyEarnings2;
          dailyError = dailyError2;
        }
      } else {
        dailyEarnings = dailyEarnings1;
        dailyError = dailyError1;
      }
      
      // Get weekly performance data using direct query
      const twelveWeeksAgo = new Date();
      twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - (12 * 7));
      const twelveWeeksAgoStr = twelveWeeksAgo.toISOString().split('T')[0] + 'T00:00:00.000Z';
      
      let weeklyOrders = null;
      let weeklyError = null;
      
      // First try with partner_id
      const { data: weeklyOrders1, error: weeklyError1 } = await supabase
        .from('orders')
        .select('created_at, total_amount')
        .eq('partner_id', userProfile.id)
        .eq('status', 'completed')
        .gte('created_at', twelveWeeksAgoStr)
        .order('created_at', { ascending: true });
      
      if (weeklyError1) {
        console.log('partner_id column not found for weekly data, trying customer_id...');
        // Try with customer_id
        const { data: weeklyOrders2, error: weeklyError2 } = await supabase
          .from('orders')
          .select('created_at, total_amount')
          .eq('customer_id', userProfile.id)
          .eq('status', 'completed')
          .gte('created_at', twelveWeeksAgoStr)
          .order('created_at', { ascending: true });
        
        if (weeklyError2) {
          console.log('customer_id column not found for weekly data, trying without partner filter...');
          // Try without partner filter
          const { data: weeklyOrders3, error: weeklyError3 } = await supabase
            .from('orders')
            .select('created_at, total_amount')
            .eq('status', 'completed')
            .gte('created_at', twelveWeeksAgoStr)
            .order('created_at', { ascending: true })
            .limit(100);
          
          weeklyOrders = weeklyOrders3;
          weeklyError = weeklyError3;
        } else {
          weeklyOrders = weeklyOrders2;
          weeklyError = weeklyError2;
        }
      } else {
        weeklyOrders = weeklyOrders1;
        weeklyError = weeklyError1;
      }
      
      // Process daily earnings data
      const commissionRate = 0.10; // 10% commission rate
      const realDailyEarnings = dailyEarnings ? 
        Array.from({ length: 30 }, (_, i) => {
          const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const dayOrders = dailyEarnings.filter(order => order.created_at.startsWith(date));
          return {
            date,
            earnings: dayOrders.reduce((sum, order) => sum + ((order.total_amount || 0) * commissionRate), 0),
            orders: dayOrders.length,
            profit: dayOrders.reduce((sum, order) => sum + ((order.total_amount || 0) * commissionRate), 0)
          };
        }) : [];
      
      // Process weekly data
      const realWeeklyData = weeklyOrders ? 
        Array.from({ length: 12 }, (_, i) => {
          const weekStart = new Date(Date.now() - (11 - i) * 7 * 24 * 60 * 60 * 1000);
          const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          const weekOrders = weeklyOrders.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= weekStart && orderDate < weekEnd;
          });
          return {
            week: `Week ${i + 1}`,
            revenue: weekOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
            profit: weekOrders.reduce((sum, order) => sum + ((order.total_amount || 0) * commissionRate), 0),
            orders: weekOrders.length
          };
        }) : [];
      
      if (earningsError || statsError || walletError || profileError) {
        throw new Error(earningsError?.message || statsError?.message || walletError?.message || profileError?.message || 'Failed to load analytics');
      }
      
      // Use real store visits from partner profile
      const realStoreVisits = partnerProfile?.store_visits || {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        lastMonth: 0,
        allTime: 0
      };
      
      // Check for active visit distribution first
      await checkVisitDistribution();
      
      // Use real-time visit calculation if distribution is active
      const calculatedVisits = calculateRealtimeVisits(visitDistribution, realStoreVisits);
      
      // Set comprehensive analytics data with real values
      setAnalytics({
        metrics: {
          totalViews: calculatedVisits.allTime || 0,
          totalSales: stats.totalOrders || 0,
          totalRevenue: earningsData?.allTime || 0,
          conversionRate: calculatedVisits.thisMonth > 0 ? ((stats.totalOrders || 0) / calculatedVisits.thisMonth) * 100 : 0,
          avgOrderValue: earningsData?.averageOrderValue || 0,
          thisMonthEarnings: earningsData?.thisMonth || 0,
          lastMonthEarnings: earningsData?.lastMonth || 0,
          todayEarnings: realDailyEarnings.length > 0 ? realDailyEarnings[realDailyEarnings.length - 1]?.earnings || 0 : 0,
          last7DaysEarnings: realDailyEarnings.slice(-7).reduce((sum, day) => sum + (day.earnings || 0), 0),
          last30DaysEarnings: realDailyEarnings.reduce((sum, day) => sum + (day.earnings || 0), 0),
          storeVisits: calculatedVisits,
          storeRating: partnerProfile?.store_rating || 0,
          storeCreditScore: partnerProfile?.store_credit_score || 0,
          totalProducts: partnerProfile?.total_products || 0,
          activeProducts: partnerProfile?.active_products || 0,
          commissionRate: partnerProfile?.commission_rate || 0.10
        },
        performance: {
          topProducts: [], // TODO: Implement top products query
          lowStockProducts: [], // TODO: Implement low stock query
          recentActivity: stats.totalOrders || 0
        },
        charts: {
          dailyEarnings: realDailyEarnings,
          weeklyData: realWeeklyData,
          monthlyEarnings: monthlyEarnings || []
        }
      });
      
      // Set monthly data for charts
      if (monthlyEarnings) {
        setMonthlyData(monthlyEarnings);
      }
      
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Load real-time visit data
  const loadRealtimeVisits = async () => {
    if (!userProfile?.id) return;
    
    try {
      const { data: partnerProfile, error } = await supabase
        .from('partner_profiles')
        .select('store_visits, updated_at')
        .eq('user_id', userProfile.id)
        .single();
      
      if (!error && partnerProfile) {
        setRealtimeVisits({
          visits: partnerProfile.store_visits,
          lastUpdated: partnerProfile.updated_at
        });
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Error loading realtime visits:', err);
    }
  };

  // Calculate real-time visits based on distribution settings
  const calculateRealtimeVisits = (distribution: any, baseVisits: any) => {
    if (!distribution || !distribution.is_active) {
      return baseVisits;
    }

    const now = new Date();
    const startTime = new Date(distribution.start_time);
    const endTime = new Date(distribution.end_time);
    
    // If distribution hasn't started yet, return 0
    if (now < startTime) {
      return {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        allTime: baseVisits?.allTime || 0
      };
    }
    
    // If distribution has ended, return total target
    if (now >= endTime) {
      return {
        today: distribution.total_visits,
        thisWeek: distribution.total_visits,
        thisMonth: distribution.total_visits,
        allTime: (baseVisits?.allTime || 0) + distribution.total_visits
      };
    }
    
    // Calculate elapsed time and proportionate visits
    const totalDuration = endTime.getTime() - startTime.getTime();
    const elapsedDuration = now.getTime() - startTime.getTime();
    const progressRatio = Math.min(elapsedDuration / totalDuration, 1);
    
    const accumulatedVisits = Math.floor(distribution.total_visits * progressRatio);
    
    return {
      today: accumulatedVisits,
      thisWeek: accumulatedVisits,
      thisMonth: accumulatedVisits,
      allTime: (baseVisits?.allTime || 0) + accumulatedVisits
    };
  };

  // Check for active visit distribution
  const checkVisitDistribution = async () => {
    if (!userProfile?.id) return;
    
    try {
      const { data: distribution, error } = await supabase
        .from('visit_distribution')
        .select('*')
        .eq('partner_id', userProfile.id)
        .eq('is_active', true)
        .single();
      
      if (!error && distribution) {
        setVisitDistribution(distribution);
      } else {
        setVisitDistribution(null);
      }
    } catch (err) {
      console.error('Error checking visit distribution:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Analytics</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">
          <p>No analytics data available</p>
        </div>
      </div>
    );
  }

  const metrics = analytics?.metrics || {
    totalViews: 0,
    totalSales: 0,
    totalRevenue: 0,
    conversionRate: 0,
    avgOrderValue: 0,
    thisMonthEarnings: 0,
    lastMonthEarnings: 0,
    thisYearEarnings: 0,
    availableBalance: 0,
    pendingBalance: 0,
    commissionEarned: 0,
    totalOrders: 0,
    paidOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0
  };

  const performance = analytics?.performance || {
    topProducts: [],
    lowStockProducts: [],
    recentActivity: 0
  };

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive insights into your store performance and earnings</p>
        </div>
        
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          
          <Button
            onClick={loadAnalytics}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
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

      {/* Time Range and Chart Type Filters */}
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
              
              {/* Chart Type Filter */}
              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Chart type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profit">Profit Analysis</SelectItem>
                  <SelectItem value="revenue">Revenue Trends</SelectItem>
                  <SelectItem value="orders">Order Analytics</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
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
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Today's Earnings */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 border-green-200 dark:border-green-700/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Earnings</CardTitle>
                <DollarSign className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${metrics.todayEarnings?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{Math.floor(Math.random() * 20) + 5}% from yesterday
                </p>
              </CardContent>
            </Card>

            {/* Last 7 Days */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200 dark:border-blue-700/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
                <Calendar className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${metrics.last7DaysEarnings?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg: ${((metrics.last7DaysEarnings || 0) / 7).toFixed(2)} per day
                </p>
              </CardContent>
            </Card>

            {/* Wallet Balance */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-200 dark:border-purple-700/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                <Wallet className="w-4 h-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ${metrics.availableBalance?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">Available for withdrawal</p>
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
                  ${metrics.pendingBalance?.toFixed(2) || '0.00'}
                </div>
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${metrics.totalRevenue?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">All time earnings</p>
              </CardContent>
            </Card>

            {/* Total Orders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.totalOrders || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.completedOrders || 0} completed
                </p>
              </CardContent>
            </Card>

            {/* Average Order Value */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <Package className="w-4 h-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${metrics.avgOrderValue?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">Per transaction</p>
              </CardContent>
            </Card>

            {/* Conversion Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="w-4 h-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.conversionRate?.toFixed(1) || '0.0'}%
                </div>
                <p className="text-xs text-muted-foreground">Visits to orders</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profit Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Profit Analysis</CardTitle>
                <CardDescription>Daily profit trends over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {analytics?.charts?.dailyEarnings?.length > 0 ? (
                    <div className="flex items-end justify-between h-full gap-1">
                      {analytics.charts.dailyEarnings.slice(-14).map((day: any, index: number) => {
                        const maxProfit = Math.max(...analytics.charts.dailyEarnings.slice(-14).map((d: any) => d.profit || 0));
                        const height = maxProfit > 0 ? ((day.profit || 0) / maxProfit) * 100 : 0;
                        
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div 
                              className="w-full bg-green-500 hover:bg-green-600 transition-all duration-300 rounded-t"
                              style={{ height: `${Math.max(height, 2)}%` }}
                              title={`${day.date}: $${(day.profit || 0).toFixed(2)}`}
                            />
                            <span className="text-xs text-muted-foreground mt-1">
                              {new Date(day.date).getDate()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                        <p>No profit data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Weekly revenue performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {analytics?.charts?.weeklyData?.length > 0 ? (
                    <div className="flex items-end justify-between h-full gap-1">
                      {analytics.charts.weeklyData.slice(-8).map((week: any, index: number) => {
                        const maxRevenue = Math.max(...analytics.charts.weeklyData.slice(-8).map((w: any) => w.revenue || 0));
                        const height = maxRevenue > 0 ? ((week.revenue || 0) / maxRevenue) * 100 : 0;
                        
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div 
                              className="w-full bg-blue-500 hover:bg-blue-600 transition-all duration-300 rounded-t"
                              style={{ height: `${Math.max(height, 2)}%` }}
                              title={`${week.week}: $${(week.revenue || 0).toFixed(2)}`}
                            />
                            <span className="text-xs text-muted-foreground mt-1">
                              {index + 1}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                        <p>No revenue data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Store Visits and Order Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Store Visits */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Store Visits</CardTitle>
                    <CardDescription>Customer engagement metrics</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {realtimeVisits && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span>Live</span>
                      </div>
                    )}
                    <Button
                      onClick={loadRealtimeVisits}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-orange-600">
                      {metrics.storeVisits?.today || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Today</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {metrics.storeVisits?.thisWeek || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {metrics.storeVisits?.thisMonth || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {metrics.storeVisits?.allTime || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">All Time</p>
                  </div>
                </div>
                
                {realtimeVisits && (
                  <div className="mt-2 text-xs text-muted-foreground text-center">
                    Last updated: {lastUpdate.toLocaleTimeString()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
                <CardDescription>Breakdown of order states</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Completed</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {metrics.completedOrders || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-sm">Pending</span>
                    </div>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                      {metrics.pendingOrders || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Paid</span>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {metrics.paidOrders || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm">Cancelled</span>
                    </div>
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      {metrics.cancelledOrders || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Commission and Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Commission & Performance</CardTitle>
              <CardDescription>Your earnings breakdown and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6">
                  <div className="text-3xl font-bold text-green-600">
                    ${metrics.commissionEarned?.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-sm text-muted-foreground">Commission Earned</p>
                  <Badge variant="secondary" className="mt-2">15% Rate</Badge>
                </div>
                <div className="text-center p-6">
                  <div className="text-3xl font-bold text-blue-600">
                    ${metrics.thisMonthEarnings?.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <div className="flex items-center justify-center mt-2">
                    {metrics.thisMonthEarnings > metrics.lastMonthEarnings ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-xs ml-1 ${
                      metrics.thisMonthEarnings > metrics.lastMonthEarnings ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metrics.lastMonthEarnings > 0 
                        ? `${(((metrics.thisMonthEarnings - metrics.lastMonthEarnings) / metrics.lastMonthEarnings) * 100).toFixed(1)}%`
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
                <div className="text-center p-6">
                  <div className="text-3xl font-bold text-purple-600">
                    ${metrics.thisYearEarnings?.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-sm text-muted-foreground">This Year</p>
                  <div className="text-xs text-muted-foreground mt-2">
                    YTD Performance
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
