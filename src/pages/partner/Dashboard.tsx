import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { partnerService } from '../../lib/supabase/partner-service';
import StoreIdBadge from '../../components/ui/StoreIdBadge';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import PartnerSidebar from '../../components/Partner/PartnerSidebar';
import Breadcrumbs from '../../components/Breadcrumbs';

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { isDark } = useTheme();
  
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingOrders: 0,
    totalEarnings: 0,
    conversionRate: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth', { state: { from: '/partner/dashboard' } });
      return;
    }

    const userType = userProfile?.user_type || 'customer';
    
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
        if (success && stats) {
          setStats({
            totalSales: stats.totalRevenue || 0,
            pendingOrders: stats.pendingOrders || 0,
            totalEarnings: stats.totalEarnings || 0,
            conversionRate: stats.totalOrders > 0 ? (stats.completedOrders / stats.totalOrders) * 100 : 0
          });
        }
      } else {
        // Set default stats if no partner data
        setStats({
          totalSales: 0,
          pendingOrders: 0,
          totalEarnings: 0,
          conversionRate: 0
        });
      }
    } catch (error) {
      console.error('Failed to load partner data:', error);
      // Set default stats on error
      setStats({
        totalSales: 0,
        pendingOrders: 0,
        totalEarnings: 0,
        conversionRate: 0
      });
    } finally {
      setLoading(false);
    }
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
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navbar />
      <div className="flex-grow">
        {/* Dashboard Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 dark:from-amber-700 dark:to-amber-800 text-white">
          <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">🏪 Partner Dashboard</h1>
                <p className="text-amber-100/90 text-sm sm:text-base lg:text-lg truncate">
                  Welcome back, {partner?.store_name || userProfile?.email || 'Partner'}!
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mt-2">
                  {partner?.store_id && (
                    <StoreIdBadge storeId={partner.store_id} size="sm" variant="outline" />
                  )}
                  <p className="text-amber-100/70 text-xs sm:text-sm hidden xs:block">
                    Manage your store, products, and orders all in one place
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${
                  userProfile?.partner_status === 'approved' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' :
                  userProfile?.partner_status === 'pending' ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white' :
                  userProfile?.partner_status === 'rejected' ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white' :
                  'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                }`}>
                  {(userProfile?.partner_status || 'PENDING').toUpperCase()}
                </span>
                <p className="text-amber-100/80 text-xs sm:text-xs mt-1">
                  {userProfile?.partner_status === 'approved' ? '✅ Verified Partner' :
                   userProfile?.partner_status === 'pending' ? '⏳ Under Review' :
                   userProfile?.partner_status === 'rejected' ? '❌ Application Rejected' :
                   '📋 Status Pending'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 -mt-4 sm:-mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
            {/* Total Sales Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 animate-fade-in hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                  <span className="text-lg sm:text-2xl">💰</span>
                </div>
                <div className="text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-semibold">Sales</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Total Sales</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                ${stats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Pending Orders Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 animate-fade-in hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                  <span className="text-lg sm:text-2xl">⏳</span>
                </div>
                <div className="text-yellow-600 dark:text-yellow-400 text-xs sm:text-sm font-semibold">Orders</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Orders</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {stats.pendingOrders}
              </div>
            </div>

            {/* Total Earnings Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-green-200 dark:border-green-700/50 p-4 sm:p-6 animate-fade-in hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="bg-gradient-to-br from-green-200 to-green-300 dark:from-green-600 dark:to-green-500 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                  <span className="text-lg sm:text-2xl">💵</span>
                </div>
                <div className="text-green-600 dark:text-green-400 text-xs sm:text-sm font-semibold">Earnings</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Total Earnings</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-700 dark:text-green-300">
                ${stats.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Conversion Rate Card */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-purple-200 dark:border-purple-700/50 p-4 sm:p-6 animate-fade-in hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-600 dark:to-purple-500 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                  <span className="text-lg sm:text-2xl">📊</span>
                </div>
                <div className="text-purple-600 dark:text-purple-400 text-xs sm:text-sm font-semibold">Performance</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Conversion Rate</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-700 dark:text-purple-300">
                {stats.conversionRate.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              </div>
            </div>
          </div>
          {/* Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 sm:top-8">
                <PartnerSidebar />
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 min-h-[400px] sm:min-h-[600px]">
                {/* Breadcrumbs appear once, globally */}
                <Breadcrumbs />
                
                <div className="mt-4 sm:mt-6">
                  <Outlet />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
