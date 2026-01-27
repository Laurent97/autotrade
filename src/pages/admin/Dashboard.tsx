import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { adminService } from '../../lib/supabase/admin-service';
import { useUsers, useOrders, usePartnerProfiles } from '../../hooks/useRealtimeSubscription';
import { Order, User } from '../../lib/types/database';
import { Button } from '@/components/ui/button';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import Breadcrumbs from '../../components/Breadcrumbs';
import { Users, Store, Package, TrendingUp, ArrowUpRight, ArrowDownRight, Clock, CheckCircle, AlertCircle, RefreshCw, CreditCard, Key } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalPartners: number;
  totalOrders: number;
  totalRevenue: number;
  pendingPartners: number;
}

const AdminDashboard = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const { data: users, loading: usersLoading, refresh: refreshUsers } = useUsers();
  const { data: orders, loading: ordersLoading, refresh: refreshOrders } = useOrders();
  const { data: partners, loading: partnersLoading, refresh: refreshPartners } = usePartnerProfiles();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPartners: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingPartners: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (userProfile?.user_type !== 'admin') {
      navigate('/');
      return;
    }

    // Calculate stats from real-time data with null checks
    if (users && orders && partners) {
      const totalUsers = users?.length || 0;
      const totalPartners = partners?.length || 0;
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const pendingPartners = partners?.filter(p => p.partner_status === 'pending').length || 0;

      setStats({
        totalUsers,
        totalPartners,
        totalOrders,
        totalRevenue,
        pendingPartners
      });
      setLastUpdate(new Date());
    }
    
    setLoading(false);
  }, [users, orders, partners, userProfile, navigate]);

  const refreshAllData = () => {
    refreshUsers();
    refreshOrders();
    refreshPartners();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'shipped': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background dark:bg-gray-950">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 dark:border-gray-700 border-t-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground dark:text-gray-400 font-medium">Loading your dashboard...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-gray-950">
      <Navbar />
      <div className="flex-grow">
        <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            <AdminSidebar />
            
            <div className="flex-grow min-w-0">
              {/* Breadcrumbs */}
              <Breadcrumbs />
              
              {/* Welcome Header */}
              <div className="mb-4 sm:mb-6 lg:mb-8 animate-fade-in">
                <div className="bg-gradient-to-r from-primary to-primary/90 dark:from-blue-700 dark:to-blue-800 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 text-primary-foreground dark:text-white shadow-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-1 sm:mb-2">Dashboard</h1>
                    <p className="text-primary-foreground/90 dark:text-white/90 text-sm sm:text-base lg:text-lg">Welcome back, <span className="font-semibold truncate max-w-[200px] sm:max-w-none inline-block">{userProfile?.email?.split('@')[0] || 'Admin'}</span></p>
                    <p className="text-primary-foreground/70 dark:text-white/70 mt-1 text-xs sm:text-sm lg:text-base hidden xs:block">Here's what's happening with your business today</p>
                    {lastUpdate && (
                      <p className="text-primary-foreground/50 dark:text-white/50 text-xs mt-1">Last updated: {lastUpdate.toLocaleTimeString()}</p>
                    )}
                  </div>
                  <Button
                    onClick={refreshAllData}
                    variant="outline"
                    size="sm"
                    className="text-primary-foreground dark:text-white border-primary/20 dark:border-blue-600 hover:bg-primary/10 dark:hover:bg-blue-700/20"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Main Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
                {/* Total Users Card */}
                <Link 
                  to="/admin/users"
                  className="group bg-card rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-3 sm:p-4 lg:p-6 border border-border hover:border-primary animate-fade-in hover:scale-105 transform"
                >
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-2 sm:p-3 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm font-medium mb-1">Total Users</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 sm:mb-3">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">All registered customers</p>
                </Link>

                {/* Active Partners Card */}
                <Link 
                  to="/admin/partners"
                  className="group bg-card rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-3 sm:p-4 lg:p-6 border border-border hover:border-primary animate-fade-in hover:scale-105 transform"
                >
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-2 sm:p-3 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform">
                      <Store className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    {stats.pendingPartners > 0 && (
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-warning animate-pulse" />
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm font-medium mb-1">Active Partners</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">{stats.totalPartners}</p>
                  {stats.pendingPartners > 0 && (
                    <p className="text-xs text-warning font-semibold truncate">⚠️ {stats.pendingPartners} pending</p>
                  )}
                </Link>

                {/* Total Orders Card */}
                <Link 
                  to="/admin/orders"
                  className="group bg-card rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-3 sm:p-4 lg:p-6 border border-border hover:border-primary animate-fade-in hover:scale-105 transform"
                >
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-2 sm:p-3 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform">
                      <Package className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm font-medium mb-1">Total Orders</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 sm:mb-3">{stats.totalOrders}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">All time orders</p>
                </Link>

                {/* Total Revenue Card */}
                <div className="group bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-3 sm:p-4 lg:p-6 border border-primary/20 hover:border-primary/40 animate-fade-in hover:scale-105 transform">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="bg-gradient-to-br from-primary/30 to-primary/20 dark:from-primary/40 dark:to-primary/30 p-2 sm:p-3 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary dark:text-primary/80" />
                    </div>
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary opacity-50" />
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm font-medium mb-1">Total Revenue</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 sm:mb-3">${stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">Lifetime revenue</p>
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6 lg:mb-8">
                {/* Recent Orders */}
                <div className="xl:col-span-2 bg-card rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md border border-border overflow-hidden hover:shadow-lg transition-shadow animate-fade-in">
                  <div className="p-4 sm:p-6 border-b border-border bg-gradient-to-r from-card to-card/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      <h2 className="text-lg sm:text-xl font-bold text-foreground">Recent Orders</h2>
                    </div>
                    <Link to="/admin/orders" className="text-primary hover:text-primary/80 text-sm font-semibold flex items-center gap-1">
                      View all <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                  
                  <div className="p-4 sm:p-6">
                    {orders && orders.length === 0 ? (
                      <div className="text-center py-8 sm:py-12">
                        <Package className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-2 sm:mb-3" />
                        <p className="text-muted-foreground text-sm sm:text-base">No orders yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3">
                        {orders?.slice(0, 5).map((order, idx) => (
                          <Link
                            key={order.id}
                            to="/admin/orders"
                            className="group flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-all border border-border hover:border-primary/50 gap-3"
                            style={{ animationDelay: `${idx * 50}ms` }}
                          >
                            <div className="flex-grow">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/20 dark:to-purple-800/20 flex items-center justify-center">
                                  <span className="text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-400">#</span>
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">{order?.order_number || 'Unknown'}</p>
                                  <p className="text-xs text-muted-foreground">${(order?.total_amount || 0).toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3">
                              <span className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold ${
                                order?.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                order?.status === 'shipped' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                                order?.status === 'processing' ? 'bg-amber-100 text-amber-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                                'bg-slate-100 text-slate-700 dark:bg-gray-800/40 dark:text-gray-300'
                              }`}>
                                {order?.status || 'Unknown'}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Stats Sidebar */}
                <div className="space-y-4 sm:space-y-6 animate-fade-in">
                  {/* Pending Partners */}
                  {stats.pendingPartners > 0 && (
                    <div className="bg-gradient-to-br from-warning/10 to-warning/5 dark:from-warning/20 dark:to-warning/10 rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-6 border border-warning/20 shadow-md">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
                        <h3 className="font-bold text-foreground dark:text-white text-sm sm:text-base">Pending Approvals</h3>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white mb-2">{stats.pendingPartners}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 mb-3 sm:mb-4">Partner applications waiting</p>
                      <Link to="/admin/partners" className="text-xs sm:text-sm font-semibold text-foreground dark:text-white hover:text-primary flex items-center gap-1">
                        Review now <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}

                  {/* Active Orders Status */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-6 border border-blue-200 dark:border-blue-800/30 shadow-md">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="font-bold text-foreground text-sm sm:text-base">System Health</h3>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400">Status</span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-xs font-semibold rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Operational
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* User Activity */}
                  <div className="bg-gradient-to-br from-card to-card/50 rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-6 border border-border shadow-md">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      <h3 className="font-bold text-foreground text-sm sm:text-base">Recent Users</h3>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      {users?.slice(0, 3).map((userItem) => (
                        <div key={userItem?.id} className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-foreground dark:text-white truncate">{userItem?.full_name || userItem?.email?.split('@')[0] || 'Unknown User'}</p>
                            <p className="text-xs text-muted-foreground dark:text-gray-400 capitalize">{userItem?.user_type || 'unknown'}</p>
                          </div>
                          {userItem?.user_type === 'partner' && userItem?.partner_status === 'approved' && (
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-card rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md border border-border p-4 sm:p-6 lg:p-8 animate-fade-in hover:shadow-lg transition-shadow">
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground dark:text-white flex items-center gap-2">
                    <span className="text-xl sm:text-2xl lg:text-3xl">⚡</span> Quick Actions
                  </h2>
                  <p className="text-muted-foreground dark:text-gray-400 text-xs sm:text-sm mt-1">Frequently used admin functions</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
                  <Link
                    to="/admin/users"
                    className="group relative p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 border-border hover:border-primary hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/0 group-hover:from-primary/10 group-hover:to-primary/5 transition-all"></div>
                    <div className="relative">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        <h3 className="font-bold text-foreground text-sm sm:text-base">Manage Users</h3>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Edit user profiles and balances</p>
                    </div>
                  </Link>
                  
                  <Link
                    to="/admin/partners"
                    className="group relative p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 border-border hover:border-primary hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/0 group-hover:from-primary/10 group-hover:to-primary/5 transition-all"></div>
                    <div className="relative">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <Store className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        <h3 className="font-bold text-foreground text-sm sm:text-base">Review Partners</h3>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">{stats.pendingPartners} pending {stats.pendingPartners === 1 ? 'application' : 'applications'}</p>
                    </div>
                  </Link>
                  
                  <Link
                    to="/admin/orders"
                    className="group relative p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 border-border hover:border-primary hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/0 group-hover:from-primary/10 group-hover:to-primary/5 transition-all"></div>
                    <div className="relative">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        <h3 className="font-bold text-foreground text-sm sm:text-base">Process Orders</h3>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Manage and track all orders</p>
                    </div>
                  </Link>

                  <Link
                    to="/admin/payments"
                    className="group relative p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 border-border hover:border-primary hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/0 group-hover:from-primary/10 group-hover:to-primary/5 transition-all"></div>
                    <div className="relative">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        <h3 className="font-bold text-foreground text-sm sm:text-base">Manage Payments</h3>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Wallet transactions & withdrawals</p>
                    </div>
                  </Link>

                  <Link
                    to="/admin/password-reset"
                    className="group relative p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 border-border hover:border-primary hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/0 group-hover:from-primary/10 group-hover:to-primary/5 transition-all"></div>
                    <div className="relative">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <Key className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        <h3 className="font-bold text-foreground text-sm sm:text-base">Password Reset</h3>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Help users reset passwords</p>
                    </div>
                  </Link>

                  <Link
                    to="/admin/settings"
                    className="group relative p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 border-border hover:border-primary hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/0 group-hover:from-primary/10 group-hover:to-primary/5 transition-all"></div>
                    <div className="relative">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        <h3 className="font-bold text-foreground text-sm sm:text-base">System Settings</h3>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Configure system preferences</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
