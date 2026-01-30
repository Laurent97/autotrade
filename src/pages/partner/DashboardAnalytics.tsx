import { useState, useEffect, useMemo } from 'react';
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
  Star,
  Play,
  Pause,
  LineChart,
  Sparkles,
  TargetIcon,
  Award,
  ChevronRight,
  Shield,
  Coins,
  TrendingUp as TrendingIcon,
  Store
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AnalyticsData {
  partnerInfo: {
    name?: string;
    rating?: number;
    creditScore?: number;
  };
  metrics: {
    totalViews: number;
    totalSales: number;
    totalRevenue: number;
    conversionRate: number;
    avgOrderValue: number;
    thisMonthEarnings: number;
    lastMonthEarnings: number;
    todayEarnings: number;
    last7DaysEarnings: number;
    last30DaysEarnings: number;
    availableBalance: number;
    pendingBalance: number;
    commissionEarned: number;
    totalOrders: number;
    paidOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    storeVisits: {
      today: number;
      thisWeek: number;
      thisMonth: number;
      allTime: number;
    };
    storeRating: number;
    storeCreditScore: number;
    totalProducts: number;
    activeProducts: number;
    commissionRate: number;
  };
  performance: {
    topProducts: any[];
    lowStockProducts: any[];
    recentActivity: number;
  };
  charts: {
    dailyEarnings: any[];
    weeklyData: any[];
    monthlyEarnings: any[];
  };
}

