import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { partnerService } from '../../lib/supabase/partner-service';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function DashboardAnalytics() {
  const { userProfile } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [userProfile]);

  const loadAnalytics = async () => {
    if (!userProfile?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // ✅ FIXED: Use getPartnerStats instead of getDetailedAnalytics
      const { data: stats, error: statsError } = await partnerService.getPartnerStats(userProfile.id);
      
      if (statsError) {
        throw new Error(statsError);
      }
      
      if (stats) {
        // Transform stats data to match component expectations
        setAnalytics({
          metrics: {
            totalViews: 0, // You might need to get this from store_visits table
            totalSales: stats.totalOrders || 0,
            totalRevenue: stats.totalRevenue || 0,
            conversionRate: 0, // Calculate from your data
            avgOrderValue: stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders) : 0
          }
        });
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
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
    avgOrderValue: 0
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📊 Analytics Overview</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Track your store performance and customer behavior</p>
        <div className="text-xs text-gray-500 dark:text-gray-500">
          Data updates in real-time • Last updated: Just now
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Views</div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{metrics.totalViews || 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Store page visits</div>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 text-xl">👁</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Sales</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{metrics.totalSales || 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Completed orders</div>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 text-xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-600 dark:text-gray-600 text-sm mb-2">Total Earnings</div>
              <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">${(metrics.totalRevenue || 0).toFixed(2)}</div>
              <div className="text-xs text-gray-500 dark:text-yellow-600 mt-1">Gross revenue</div>
            </div>
            <div className="w-12 h-12 bg-yellow-200 dark:bg-yellow-700 rounded-full flex items-center justify-center">
              <span className="text-yellow-700 dark:text-yellow-400 text-xl">💵</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-600 dark:text-gray-600 text-sm mb-2">Conversion Rate</div>
              <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">{(metrics.conversionRate || 0).toFixed(1)}%</div>
              <div className="text-xs text-gray-500 dark:text-purple-600 mt-1">Views to orders</div>
            </div>
            <div className="w-12 h-12 bg-purple-200 dark:bg-purple-700 rounded-full flex items-center justify-center">
              <span className="text-purple-700 dark:text-purple-400 text-xl">📈</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">Avg Order Value</div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">${(metrics.avgOrderValue || 0).toFixed(2)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Per order average</div>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <span className="text-orange-600 dark:text-orange-400 text-xl">📦</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📋 Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">Top Performing Products</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">-</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Based on sales volume</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">Low Stock Products</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">-</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Products below threshold</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Activity</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">No recent activity</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Last 24 hours</div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg shadow">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 dark:text-blue-400 text-xl">💡</div>
          <div>
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Analytics Tips</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <li>• Monitor your conversion rate to optimize product listings</li>
              <li>• Increase average order value with product bundles</li>
              <li>• Track store visits to measure marketing effectiveness</li>
              <li>• Set up inventory alerts for low-stock products</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Data Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg shadow transition-all"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Data'}
        </button>
      </div>
    </div>
  );
}
