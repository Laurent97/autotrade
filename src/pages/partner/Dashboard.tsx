import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase/client';
import { partnerService } from '../../lib/supabase/partner-service';
import { walletService } from '../../lib/supabase/wallet-service';
import StoreIdBadge from '../../components/ui/StoreIdBadge';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import PartnerSidebar from '../../components/Partner/PartnerSidebar';
import Breadcrumbs from '../../components/Breadcrumbs';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  Star,
  Package,
  ShoppingCart,
  Users,
  Activity,
  Calendar,
  Award,
  Target,
  BarChart3,
  CreditCard,
  Store,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { isDark } = useTheme();
  
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingOrders: 0,
    totalEarnings: 0,
    conversionRate: 0,
    averageOrderValue: 0,
    totalOrders: 0,
    storeVisits: {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      lastMonth: 0,
      allTime: 0
    },
    storeCreditScore: 0,
    storeRating: 0,
    totalProducts: 0,
    activeProducts: 0,
    walletBalance: 0,
    pendingBalance: 0,
    monthlyRevenue: 0,
    lastMonthRevenue: 0,
    commissionRate: 0.1
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth', { state: { from: '/partner/dashboard' } });
      return;
    }

    const userType = userProfile?.user_type || 'user';
    
    // Only admins and approved partners can access dashboard
    if (userType === 'admin') {
      // Admins redirected to admin dashboard
      navigate('/admin');
      return;
    }
    
    if (userType !== 'partner') {
      // Non-partners redirected to register
      navigate('/partner/register');
      return;
    }

    // Partners must be approved to access dashboard
    if (userProfile?.partner_status !== 'approved') {
      navigate('/partner/pending');
      return;
    }

    loadPartnerData();
  }, [user, userProfile, navigate]);

  const loadPartnerData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Load partner profile
      const { data: partnerData, error: partnerError } = await partnerService.getPartnerProfile(user.id);
      
      if (partnerError) {
        console.warn('Partner profile not found:', partnerError);
        // Don't throw error, just continue with null partner data
        setPartner(null);
      } else {
        setPartner(partnerData);
      }

      if (partnerData) {
        // Load partner analytics
        const { success, data: stats } = await partnerService.getPartnerStats(partnerData.id);
        
        // Get wallet balance
        const { data: walletData } = await walletService.getBalance(user.id);
        
        // Get pending transactions for accurate pending balance
        const { data: pendingTransactions } = await supabase
          .from('wallet_transactions')
          .select('amount, status, type')
          .eq('user_id', user.id)
          .eq('status', 'pending');
        
        // Calculate pending balance from actual pending transactions
        const pendingBalance = pendingTransactions?.reduce((sum, transaction) => {
          if (transaction.type === 'deposit' || transaction.type === 'commission' || transaction.type === 'bonus') {
            return sum + transaction.amount;
          }
          return sum; // Don't include withdrawals in pending balance
        }, 0) || 0;
        
        if (success && stats) {
          setStats({
            totalSales: stats.totalSales || 0,
            pendingOrders: stats.pendingOrders || 0,
            totalEarnings: stats.totalEarnings || 0,
            conversionRate: stats.conversionRate || 0,
            averageOrderValue: stats.averageOrderValue || 0,
            totalOrders: stats.totalOrders || 0,
            storeVisits: {
              today: stats.storeVisits?.today || 0,
              thisWeek: stats.storeVisits?.thisWeek || 0,
              thisMonth: stats.storeVisits?.thisMonth || 0,
              lastMonth: stats.storeVisits?.lastMonth || 0,
              allTime: stats.storeVisits?.allTime || 0
            },
            storeCreditScore: partnerData.store_credit_score || 750,
            storeRating: partnerData.store_rating || 0,
            totalProducts: partnerData.total_products || 0,
            activeProducts: partnerData.active_products || 0,
            walletBalance: walletData?.balance || 0,
            pendingBalance: pendingBalance, // Use calculated pending balance
            monthlyRevenue: stats.thisMonthRevenue || 0,
            lastMonthRevenue: stats.lastMonthRevenue || 0,
            commissionRate: partnerData.commission_rate || 0.1
          });
        }
      } else {
        // Set default stats if no partner data
        setStats({
          totalSales: 0,
          pendingOrders: 0,
          totalEarnings: 0,
          conversionRate: 0,
          averageOrderValue: 0,
          totalOrders: 0,
          storeVisits: {
            today: 0,
            thisWeek: 0,
            thisMonth: 0,
            lastMonth: 0,
            allTime: 0
          },
          storeCreditScore: 0,
          storeRating: 0,
          totalProducts: 0,
          activeProducts: 0,
          walletBalance: 0,
          pendingBalance: 0,
          monthlyRevenue: 0,
          lastMonthRevenue: 0,
          commissionRate: 0.1
        });
      }
    } catch (error) {
      console.error('Failed to load partner data:', error);
      // Set default stats on error
      setStats({
        totalSales: 0,
        pendingOrders: 0,
        totalEarnings: 0,
        conversionRate: 0,
        averageOrderValue: 0,
        totalOrders: 0,
        storeVisits: {
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          lastMonth: 0,
          allTime: 0
        },
        storeCreditScore: 0,
        storeRating: 0,
        totalProducts: 0,
        activeProducts: 0,
        walletBalance: 0,
        pendingBalance: 0,
        monthlyRevenue: 0,
        lastMonthRevenue: 0,
        commissionRate: 0.1
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadPartnerData();
    setRefreshing(false);
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { trend: 'up', percentage: 0 };
    const percentage = ((current - previous) / previous) * 100;
    return {
      trend: percentage >= 0 ? 'up' : 'down',
      percentage: Math.abs(percentage)
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🏪</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Partner Profile Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please complete your partner registration to access the dashboard.
            </p>
            <button
              onClick={() => navigate('/partner/register')}
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              Complete Registration
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex-1">
        {/* Professional Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Store className="w-8 h-8" />
                  <h1 className="text-3xl font-bold">Partner Dashboard</h1>
                </div>
                <p className="text-blue-100 text-lg mb-4">
                  Welcome back, {partner?.store_name || userProfile?.email || 'Partner'}!
                </p>
                <div className="flex items-center gap-4">
                  {partner?.store_id && (
                    <StoreIdBadge storeId={partner.store_id} size="sm" variant="outline" />
                  )}
                  <Badge variant={userProfile?.partner_status === 'approved' ? 'default' : 'secondary'}>
                    {userProfile?.partner_status === 'approved' ? '✅ Verified Partner' : '⏳ Under Review'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshData}
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Revenue */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.totalSales.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            {/* Total Orders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingOrders} pending
                </p>
              </CardContent>
            </Card>

            {/* Average Order Value */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.averageOrderValue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Per transaction
                </p>
              </CardContent>
            </Card>

            {/* Conversion Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Visit to order ratio
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Store Performance Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Profit Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Profit Trend
                </CardTitle>
                <CardDescription>
                  Your earnings performance over the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <div className="flex items-end justify-between h-full gap-2">
                    {Array.from({ length: 30 }, (_, i) => {
                      const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
                      const baseProfit = stats.monthlyRevenue / 30;
                      const variance = Math.random() * 0.6 - 0.3; // ±30% variance
                      const dayProfit = Math.max(0, baseProfit * (1 + variance) * (stats.commissionRate || 0.1));
                      const maxProfit = Math.max(100, baseProfit * 2);
                      const height = maxProfit > 0 ? (dayProfit / maxProfit) * 100 : 0;
                      
                      return (
                        <TooltipProvider key={i}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex-1 flex flex-col items-center group cursor-pointer">
                                <div className="w-full flex flex-col items-center">
                                  <div className="text-xs font-medium mb-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                    ${dayProfit.toFixed(0)}
                                  </div>
                                  <div 
                                    className="w-full rounded-t-lg bg-gradient-to-t from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500 transition-all duration-300"
                                    style={{ height: `${Math.max(height, 2)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground mt-2">
                                  {date.getDate()}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{date.toLocaleDateString()}</p>
                              <p>Profit: ${dayProfit.toFixed(2)}</p>
                              <p>Revenue: ${(dayProfit / (stats.commissionRate || 0.1)).toFixed(2)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      ${(stats.monthlyRevenue * (stats.commissionRate || 0.1)).toFixed(0)}
                    </div>
                    <p className="text-xs text-muted-foreground">This Month</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      ${(stats.monthlyRevenue * (stats.commissionRate || 0.1) / 30).toFixed(0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Daily Avg</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      {stats.lastMonthRevenue > 0 
                        ? `+${((stats.monthlyRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue * 100).toFixed(1)}%`
                        : '+15%'
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">Growth</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Store Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Store Performance
                </CardTitle>
                <CardDescription>
                  Your store metrics and ratings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Store Rating</span>
                    <span className="text-sm text-muted-foreground">{stats.storeRating.toFixed(1)}/5</span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(stats.storeRating)
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Credit Score</span>
                    <span className="text-sm text-muted-foreground">{stats.storeCreditScore}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(stats.storeCreditScore / 850) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Commission Rate</span>
                    <span className="text-sm text-muted-foreground">{(stats.commissionRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${stats.commissionRate * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Wallet Balance */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${stats.walletBalance.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ready for withdrawal
                </p>
              </CardContent>
            </Card>

            {/* Pending Balance */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  ${stats.pendingBalance.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Processing orders
                </p>
              </CardContent>
            </Card>

            {/* Monthly Revenue */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.monthlyRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {calculateTrend(stats.monthlyRevenue, stats.lastMonthRevenue).trend === 'up' ? (
                    <span className="text-green-600">
                      +{calculateTrend(stats.monthlyRevenue, stats.lastMonthRevenue).percentage.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-red-600">
                      -{calculateTrend(stats.monthlyRevenue, stats.lastMonthRevenue).percentage.toFixed(1)}%
                    </span>
                  )} from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                  <Package className="h-6 w-6" />
                  <span>Add Product</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                  <Activity className="h-6 w-6" />
                  <span>View Analytics</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                  <Users className="h-6 w-6" />
                  <span>Customer Support</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <PartnerSidebar />
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-6">
                  <Breadcrumbs />
                  <div className="mt-6">
                    <Outlet />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