export default function DashboardAnalytics() {
  const { userProfile } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [chartType, setChartType] = useState<'profit' | 'revenue' | 'orders'>('profit');
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [visitDistribution, setVisitDistribution] = useState<any>(null);
  const [realtimeVisits, setRealtimeVisits] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (userProfile?.id) {
      loadAnalytics();
    }
  }, [userProfile?.id]);

  // Set up real-time updates for visit distribution
  useEffect(() => {
    if (!userProfile?.id || !analytics) return;

    const interval = setInterval(async () => {
      await loadRealtimeVisits();
      
      if (analytics && visitDistribution) {
        const calculatedVisits = calculateRealtimeVisits(visitDistribution, analytics.metrics.storeVisits);
        setAnalytics(prev => prev ? ({
          ...prev,
          metrics: {
            ...prev.metrics,
            storeVisits: calculatedVisits,
            totalViews: calculatedVisits.allTime || 0,
            conversionRate: calculatedVisits.thisMonth > 0 ? 
              ((prev.metrics.totalSales || 0) / calculatedVisits.thisMonth) * 100 : 0
          }
        }) : null);
      }
    }, 30000); // Update every 30 seconds instead of 5

    return () => clearInterval(interval);
  }, [userProfile?.id, analytics, visitDistribution]);

  const loadAnalytics = async () => {
    if (!userProfile?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('=== DEBUG: Loading analytics for user:', userProfile.id);
      
      // 1. Load partner profile first
      const { data: partnerProfile, error: profileError } = await supabase
        .from('partner_profiles')
        .select('*')
        .eq('user_id', userProfile.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('Partner profile error:', profileError);
      }

      // 2. Load wallet balance concurrently
      let walletBalance = 0;
      let pendingBalance = 0;
      const walletPromise = walletService.getBalance(userProfile.id).then(balanceData => {
        if (balanceData) {
          walletBalance = balanceData.balance || 0;
          pendingBalance = balanceData.pending_balance || 0;
        }
      }).catch(err => {
        console.warn('Wallet balance error:', err);
      });

      // 3. Load orders data
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('partner_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.warn('Orders error:', ordersError);
      }

      // 4. Load products count
      const { data: productsData, error: productsError } = await supabase
        .from('partner_products')
        .select('id, is_active')
        .eq('partner_id', userProfile.id);

      if (productsError) {
        console.warn('Products error:', productsError);
      }

      // 5. Load store visits
      const { data: visitsData, error: visitsError } = await supabase
        .from('store_visits')
        .select('id, partner_id, created_at')
        .eq('partner_id', userProfile.id);

      if (visitsError) {
        console.warn('Store visits error:', visitsError);
      }

      // 6. Wait for wallet data
      await walletPromise;

      // 7. Calculate metrics
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Calculate store visits
      const allVisits = visitsData || [];
      const todayVisits = allVisits.filter(visit => new Date(visit.created_at) >= todayStart).length;
      const weekVisits = allVisits.filter(visit => new Date(visit.created_at) >= weekStart).length;
      const monthVisits = allVisits.filter(visit => new Date(visit.created_at) >= monthStart).length;
      const totalVisits = allVisits.length;

      const storeVisits = {
        today: todayVisits,
        thisWeek: weekVisits,
        thisMonth: monthVisits,
        allTime: totalVisits
      };

      // Calculate order metrics
      const allOrders = ordersData || [];
      const revenueOrders = allOrders.filter(order => 
        ['completed', 'paid', 'processing', 'shipped'].includes(order.status) && 
        (order.payment_status === 'paid' || order.payment_status === 'completed')
      );
      
      const completedOrders = allOrders.filter(order => order.status === 'completed');
      const pendingOrders = allOrders.filter(order => order.status === 'pending');
      const cancelledOrders = allOrders.filter(order => order.status === 'cancelled');
      const paidOrders = allOrders.filter(order => order.payment_status === 'paid');

      // Calculate commission
      const commissionRate = partnerProfile?.commission_rate || 0.10;
      const totalRevenue = revenueOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const commissionEarned = totalRevenue * commissionRate;
      const avgOrderValue = revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0;

      // Calculate time-based earnings
      const todayEarnings = revenueOrders
        .filter(order => new Date(order.created_at) >= todayStart)
        .reduce((sum, order) => sum + ((order.total_amount || 0) * commissionRate), 0);

      const last7DaysEarnings = revenueOrders
        .filter(order => new Date(order.created_at) >= weekStart)
        .reduce((sum, order) => sum + ((order.total_amount || 0) * commissionRate), 0);

      const thisMonthEarnings = revenueOrders
        .filter(order => new Date(order.created_at) >= monthStart)
        .reduce((sum, order) => sum + ((order.total_amount || 0) * commissionRate), 0);

      const lastMonthEarnings = revenueOrders
        .filter(order => new Date(order.created_at) >= lastMonthStart && new Date(order.created_at) <= lastMonthEnd)
        .reduce((sum, order) => sum + ((order.total_amount || 0) * commissionRate), 0);

      // Generate chart data
      const dailyEarnings = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayOrders = revenueOrders.filter(order => 
          order.created_at.startsWith(dateStr)
        );
        
        return {
          date: dateStr,
          earnings: dayOrders.reduce((sum, order) => sum + ((order.total_amount || 0) * commissionRate), 0),
          orders: dayOrders.length,
          profit: dayOrders.reduce((sum, order) => sum + ((order.total_amount || 0) * commissionRate), 0),
          revenue: dayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
        };
      });

      const weeklyData = Array.from({ length: 12 }, (_, i) => {
        const weekStart = new Date(now.getTime() - (11 - i) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const weekOrders = revenueOrders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= weekStart && orderDate < weekEnd;
        });
        
        return {
          week: `W${i + 1}`,
          revenue: weekOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
          profit: weekOrders.reduce((sum, order) => sum + ((order.total_amount || 0) * commissionRate), 0),
          orders: weekOrders.length
        };
      });

      // Load monthly earnings
      const monthlyEarnings = await earningsService.getMonthlyEarnings(userProfile.id).catch(() => []);

      // Check visit distribution
      await checkVisitDistribution();

      // Set final analytics data
      const finalAnalytics: AnalyticsData = {
        partnerInfo: {
          name: partnerProfile?.store_name || 'Partner',
          rating: partnerProfile?.store_rating || 0,
          creditScore: partnerProfile?.store_credit_score || 750
        },
        metrics: {
          totalViews: storeVisits.allTime,
          totalSales: revenueOrders.length,
          totalRevenue: totalRevenue,
          conversionRate: storeVisits.thisMonth > 0 ? (revenueOrders.length / storeVisits.thisMonth) * 100 : 0,
          avgOrderValue: avgOrderValue,
          thisMonthEarnings: thisMonthEarnings,
          lastMonthEarnings: lastMonthEarnings,
          todayEarnings: todayEarnings,
          last7DaysEarnings: last7DaysEarnings,
          last30DaysEarnings: dailyEarnings.reduce((sum, day) => sum + day.earnings, 0),
          availableBalance: walletBalance,
          pendingBalance: pendingBalance,
          commissionEarned: commissionEarned,
          totalOrders: allOrders.length,
          paidOrders: paidOrders.length,
          pendingOrders: pendingOrders.length,
          completedOrders: completedOrders.length,
          cancelledOrders: cancelledOrders.length,
          storeVisits: storeVisits,
          storeRating: partnerProfile?.store_rating || 0,
          storeCreditScore: partnerProfile?.store_credit_score || 750,
          totalProducts: productsData?.length || 0,
          activeProducts: productsData?.filter(p => p.is_active).length || 0,
          commissionRate: commissionRate
        },
        performance: {
          topProducts: [],
          lowStockProducts: [],
          recentActivity: allOrders.length
        },
        charts: {
          dailyEarnings: dailyEarnings,
          weeklyData: weeklyData,
          monthlyEarnings: Array.isArray(monthlyEarnings) ? monthlyEarnings : []
        }
      };

      console.log('=== DEBUG: Final analytics:', finalAnalytics.metrics);
      setAnalytics(finalAnalytics);
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadRealtimeVisits = async () => {
    if (!userProfile?.id) return;
    
    try {
      const { data: partnerProfile, error } = await supabase
        .from('partner_profiles')
        .select('store_visits, updated_at')
        .eq('user_id', userProfile.id)
        .maybeSingle();
      
      if (!error && partnerProfile) {
        setRealtimeVisits({
          visits: partnerProfile.store_visits,
          lastUpdated: partnerProfile.updated_at
        });
      }
    } catch (err) {
      console.warn('Error loading realtime visits:', err);
    }
  };

  const calculateRealtimeVisits = (distribution: any, baseVisits: any) => {
    if (!distribution || !distribution.is_active) {
      return baseVisits;
    }

    const now = new Date();
    const startTime = new Date(distribution.start_time);
    const endTime = new Date(distribution.end_time);
    
    if (now < startTime) {
      return baseVisits;
    }
    
    if (now >= endTime) {
      return {
        today: distribution.total_visits || 0,
        thisWeek: distribution.total_visits || 0,
        thisMonth: distribution.total_visits || 0,
        allTime: (baseVisits?.allTime || 0) + (distribution.total_visits || 0)
      };
    }
    
    const totalDuration = endTime.getTime() - startTime.getTime();
    const elapsedDuration = now.getTime() - startTime.getTime();
    const progressRatio = Math.min(elapsedDuration / totalDuration, 1);
    
    const accumulatedVisits = Math.floor((distribution.total_visits || 0) * progressRatio);
    
    return {
      today: accumulatedVisits,
      thisWeek: accumulatedVisits,
      thisMonth: accumulatedVisits,
      allTime: (baseVisits?.allTime || 0) + accumulatedVisits
    };
  };

  const checkVisitDistribution = async () => {
    if (!userProfile?.id) return;
    
    try {
      const { data: distribution, error } = await supabase
        .from('visit_distribution')
        .select('*')
        .eq('partner_id', userProfile.id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (!error && distribution) {
        setVisitDistribution(distribution);
      } else {
        setVisitDistribution(null);
      }
    } catch (err) {
      console.warn('Error checking visit distribution:', err);
      setVisitDistribution(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const calculateGrowthPercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Memoized calculations for better performance
  const growthPercentage = useMemo(() => {
    if (!analytics) return 0;
    return calculateGrowthPercentage(
      analytics.metrics.thisMonthEarnings,
      analytics.metrics.lastMonthEarnings
    );
  }, [analytics]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-700/50 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
          <Button
            onClick={loadAnalytics}
            variant="outline"
            className="mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Track your store performance and growth</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <LineChart className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No Analytics Data</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Start by making your first sale to see analytics here. Analytics will appear once you have customer activity.
            </p>
            <Button onClick={loadAnalytics}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Load Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { metrics, partnerInfo } = analytics;

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <LineChart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Performance Analytics</h1>
              <p className="text-muted-foreground">
                Welcome back, {partnerInfo.name}! Here's your performance overview
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            <Badge variant="outline" className="text-xs">
              Real-time
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={loadAnalytics}
                  variant="outline"
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh analytics data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LineChart className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="earnings" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Earnings
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Today's Revenue */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Today
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Today's Earnings</p>
                  <h3 className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(metrics.todayEarnings)}
                  </h3>
                  <div className="flex items-center text-sm">
                    {metrics.todayEarnings > 0 ? (
                      <>
                        <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
                        <span className="text-green-600">Active</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">No earnings yet</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* This Month */}
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-700/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    This Month
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <h3 className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {formatCurrency(metrics.thisMonthEarnings)}
                  </h3>
                  <div className="flex items-center text-sm">
                    {growthPercentage > 0 ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                        <span className="text-green-600">{growthPercentage.toFixed(1)}% growth</span>
                      </>
                    ) : growthPercentage < 0 ? (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                        <span className="text-red-600">{Math.abs(growthPercentage).toFixed(1)}% decline</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">No change</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Orders */}
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-700/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <ShoppingCart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <Badge variant="outline" className="text-purple-600 border-purple-200">
                    All Orders
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <h3 className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                    {formatNumber(metrics.totalOrders)}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{metrics.completedOrders} completed</span>
                    <Badge variant="secondary" className="text-xs">
                      {(metrics.completedOrders / metrics.totalOrders * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Balance */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                    <Wallet className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-200">
                    Balance
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <h3 className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                    {formatCurrency(metrics.availableBalance)}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ready to withdraw</span>
                    <Badge variant="secondary" className="text-xs">
                      Instant
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Revenue Trend
                    </CardTitle>
                    <CardDescription>Daily revenue over last 14 days</CardDescription>
                  </div>
                  <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Metric" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="profit">Profit</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="orders">Orders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {analytics.charts.dailyEarnings.length > 0 ? (
                    <div className="flex items-end justify-between h-full gap-2">
                      {analytics.charts.dailyEarnings.slice(-14).map((day: any, index: number) => {
                        const maxValue = Math.max(
                          ...analytics.charts.dailyEarnings.slice(-14).map((d: any) => 
                            chartType === 'profit' ? d.profit : 
                            chartType === 'revenue' ? d.revenue : d.orders
                          )
                        );
                        const value = chartType === 'profit' ? day.profit : 
                                     chartType === 'revenue' ? day.revenue : day.orders;
                        const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                        const color = chartType === 'profit' ? 'from-green-500 to-emerald-400' :
                                     chartType === 'revenue' ? 'from-blue-500 to-cyan-400' :
                                     'from-purple-500 to-violet-400';
                        
                        return (
                          <TooltipProvider key={index}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex-1 flex flex-col items-center group cursor-pointer">
                                  <div className="w-full flex flex-col items-center">
                                    <div className="text-xs font-medium mb-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                      {chartType === 'orders' ? `${value} orders` : formatCurrency(value)}
                                    </div>
                                    <div 
                                      className={`w-full rounded-t-lg bg-gradient-to-t ${color} hover:opacity-90 transition-all duration-300`}
                                      style={{ height: `${Math.max(height, 2)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground mt-2">
                                    {new Date(day.date).getDate()}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{new Date(day.date).toLocaleDateString()}</p>
                                <p>Revenue: {formatCurrency(day.revenue)}</p>
                                <p>Profit: {formatCurrency(day.profit)}</p>
                                <p>Orders: {day.orders}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <BarChart3 className="w-12 h-12 mx-auto mb-3" />
                        <p>No revenue data available</p>
                        <p className="text-sm">Complete orders to see revenue trends</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TargetIcon className="w-5 h-5 text-blue-600" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-purple-600" />
                        <span className="text-sm">Conversion Rate</span>
                      </div>
                      <Badge className="bg-gradient-to-r from-purple-600 to-pink-600">
                        {metrics.conversionRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <Progress value={metrics.conversionRate} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Average Order Value</span>
                      </div>
                      <span className="font-semibold">{formatCurrency(metrics.avgOrderValue)}</span>
                    </div>
                    <Progress value={(metrics.avgOrderValue / 500) * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-orange-600" />
                        <span className="text-sm">Store Rating</span>
                      </div>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(metrics.storeRating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                          />
                        ))}
                        <span className="ml-2 font-semibold">{metrics.storeRating.toFixed(1)}</span>
                      </div>
                    </div>
                    <Progress value={(metrics.storeRating / 5) * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Store Performance Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Store Visits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Store Visits
                </CardTitle>
                <CardDescription>Customer engagement metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(metrics.storeVisits.today)}
                    </div>
                    <p className="text-sm text-muted-foreground">Today</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatNumber(metrics.storeVisits.thisWeek)}
                    </div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatNumber(metrics.storeVisits.thisMonth)}
                    </div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">
                      {formatNumber(metrics.storeVisits.allTime)}
                    </div>
                    <p className="text-sm text-muted-foreground">All Time</p>
                  </div>
                </div>
                
                {visitDistribution?.is_active && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <Zap className="w-4 h-4" />
                        <span className="text-sm font-medium">Auto-visits active</span>
                      </div>
                      <Badge variant="outline" className="text-blue-600">
                        {visitDistribution.total_visits} visits
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  Order Status
                </CardTitle>
                <CardDescription>Current order distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: 'Completed', value: metrics.completedOrders, color: 'green', icon: CheckCircle },
                    { label: 'Pending', value: metrics.pendingOrders, color: 'amber', icon: Clock },
                    { label: 'Paid', value: metrics.paidOrders, color: 'blue', icon: CreditCard },
                    { label: 'Cancelled', value: metrics.cancelledOrders, color: 'red', icon: AlertCircle }
                  ].map((status, index) => {
                    const Icon = status.icon;
                    const percentage = metrics.totalOrders > 0 ? (status.value / metrics.totalOrders) * 100 : 0;
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 text-${status.color}-600`} />
                            <span className="text-sm">{status.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{status.value}</span>
                            <Badge variant="secondary" className="text-xs">
                              {percentage.toFixed(0)}%
                            </Badge>
                          </div>
                        </div>
                        <Progress value={percentage} className={`h-1.5 bg-${status.color}-100`} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-6">
          {/* Earnings Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Earnings Overview
              </CardTitle>
              <CardDescription>Detailed earnings breakdown and commission analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(metrics.commissionEarned)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Commission</p>
                  <Badge variant="outline" className="mt-2">
                    {(metrics.commissionRate * 100).toFixed(1)}% rate
                  </Badge>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatCurrency(metrics.totalRevenue)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    From {metrics.totalSales} sales
                  </div>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-purple-600">
                    {formatCurrency(metrics.last30DaysEarnings)}
                  </div>
                  <p className="text-sm text-muted-foreground">Last 30 Days</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    Average: {formatCurrency(metrics.last30DaysEarnings / 30)}
                  </div>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-amber-600">
                    {formatCurrency(metrics.availableBalance)}
                  </div>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    Ready for withdrawal
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commission Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Commission Breakdown</CardTitle>
              <CardDescription>Commission earnings by period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { period: 'Today', earnings: metrics.todayEarnings },
                  { period: 'Last 7 Days', earnings: metrics.last7DaysEarnings },
                  { period: 'This Month', earnings: metrics.thisMonthEarnings },
                  { period: 'Last Month', earnings: metrics.lastMonthEarnings },
                  { period: 'All Time', earnings: metrics.commissionEarned }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg">
                        <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">{item.period}</p>
                        <p className="text-xs text-muted-foreground">{(metrics.commissionRate * 100).toFixed(1)}% commission</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-green-600">
                        {formatCurrency(item.earnings)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <Badge variant="outline">Conversion</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <h3 className="text-3xl font-bold text-blue-600">
                    {metrics.conversionRate.toFixed(1)}%
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {metrics.totalSales} sales / {metrics.storeVisits.thisMonth} visits
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <Badge variant="outline">Average</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Avg Order Value</p>
                  <h3 className="text-3xl font-bold text-green-600">
                    {formatCurrency(metrics.avgOrderValue)}
                  </h3>
                  <p className="text-xs text-muted-foreground">Per completed order</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <Badge variant="outline">Rating</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Store Rating</p>
                  <h3 className="text-3xl font-bold text-purple-600">
                    {metrics.storeRating.toFixed(1)}
                  </h3>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.floor(metrics.storeRating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Credit Score and Commission */}
          <Card>
            <CardHeader>
              <CardTitle>Store Credentials</CardTitle>
              <CardDescription>Your store's credit score and commission details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Credit Score</span>
                    </div>
                    <Badge variant={metrics.storeCreditScore > 700 ? "default" : "secondary"} className="text-lg font-bold">
                      {metrics.storeCreditScore}
                    </Badge>
                  </div>
                  <Progress value={(metrics.storeCreditScore / 850) * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    A higher credit score improves your commission rate and visibility
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-amber-600" />
                      <span className="font-medium">Commission Rate</span>
                    </div>
                    <Badge className="bg-gradient-to-r from-amber-600 to-orange-600 text-lg font-bold">
                      {(metrics.commissionRate * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={metrics.commissionRate * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    Your current commission rate on all sales
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          {/* Products Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Products Overview
              </CardTitle>
              <CardDescription>Your product catalog metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {metrics.totalProducts}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {metrics.activeProducts}
                  </div>
                  <p className="text-sm text-muted-foreground">Active Products</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">
                    {metrics.totalProducts - metrics.activeProducts}
                  </div>
                  <p className="text-sm text-muted-foreground">Inactive Products</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {metrics.totalProducts > 0 ? 
                      ((metrics.activeProducts / metrics.totalProducts) * 100).toFixed(1) : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">Active Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>Top performing products and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Product Analytics</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Product performance analytics will appear here once you have more sales data.
                </p>
                <Button variant="outline">
                  <Package className="w-4 h-4 mr-2" />
                  View All Products
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions Footer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Data updated:</span> {lastUpdate.toLocaleTimeString()}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadAnalytics}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}