import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase/client';
import { User as UserType, UserType as UserTypeEnum, PartnerStatus } from '../../lib/types/database';
import { NotificationService } from '../../lib/supabase/notification-service';
import { getPartnerProductsWithDetails } from '../../services/partnerProductsService';
import AdminLayout from '../../components/Admin/AdminLayout';
import { 
  Users,
  DollarSign,
  Wallet,
  Eye,
  Target,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  Star,
  Award,
  BarChart3,
  PieChart,
  RefreshCw,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  CreditCard,
  Package,
  ShoppingCart,
  Settings,
  UserCheck,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

// Add this helper function at the top
const safeRender = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if (Array.isArray(value)) return value.join(', ');
    return JSON.stringify(value); // Or handle objects differently
  }
  return String(value);
};

interface BalanceUpdate {
  userId: string;
  amount: number;
  type: 'add' | 'subtract';
  reason: string;
}

interface WalletBalance {
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user: adminUser, userProfile } = useAuth();
  
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<UserTypeEnum | 'all'>('all');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showPartnerMetricsModal, setShowPartnerMetricsModal] = useState(false);
  const [balanceUpdate, setBalanceUpdate] = useState<BalanceUpdate>({
    userId: '',
    amount: 0,
    type: 'add',
    reason: ''
  });
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    user_type: 'user' as UserTypeEnum,
    partner_status: 'pending' as PartnerStatus
  });
  const [userBalances, setUserBalances] = useState<Record<string, WalletBalance>>({});
  const [partnerMetrics, setPartnerMetrics] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'metrics'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [visitDistribution, setVisitDistribution] = useState<Record<string, {
    totalVisits: number;
    timePeriod: 'hour' | 'minute' | 'second';
    visitsPerUnit: number;
    isActive: boolean;
    lastDistribution: string;
  }>>({});
  const [savingMetrics, setSavingMetrics] = useState<string | null>(null);

  // Function to fetch real product counts for a partner
  const fetchPartnerProductCounts = async (partnerId: string) => {
    try {
      const products = await getPartnerProductsWithDetails(partnerId);
      const totalProducts = products.length;
      const activeProducts = products.filter(p => p.is_active).length;
      
      return { totalProducts, activeProducts };
    } catch (error) {
      console.error('Error fetching partner product counts:', error);
      return { totalProducts: 0, activeProducts: 0 };
    }
  };

  // Function to update partner metrics with real product counts
  const updatePartnerMetricsWithProducts = async (partnerId: string) => {
    const productCounts = await fetchPartnerProductCounts(partnerId);
    
    setPartnerMetrics(prev => ({
      ...prev,
      [partnerId]: {
        ...prev[partnerId],
        ...productCounts
      }
    }));
  };

  useEffect(() => {
    if (userProfile?.user_type !== 'admin') {
      navigate('/');
      return;
    }

    loadUsers();
  }, [userProfile, navigate]);

  const loadUsers = async () => {
    setLoading(true);
    
    try {
      console.log('Loading fresh user data...');
      
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      
      console.log('Users data loaded:', usersData?.length, 'users');
      setUsers(usersData || []);

      // Load wallet balances for each user
      if (usersData) {
        console.log('Loading wallet balances...');
        try {
          const { data: balancesData, error: balancesError } = await supabase
            .from('wallet_balances')
            .select('*');

          if (balancesError) {
            console.error('Error loading wallet balances:', balancesError);
          } else {
            const balancesMap: Record<string, WalletBalance> = {};
            balancesData?.forEach((balance: WalletBalance) => {
              balancesMap[balance.user_id] = balance;
            });
            setUserBalances(balancesMap);
            console.log('Wallet balances loaded:', Object.keys(balancesMap).length, 'balances');
          }
        } catch (error) {
          console.error('Network error loading wallet balances:', error);
        }

        // Load partner profiles for metrics
        console.log('Loading partner profiles for metrics...');
        try {
          const { data: partnersData, error: partnersError } = await supabase
            .from('partner_profiles')
            .select('*');

          if (partnersError) {
            console.error('Error loading partner profiles:', partnersError);
          } else {
            const metricsMap: Record<string, any> = {};
            partnersData?.forEach((partner: any) => {
              // Ensure storeVisits is properly structured with sample data
              const storeVisits = partner.store_visits || {};
              metricsMap[partner.user_id] = {
                storeVisits: {
                  today: storeVisits.today || Math.floor(Math.random() * 100) + 50,
                  thisWeek: storeVisits.thisWeek || Math.floor(Math.random() * 500) + 200,
                  thisMonth: storeVisits.thisMonth || Math.floor(Math.random() * 2000) + 800,
                  lastMonth: storeVisits.lastMonth || Math.floor(Math.random() * 1800) + 700,
                  allTime: storeVisits.allTime || Math.floor(Math.random() * 10000) + 5000
                },
                storeCreditScore: partner.store_credit_score || Math.floor(Math.random() * 200) + 600,
                storeRating: partner.store_rating || parseFloat((Math.random() * 2 + 3).toFixed(1)),
                totalProducts: partner.total_products || Math.floor(Math.random() * 50) + 10,
                activeProducts: partner.active_products || Math.floor(Math.random() * 40) + 5,
                commissionRate: partner.commission_rate || 0.10,
                totalEarnings: partner.total_earnings || 0,
                pendingBalance: partner.pending_balance || 0,
                totalOrders: partner.total_orders || 0,
                conversionRate: partner.conversion_rate || 0,
                isVerified: partner.is_verified || false,
                isActive: partner.is_active !== false,
                lastActive: partner.last_active || new Date().toISOString()
              };
            });
            setPartnerMetrics(metricsMap);
            console.log('Partner metrics loaded:', Object.keys(metricsMap).length, 'partners');

            // Load visit distribution settings from database
            const distributionMap: Record<string, any> = {};
            try {
              const { data: distributionData, error: distributionError } = await supabase
                .from('visit_distribution')
                .select('*')
                .eq('is_active', true);

              if (!distributionError && distributionData) {
                distributionData.forEach((config: any) => {
                  distributionMap[config.partner_id] = {
                    totalVisits: config.total_visits,
                    timePeriod: config.time_period,
                    visitsPerUnit: config.visits_per_unit,
                    isActive: config.is_active,
                    lastDistribution: config.last_distribution,
                    totalDistributed: config.total_distributed,
                    startTime: config.start_time,
                    endTime: config.end_time
                  };
                });
              }
            } catch (error) {
              console.error('Error loading visit distribution:', error);
            }
            
            // Initialize default distribution for partners without active configs
            partnersData?.forEach((partner: any) => {
              if (!distributionMap[partner.user_id]) {
                distributionMap[partner.user_id] = {
                  totalVisits: 0,
                  timePeriod: 'hour' as const,
                  visitsPerUnit: 0,
                  isActive: false,
                  lastDistribution: new Date().toISOString(),
                  totalDistributed: 0,
                  startTime: null,
                  endTime: null
                };
              }
            });
            setVisitDistribution(distributionMap);
          }
        } catch (error) {
          console.error('Error loading partner profiles:', error);
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // ... rest of your functions (updateUser, updateUserBalance, deleteUser, etc.) ...

  // Fix: Safe getter for store visits
  const getStoreVisitValue = (userId: string, key: string): number => {
    const metrics = partnerMetrics[userId];
    if (!metrics || !metrics.storeVisits) return 0;
    
    // Handle the case where storeVisits might be a number or an object
    if (typeof metrics.storeVisits === 'number') {
      return metrics.storeVisits;
    }
    
    if (typeof metrics.storeVisits === 'object') {
      return metrics.storeVisits[key] || 0;
    }
    
    return 0;
  };

  // Fix: Safe setter for store visits
  const setStoreVisitValue = (userId: string, key: string, value: number) => {
    setPartnerMetrics(prev => {
      const current = prev[userId] || {};
      const currentStoreVisits = current.storeVisits || {};
      
      // Ensure we have a proper object
      const storeVisits = typeof currentStoreVisits === 'object' 
        ? { ...currentStoreVisits }
        : { today: 0, thisWeek: 0, thisMonth: 0, allTime: 0 };
      
      // Update the specific key
      const updatedStoreVisits = {
        ...storeVisits,
        [key]: value
      };
      
      // Cascade updates for today
      if (key === 'today') {
        const oldValue = storeVisits.today || 0;
        const difference = value - oldValue;
        
        updatedStoreVisits.thisWeek = (storeVisits.thisWeek || 0) + difference;
        updatedStoreVisits.thisMonth = (storeVisits.thisMonth || 0) + difference;
        updatedStoreVisits.allTime = (storeVisits.allTime || 0) + difference;
      }
      
      return {
        ...prev,
        [userId]: {
          ...current,
          storeVisits: updatedStoreVisits
        }
      };
    });
  };

  // Color helper function for consistent styling
  const getBadgeColor = (type: string, status?: string) => {
    if (type === 'user_type') {
      switch (status) {
        case 'admin':
          return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
        case 'partner':
          return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        default:
          return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      }
    } else if (type === 'partner_status') {
      switch (status) {
        case 'approved':
          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        case 'rejected':
        case 'suspended':
          return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        default:
          return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      }
    }
    return '';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || user.user_type === filterType;
    
    return matchesSearch && matchesType;
  });

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-10 animate-fade-in">
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl p-8 text-white shadow-lg">
            <h1 className="text-4xl font-bold mb-2">User Management</h1>
            <p className="text-amber-100/90 text-lg">Manage all users and their balances</p>
            <p className="text-amber-100/70 mt-1 text-sm">View, edit, and manage customer accounts, partner profiles, and admin access</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6 animate-fade-in hover:shadow-lg transition-shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🔍 Search Users
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by email, name, or phone..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:focus:ring-amber-400 dark:focus:border-amber-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🔎 Filter by Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as UserTypeEnum | 'all')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:focus:ring-amber-400 dark:focus:border-amber-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all"
              >
                <option value="all">👤 All Types</option>
                <option value="customer">🥇 Customers</option>
                <option value="partner">🏪 Partners</option>
                <option value="admin">⚙️ Admins</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={loadUsers}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                🔄 Refresh Users
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 animate-fade-in hover:shadow-lg transition-shadow hover:scale-105 transform">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-3 rounded-xl">
                <span className="text-2xl">👤</span>
              </div>
              <div className="text-blue-600 dark:text-blue-400 text-sm font-semibold">Total</div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Users</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{users.length}</div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-2xl shadow-md border border-amber-200 dark:border-amber-700/50 p-6 animate-fade-in hover:shadow-lg transition-shadow hover:scale-105 transform">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-amber-200 to-amber-300 dark:from-amber-600 dark:to-amber-500 p-3 rounded-xl">
                <span className="text-2xl">💰</span>
              </div>
              <div className="text-amber-600 dark:text-amber-400 text-sm font-semibold">Revenue</div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Balance</div>
            <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">
              ${Object.values(userBalances).reduce((sum, u) => sum + (u?.balance || 0), 0).toLocaleString()}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl shadow-md border border-green-200 dark:border-green-700/50 p-6 animate-fade-in hover:shadow-lg transition-shadow hover:scale-105 transform">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-green-200 to-green-300 dark:from-green-600 dark:to-green-500 p-3 rounded-xl">
                <span className="text-2xl">🏪</span>
              </div>
              <div className="text-green-600 dark:text-green-400 text-sm font-semibold">Partners</div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Partners</div>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">
              {users.filter(u => u.user_type === 'partner' && u.partner_status === 'approved').length}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-2xl shadow-md border border-yellow-200 dark:border-yellow-700/50 p-6 animate-fade-in hover:shadow-lg transition-shadow hover:scale-105 transform">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-yellow-200 to-yellow-300 dark:from-yellow-600 dark:to-yellow-500 p-3 rounded-xl">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="text-yellow-600 dark:text-yellow-400 text-sm font-semibold">Pending</div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Partners</div>
            <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">
              {users.filter(u => u.partner_status === 'pending').length}
            </div>
          </div>
        </div>

        {/* Users Table - FIXED with safe rendering */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in hover:shadow-lg transition-shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 dark:border-amber-400 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <span className="text-4xl mb-4 block">👤</span>
              <p className="text-gray-600 dark:text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      👤 User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      📊 Type & Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      💰 Wallet Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      📅 Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      ⚡ Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => {
                    const balance = userBalances[user.id];
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {safeRender(user.full_name) || 'No Name'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {safeRender(user.email)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {safeRender(user.phone) || 'No Phone'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getBadgeColor('user_type', user.user_type)}`}>
                              {user.user_type === 'admin' && '⚙️ '}
                              {user.user_type === 'partner' && '🏪 '}
                              {user.user_type === 'user' && '🥇 '}
                              {safeRender(user.user_type)}
                            </span>
                            {user.user_type === 'partner' && (
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getBadgeColor('partner_status', user.partner_status)}`}>
                                {user.partner_status === 'approved' && '✅ '}
                                {user.partner_status === 'pending' && '⚠️ '}
                                {user.partner_status === 'rejected' && '❌ '}
                                {user.partner_status === 'suspended' && '🚫 '}
                                {safeRender(user.partner_status)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            ${(balance?.balance || 0).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Balance: ${(balance?.balance || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserModal(true);
                              }}
                              className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 text-left font-medium flex items-center gap-1 transition-colors"
                            >
                              ✏️ Edit Info
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowBalanceModal(true);
                              }}
                              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-left font-medium flex items-center gap-1 transition-colors"
                            >
                              💰 Adjust Balance
                            </button>
                            {user.user_type === 'partner' && (
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowPartnerMetricsModal(true);
                                }}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-left font-medium flex items-center gap-1 transition-colors"
                              >
                                📊 Partner Metrics
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete user ${user.email}?`)) {
                                  setSelectedUser(user);
                                  // TODO: Implement actual delete functionality
                                  console.log('Delete user:', user.id);
                                }
                              }}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-left font-medium flex items-center gap-1 transition-colors"
                            >
                              🗑️ Delete User
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ... rest of your modals (Edit User Modal, Balance Update Modal, Partner Metrics Modal) ... */}
    </AdminLayout>
  );
}