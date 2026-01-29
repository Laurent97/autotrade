import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase/client';
import { User as UserType, UserType as UserTypeEnum, PartnerStatus } from '../../lib/types/database';
import { NotificationService } from '../../lib/supabase/notification-service';
import { getPartnerProductsWithDetails } from '../../services/partnerProductsService';
import AdminLayout from '../../components/Admin/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  // Populate edit form when user is selected
  useEffect(() => {
    if (selectedUser) {
      setEditForm({
        full_name: selectedUser.full_name || '',
        phone: selectedUser.phone || '',
        user_type: selectedUser.user_type || 'user',
        partner_status: selectedUser.partner_status || 'pending'
      });
      setBalanceUpdate(prev => ({
        ...prev,
        userId: selectedUser.id
      }));
    }
  }, [selectedUser]);

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

  const openBalanceModal = (user: UserType) => {
    setSelectedUser(user);
    setBalanceUpdate({
      userId: user.id,
      amount: 0,
      type: 'add',
      reason: ''
    });
    setShowBalanceModal(true);
  };

  const manuallyAddVisits = async (userId: string, visitsToAdd: number) => {
    try {
      // Insert visits into the store_visits table
      const visitRecords = Array.from({ length: visitsToAdd }, (_, i) => ({
        partner_id: userId,
        visitor_id: `manual_${Date.now()}_${i}`,
        page_visited: '/store',
        session_duration: Math.floor(Math.random() * 300) + 60, // 1-5 minutes
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('store_visits')
        .insert(visitRecords);

      if (error) throw error;

      // Refresh the data to show updated counts
      await loadUsers();
      
      alert(`✅ Added ${visitsToAdd} visits successfully!`);
    } catch (error) {
      console.error('Error adding visits:', error);
      alert(`❌ Failed to add visits: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const startVisitDistribution = async (userId: string, totalVisits: number, timePeriod: 'hour' | 'minute' | 'second') => {
    const visitsPerUnit = totalVisits / 24; // Default to 24 hours distribution
    
    try {
      // Create distribution record in database
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + (24 * 60 * 60 * 1000)); // 24 hours from now

      const { data: distributionData, error } = await supabase
        .from('visit_distribution')
        .insert({
          partner_id: userId,
          total_visits: totalVisits,
          time_period: timePeriod,
          visits_per_unit: visitsPerUnit,
          is_active: true,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          total_distributed: 0,
          last_distribution: startTime.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setVisitDistribution(prev => ({
        ...prev,
        [userId]: {
          totalVisits,
          timePeriod,
          visitsPerUnit,
          isActive: true,
          lastDistribution: startTime.toISOString(),
          totalDistributed: 0,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        }
      }));

      // Start the distribution process
      startDistributionTimer(userId, {
        totalVisits,
        timePeriod,
        visitsPerUnit,
        isActive: true,
        lastDistribution: startTime.toISOString(),
        totalDistributed: 0,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });
      
      alert(`✅ Started distributing ${totalVisits} visits over 24 hours (${visitsPerUnit.toFixed(2)} visits per ${timePeriod})`);
    } catch (error) {
      console.error('Error starting visit distribution:', error);
      alert('❌ Failed to start visit distribution');
    }
  };

  const stopVisitDistribution = async (userId: string) => {
    try {
      // Update database to stop distribution
      const { error } = await supabase
        .from('visit_distribution')
        .update({
          is_active: false,
          end_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('partner_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      // Update local state
      setVisitDistribution(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          isActive: false,
          endTime: new Date().toISOString()
        }
      }));

      // Stop the timer
      if ((window as any).visitDistributionTimers && (window as any).visitDistributionTimers[userId]) {
        clearInterval((window as any).visitDistributionTimers[userId]);
        delete (window as any).visitDistributionTimers[userId];
      }
      
      alert('✅ Visit distribution stopped');
    } catch (error) {
      console.error('Error stopping visit distribution:', error);
      alert('❌ Failed to stop visit distribution');
    }
  };

  const startDistributionTimer = (userId: string, config: any) => {
    const intervalMs = config.timePeriod === 'hour' ? 60 * 60 * 1000 : 
                       config.timePeriod === 'minute' ? 60 * 1000 : 
                       1000; // seconds

    let accumulatedVisits = 0;
    let totalDistributed = config.totalDistributed || 0;

    const timer = setInterval(async () => {
      try {
        accumulatedVisits += config.visitsPerUnit;
        
        const wholeVisitsToAdd = Math.floor(accumulatedVisits);
        
        if (wholeVisitsToAdd > 0) {
          accumulatedVisits -= wholeVisitsToAdd;
          totalDistributed += wholeVisitsToAdd;
          
          // Insert visits into store_visits table
          const visitRecords = Array.from({ length: wholeVisitsToAdd }, (_, i) => ({
            partner_id: userId,
            visitor_id: `auto_${Date.now()}_${i}`,
            page_visited: '/store',
            session_duration: Math.floor(Math.random() * 300) + 60,
            created_at: new Date().toISOString()
          }));

          await supabase
            .from('store_visits')
            .insert(visitRecords);

          // Update distribution tracking
          await supabase
            .from('visit_distribution')
            .update({
              total_distributed: totalDistributed,
              last_distribution: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('partner_id', userId)
            .eq('is_active', true);

          // Update local state
          setVisitDistribution(prev => ({
            ...prev,
            [userId]: {
              ...prev[userId],
              totalDistributed: totalDistributed,
              lastDistribution: new Date().toISOString()
            }
          }));

          console.log(`Added ${wholeVisitsToAdd} visits to partner ${userId} (Total: ${totalDistributed})`);
        }
        
        if (totalDistributed >= config.totalVisits) {
          clearInterval(timer);
          await supabase
            .from('visit_distribution')
            .update({
              is_active: false,
              end_time: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('partner_id', userId);
          
          setVisitDistribution(prev => ({
            ...prev,
            [userId]: {
              ...prev[userId],
              isActive: false,
              endTime: new Date().toISOString()
            }
          }));
          
          console.log(`Distribution completed for partner ${userId}. Total: ${totalDistributed}`);
        }
      } catch (error) {
        console.error('Error in distribution timer:', error);
      }
    }, intervalMs);

    // Store timer reference for cleanup
    (window as any).visitDistributionTimers = (window as any).visitDistributionTimers || {};
    (window as any).visitDistributionTimers[userId] = timer;
  };

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

      {/* Edit User Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User Information</DialogTitle>
            <DialogDescription>
              Update the user's details and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">
                Full Name
              </Label>
              <Input
                id="full_name"
                value={editForm.full_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user_type" className="text-right">
                User Type
              </Label>
              <Select value={editForm.user_type} onValueChange={(value: UserTypeEnum) => setEditForm(prev => ({ ...prev, user_type: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Customer</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editForm.user_type === 'partner' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="partner_status" className="text-right">
                  Partner Status
                </Label>
                <Select value={editForm.partner_status} onValueChange={(value: PartnerStatus) => setEditForm(prev => ({ ...prev, partner_status: value }))}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowUserModal(false)}>
              Cancel
            </Button>
            <Button onClick={async () => {
              if (!selectedUser) return;
              try {
                const { error } = await supabase
                  .from('users')
                  .update({
                    full_name: editForm.full_name,
                    phone: editForm.phone,
                    user_type: editForm.user_type,
                    partner_status: editForm.user_type === 'partner' ? editForm.partner_status : null
                  })
                  .eq('id', selectedUser.id);
                
                if (error) throw error;
                
                await loadUsers();
                setShowUserModal(false);
              } catch (error) {
                console.error('Error updating user:', error);
              }
            }}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Balance Update Modal */}
      <Dialog open={showBalanceModal} onOpenChange={setShowBalanceModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adjust User Balance</DialogTitle>
            <DialogDescription>
              Add or subtract funds from the user's wallet balance.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                value={balanceUpdate.amount}
                onChange={(e) => setBalanceUpdate(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select value={balanceUpdate.type} onValueChange={(value: 'add' | 'subtract') => setBalanceUpdate(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Funds</SelectItem>
                  <SelectItem value="subtract">Subtract Funds</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Reason
              </Label>
              <Input
                id="reason"
                value={balanceUpdate.reason}
                onChange={(e) => setBalanceUpdate(prev => ({ ...prev, reason: e.target.value }))}
                className="col-span-3"
                placeholder="Reason for adjustment"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBalanceModal(false)}>
              Cancel
            </Button>
            <Button onClick={async () => {
              if (!selectedUser) return;
              try {
                const currentBalance = userBalances[selectedUser.id]?.balance || 0;
                const newBalance = balanceUpdate.type === 'add' 
                  ? currentBalance + balanceUpdate.amount
                  : currentBalance - balanceUpdate.amount;

                const { error } = await supabase
                  .from('wallet_balances')
                  .upsert({
                    user_id: selectedUser.id,
                    balance: newBalance,
                    currency: 'USD',
                    updated_at: new Date().toISOString()
                  }, {
                    onConflict: 'user_id'
                  });
                
                if (error) throw error;
                
                await loadUsers();
                setShowBalanceModal(false);
              } catch (error) {
                console.error('Error updating balance:', error);
              }
            }}>
              Update Balance
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Partner Metrics Modal */}
      <Dialog open={showPartnerMetricsModal} onOpenChange={setShowPartnerMetricsModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Partner Metrics</DialogTitle>
            <DialogDescription>
              View detailed performance metrics for this partner.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && partnerMetrics[selectedUser.id] && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Store Visits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {partnerMetrics[selectedUser.id]?.storeVisits?.allTime || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Store Rating</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {partnerMetrics[selectedUser.id]?.storeRating || 0} ⭐
                    </div>
                    <p className="text-xs text-muted-foreground">Out of 5</p>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {partnerMetrics[selectedUser.id]?.totalProducts || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {partnerMetrics[selectedUser.id]?.activeProducts || 0} active
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Credit Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {partnerMetrics[selectedUser.id]?.storeCreditScore || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Store credit</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Visit Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Today:</span>
                      <span>{partnerMetrics[selectedUser.id]?.storeVisits?.today || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>This Week:</span>
                      <span>{partnerMetrics[selectedUser.id]?.storeVisits?.thisWeek || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>This Month:</span>
                      <span>{partnerMetrics[selectedUser.id]?.storeVisits?.thisMonth || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Manual Visit Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Number of visits"
                        min="1"
                        max="10000"
                        className="flex-1"
                        id="visitsToAdd"
                      />
                      <Button
                        onClick={() => {
                          const input = document.getElementById('visitsToAdd') as HTMLInputElement;
                          const visitsToAdd = parseInt(input?.value || '0');
                          if (visitsToAdd > 0 && selectedUser) {
                            manuallyAddVisits(selectedUser.id, visitsToAdd);
                            input.value = '';
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Visits
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Manually add visits to the store_visits table for this partner
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Visit Distribution */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Visit Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Total visits"
                        min="1"
                        max="50000"
                        className="col-span-1"
                        id="totalVisits"
                      />
                      <Input
                        type="number"
                        placeholder="Hours"
                        min="1"
                        max="168"
                        className="col-span-1"
                        id="distributionHours"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Select defaultValue="hour">
                        <SelectTrigger className="col-span-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hour">Per Hour</SelectItem>
                          <SelectItem value="minute">Per Minute</SelectItem>
                          <SelectItem value="second">Per Second</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => {
                          const totalVisitsInput = document.getElementById('totalVisits') as HTMLInputElement;
                          const hoursInput = document.getElementById('distributionHours') as HTMLInputElement;
                          const totalVisits = parseInt(totalVisitsInput?.value || '0');
                          const hours = parseInt(hoursInput?.value || '0');
                          
                          if (totalVisits > 0 && hours > 0 && selectedUser) {
                            startVisitDistribution(selectedUser.id, totalVisits, 'hour');
                            totalVisitsInput.value = '';
                            hoursInput.value = '';
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 col-span-2"
                        size="sm"
                      >
                        <Activity className="w-4 h-4 mr-1" />
                        Start Distribution
                      </Button>
                    </div>
                    {visitDistribution[selectedUser.id]?.isActive && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-green-700 dark:text-green-300">
                            🔄 Active: {visitDistribution[selectedUser.id].visitsPerUnit.toFixed(2)} visits/hour
                          </span>
                          <Button
                            onClick={() => selectedUser && stopVisitDistribution(selectedUser.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Stop
                          </Button>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Distribute visits over time (e.g., 1000 visits over 10 hours = 100 visitors/hour)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowPartnerMetricsModal(false)} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}