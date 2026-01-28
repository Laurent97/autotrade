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
    conversionRate: 0,
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
    activeProducts: 0
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
        if (success && stats) {
          setStats({
            totalSales: stats.totalRevenue || 0,
            pendingOrders: stats.pendingOrders || 0,
            totalEarnings: stats.totalEarnings || 0,
            conversionRate: stats.totalOrders > 0 ? (stats.completedOrders / stats.totalOrders) * 100 : 0,
            storeVisits: {
              today: Math.floor(Math.random() * 50) + 10, // Mock data - replace with real analytics
              thisWeek: Math.floor(Math.random() * 200) + 50,
              thisMonth: Math.floor(Math.random() * 800) + 200,
              lastMonth: Math.floor(Math.random() * 600) + 150,
              allTime: Math.floor(Math.random() * 5000) + 1000
            },
            storeCreditScore: Math.floor(Math.random() * 200) + 600, // Mock data - set by admin
            storeRating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // Mock data - 3.0-5.0
            totalProducts: Math.floor(Math.random() * 50) + 10,
            activeProducts: Math.floor(Math.random() * 40) + 5
          });
        }
      } else {
        // Set default stats if no partner data
        setStats({
          totalSales: 0,
          pendingOrders: 0,
          totalEarnings: 0,
          conversionRate: 0,
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
          activeProducts: 0
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
        activeProducts: 0
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
          {/* First Row - Original Stats */}
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

          {/* Second Row - Store Visits and Credit Score */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
            {/* Today's Visits Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 animate-fade-in hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                  <span className="text-lg sm:text-2xl">👁️</span>
                </div>
                <div className="text-orange-600 dark:text-orange-400 text-xs sm:text-sm font-semibold">Today</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Today's Visits</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {stats.storeVisits.today.toLocaleString()}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                +{Math.floor(Math.random() * 20) + 5}% from yesterday
              </div>
            </div>

            {/* This Week Visits Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 animate-fade-in hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/30 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                  <span className="text-lg sm:text-2xl">📅</span>
                </div>
                <div className="text-cyan-600 dark:text-cyan-400 text-xs sm:text-sm font-semibold">This Week</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">This Week</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {stats.storeVisits.thisWeek.toLocaleString()}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                Avg: {Math.floor(stats.storeVisits.thisWeek / 7)} per day
              </div>
            </div>

            {/* Store Credit Score Card */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-amber-200 dark:border-amber-700/50 p-4 sm:p-6 animate-fade-in hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="bg-gradient-to-br from-amber-200 to-amber-300 dark:from-amber-600 dark:to-amber-500 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                  <span className="text-lg sm:text-2xl">⭐</span>
                </div>
                <div className="text-amber-600 dark:text-amber-400 text-xs sm:text-sm font-semibold">Credit Score</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Store Credit Score</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-700 dark:text-amber-300">
                {stats.storeCreditScore}
              </div>
              <div className="flex items-center gap-1 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  stats.storeCreditScore >= 750 ? 'bg-green-100 text-green-800' :
                  stats.storeCreditScore >= 600 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {stats.storeCreditScore >= 750 ? 'Excellent' :
                   stats.storeCreditScore >= 600 ? 'Good' : 'Fair'}
                </span>
              </div>
            </div>

            {/* Store Rating Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-indigo-200 dark:border-indigo-700/50 p-4 sm:p-6 animate-fade-in hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="bg-gradient-to-br from-indigo-200 to-indigo-300 dark:from-indigo-600 dark:to-indigo-500 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                  <span className="text-lg sm:text-2xl">🏆</span>
                </div>
                <div className="text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm font-semibold">Rating</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Store Rating</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-indigo-700 dark:text-indigo-300">
                {stats.storeRating.toFixed(1)}
              </div>
              <div className="flex items-center gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-lg ${i < Math.floor(stats.storeRating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Third Row - Additional Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
            {/* This Month Visits Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 animate-fade-in hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/30 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                  <span className="text-lg sm:text-2xl">📆</span>
                </div>
                <div className="text-teal-600 dark:text-teal-400 text-xs sm:text-sm font-semibold">This Month</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">This Month</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {stats.storeVisits.thisMonth.toLocaleString()}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400">
                {((stats.storeVisits.thisMonth / stats.storeVisits.lastMonth) * 100).toFixed(1)}% vs last month
              </div>
            </div>

            {/* All Time Visits Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 animate-fade-in hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                  <span className="text-lg sm:text-2xl">🌟</span>
                </div>
                <div className="text-pink-600 dark:text-pink-400 text-xs sm:text-sm font-semibold">All Time</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">All Time</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {stats.storeVisits.allTime.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Since store launch
              </div>
            </div>

            {/* Total Products Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 animate-fade-in hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="bg-gradient-to-br from-lime-50 to-lime-100 dark:from-lime-900/30 dark:to-lime-800/30 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                  <span className="text-lg sm:text-2xl">📦</span>
                </div>
                <div className="text-lime-600 dark:text-lime-400 text-xs sm:text-sm font-semibold">Products</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Total Products</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalProducts}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                {stats.activeProducts} active
              </div>
            </div>

            {/* Active Products Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 animate-fade-in hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                  <span className="text-lg sm:text-2xl">✅</span>
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-semibold">Active</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Active Products</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {stats.activeProducts}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                {stats.totalProducts > 0 ? ((stats.activeProducts / stats.totalProducts) * 100).toFixed(1) : 0}% of total
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
