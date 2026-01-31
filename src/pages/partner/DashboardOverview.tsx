import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Activity, Package, Users, Eye, Star, Shield, Target, Store } from 'lucide-react';

export default function DashboardOverview() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const { stats: parentStats, partner } = useOutletContext<{ stats: any, partner: any, refreshData: () => void }>();
  
  // Transform parent stats to match our component's needs
  const stats = {
    totalRevenue: parentStats?.totalEarnings || 0,
    totalOrders: parentStats?.totalOrders || 0,
    avgOrderValue: parentStats?.averageOrderValue || 0,
    profitTrend: parentStats?.lastMonthRevenue > 0 
      ? ((parentStats?.monthlyRevenue - parentStats?.lastMonthRevenue) / parentStats?.lastMonthRevenue) * 100 
      : 0,
    monthlyRevenue: parentStats?.monthlyRevenue || 0,
    lastMonthRevenue: parentStats?.lastMonthRevenue || 0,
    pendingOrders: parentStats?.pendingOrders || 0,
    conversionRate: parentStats?.conversionRate || 0,
    storeVisits: parentStats?.storeVisits?.allTime || 0,
    // Store performance data
    storeRating: partner?.store_rating || 0,
    creditScore: partner?.store_credit_score || 750,
    commissionRate: partner?.commission_rate || 10
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Compact Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Total Revenue */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-blue-100 text-xs font-medium mb-1">Total Revenue</div>
                <div className="text-xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-green-100 text-xs font-medium mb-1">Total Orders</div>
                <div className="text-xl font-bold">{stats.totalOrders.toLocaleString()}</div>
                {stats.pendingOrders > 0 && (
                  <Badge className="mt-1 bg-yellow-400 text-yellow-900 text-xs">
                    {stats.pendingOrders} pending
                  </Badge>
                )}
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-purple-100 text-xs font-medium mb-1">Avg Order Value</div>
                <div className="text-xl font-bold">{formatCurrency(stats.avgOrderValue)}</div>
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profit Trend */}
        <Card className={`bg-gradient-to-br ${
          stats.profitTrend >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'
        } text-white border-0 shadow-lg`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/80 text-xs font-medium mb-1">Profit Trend</div>
                <div className="text-xl font-bold flex items-center gap-1">
                  {stats.profitTrend >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {formatPercentage(stats.profitTrend)}
                </div>
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-amber-100 text-xs font-medium mb-1">Monthly Revenue</div>
                <div className="text-xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
                {stats.lastMonthRevenue > 0 && (
                  <Badge className={`mt-1 ${
                    stats.monthlyRevenue >= stats.lastMonthRevenue 
                      ? 'bg-green-400 text-green-900' 
                      : 'bg-red-400 text-red-900'
                  } text-xs`}>
                    {formatPercentage(((stats.monthlyRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100)}
                  </Badge>
                )}
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Visits */}
        <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-teal-100 text-xs font-medium mb-1">Store Visits</div>
                <div className="text-xl font-bold">{stats.storeVisits.toLocaleString()}</div>
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - More Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => navigate('/partner/dashboard/products')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 transition-colors"
        >
          <Package className="w-4 h-4 text-blue-600" />
          <span className="font-medium">Products</span>
        </button>
        <button
          onClick={() => navigate('/partner/dashboard/orders')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 transition-colors"
        >
          <ShoppingCart className="w-4 h-4 text-green-600" />
          <span className="font-medium">Orders</span>
        </button>
        <button
          onClick={() => navigate('/partner/dashboard/earnings')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 transition-colors"
        >
          <DollarSign className="w-4 h-4 text-amber-600" />
          <span className="font-medium">Earnings</span>
        </button>
        <button
          onClick={() => navigate('/partner/dashboard/analytics')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 transition-colors"
        >
          <Activity className="w-4 h-4 text-purple-600" />
          <span className="font-medium">Analytics</span>
        </button>
      </div>

      {/* Profit Trend Chart */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Profit Trend
            </h3>
            <p className="text-sm text-muted-foreground">
              Your earnings performance over the last 30 days
            </p>
          </div>
          
          {/* Chart Visualization */}
          <div className="h-64 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg flex items-center justify-center mb-4 border border-green-200 dark:border-green-700/30">
            <div className="text-center">
              <div className="text-6xl mb-2">📈</div>
              <p className="text-muted-foreground font-medium">Profit Trend Chart</p>
              <p className="text-xs text-muted-foreground mt-1">Daily earnings visualization</p>
            </div>
          </div>
          
          {/* Chart Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                {formatCurrency(stats.monthlyRevenue)}
              </div>
              <div className="text-xs text-muted-foreground">This Month</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                {formatCurrency(stats.monthlyRevenue / 30)}
              </div>
              <div className="text-xs text-muted-foreground">Daily Avg</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-lg font-semibold text-green-700 dark:text-green-300">
                {formatPercentage(stats.profitTrend)}
              </div>
              <div className="text-xs text-muted-foreground">Growth</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Store Performance Panel */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Store className="w-5 h-5 text-purple-600" />
              Store Performance
            </h3>
            <p className="text-sm text-muted-foreground">
              Your store metrics and ratings
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-6 h-6 text-yellow-500 mr-1" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.storeRating.toFixed(1)}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">Store Rating</div>
              <div className="text-xs text-muted-foreground mt-1">Based on customer reviews</div>
            </div>
            
            <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Shield className="w-6 h-6 text-blue-500 mr-1" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.creditScore}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">Credit Score</div>
              <div className="text-xs text-muted-foreground mt-1">Excellent standing</div>
            </div>
            
            <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-6 h-6 text-green-500 mr-1" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.commissionRate.toFixed(1)}%
                </div>
              </div>
              <div className="text-sm text-muted-foreground">Commission Rate</div>
              <div className="text-xs text-muted-foreground mt-1">Per successful sale</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity - Minimal */}
      <Card className="mt-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h4>
            <Badge variant="outline" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              Live
            </Badge>
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            <p>📈 Dashboard is actively monitoring your performance</p>
            <p className="mt-1">🎯 All metrics are up-to-date</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
