import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase/client';
import { User as UserType, UserType as UserTypeEnum, PartnerStatus } from '../../lib/types/database';
import { NotificationService } from '../../lib/supabase/notification-service';
import AdminLayout from '../../components/Admin/AdminLayout';
import ThemeSwitcher from '../../components/ThemeSwitcher';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

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
              metricsMap[partner.user_id] = {
                storeVisits: {
                  today: partner.store_visits?.today || Math.floor(Math.random() * 100) + 50,
                  thisWeek: partner.store_visits?.thisWeek || Math.floor(Math.random() * 500) + 200,
                  thisMonth: partner.store_visits?.thisMonth || Math.floor(Math.random() * 2000) + 800,
                  lastMonth: partner.store_visits?.lastMonth || Math.floor(Math.random() * 1800) + 700,
                  allTime: partner.store_visits?.allTime || Math.floor(Math.random() * 10000) + 5000
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

  const updateUser = async (userId: string) => {
    console.log('Updating user:', userId);
    
    try {
      // Update users table
      const { error: userError } = await supabase
        .from('users')
        .update({
          full_name: editForm.full_name,
          phone: editForm.phone,
          user_type: editForm.user_type,
          partner_status: editForm.partner_status,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (userError) throw userError;

      // If user is a partner, also update partner_profiles table
      if (editForm.user_type === 'partner') {
        console.log('Updating partner_profiles for user:', userId);
        
        // First try to update existing record
        const { error: partnerError, data: partnerData } = await supabase
          .from('partner_profiles')
          .update({
            partner_status: editForm.partner_status,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select();

        // If no record exists (0 rows affected), create one
        if (!partnerError && partnerData && partnerData.length === 0) {
          console.log('No partner profile found, creating new one...');
          const { error: insertError } = await supabase
            .from('partner_profiles')
            .insert({
              user_id: userId,
              store_name: editForm.full_name || 'Store #' + userId,
              store_slug: (editForm.full_name || 'Store').toLowerCase().replace(/\s+/g, '-'),
              partner_status: editForm.partner_status,
              commission_rate: 0.10,
              total_earnings: 0.00,
              pending_balance: 0.00,
              total_balance: 0.00,
              total_orders: 0,
              rating: 0.00,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          console.log('Partner profile insert result:', { insertError });
        }

        if (partnerError) {
          console.error('Error updating partner profile:', partnerError);
        }
      }

      // Send notification to partner about status change
      if (editForm.user_type === 'partner' && editForm.partner_status !== selectedUser?.partner_status) {
        await NotificationService.notifyPartnerStatusChanged(
          userId,
          editForm.partner_status
        );
      }

      setShowUserModal(false);
      setTimeout(() => {
        loadUsers();
      }, 500);
      alert('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const updateUserBalance = async () => {
    if (!balanceUpdate.userId || balanceUpdate.amount <= 0) {
      alert('Please enter valid amount');
      return;
    }

    try {
      const currentBalance = userBalances[balanceUpdate.userId]?.balance || 0;
      const newAmount = balanceUpdate.type === 'add' 
        ? currentBalance + balanceUpdate.amount
        : currentBalance - balanceUpdate.amount;

      if (newAmount < 0) {
        alert('Cannot set negative balance');
        return;
      }

      const { error: balanceError } = await supabase
        .from('wallet_balances')
        .upsert({
          user_id: balanceUpdate.userId,
          balance: newAmount,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (balanceError) throw balanceError;

      // Send notification to user about balance update
      await NotificationService.notifyBalanceUpdated(
        balanceUpdate.userId, 
        balanceUpdate.amount, 
        balanceUpdate.type
      );

      setShowBalanceModal(false);
      setBalanceUpdate({ userId: '', amount: 0, type: 'add', reason: '' });
      loadUsers();
      alert(`Balance ${balanceUpdate.type === 'add' ? 'added' : 'subtracted'} successfully!`);
    } catch (error) {
      console.error('Error updating balance:', error);
      alert('Failed to update balance');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      // First, delete user-related data from all tables
      const { error: walletError } = await supabase
        .from('wallet_balances')
        .delete()
        .eq('user_id', userId);

      if (walletError) {
        console.error('Error deleting wallet balance:', walletError);
      }

      const { error: transactionsError } = await supabase
        .from('wallet_transactions')
        .delete()
        .eq('user_id', userId);

      if (transactionsError) {
        console.error('Error deleting wallet transactions:', transactionsError);
      }

      const { error: partnerError } = await supabase
        .from('partner_profiles')
        .delete()
        .eq('user_id', userId);

      if (partnerError) {
        console.error('Error deleting partner profile:', partnerError);
      }

      // Delete user's orders
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .or(`customer_id.eq.${userId},partner_id.eq.${userId}`);

      if (ordersError) {
        console.error('Error deleting orders:', ordersError);
      }

      // Finally, delete the user from the users table
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      loadUsers();
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const openUserModal = (user: UserType) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || '',
      phone: user.phone || '',
      user_type: user.user_type,
      partner_status: user.partner_status
    });
    setShowUserModal(true);
  };

  const openPartnerMetricsModal = async (user: UserType) => {
    setSelectedUser(user);
    
    // Fetch current partner metrics from database
    try {
      const { data: partnerProfile, error } = await supabase
        .from('partner_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error fetching partner profile:', error);
      }

      if (partnerProfile) {
        // Update local state with database values
        setPartnerMetrics(prev => ({
          ...prev,
          [user.id]: {
            storeVisits: partnerProfile.store_visits || {
              today: 0,
              thisWeek: 0,
              thisMonth: 0,
              allTime: 0
            },
            storeCreditScore: partnerProfile.store_credit_score || 750,
            storeRating: partnerProfile.store_rating || 0,
            totalProducts: partnerProfile.total_products || 0,
            activeProducts: partnerProfile.active_products || 0,
            commissionRate: partnerProfile.commission_rate || 0.10,
            isVerified: partnerProfile.is_verified || false,
            isActive: partnerProfile.is_active !== false // default to true
          }
        }));
      }
    } catch (error) {
      console.error('Error loading partner metrics:', error);
    }
    
    setShowPartnerMetricsModal(true);
  };

  const updatePartnerMetrics = async (userId: string, metrics: any) => {
    try {
      setSavingMetrics(userId);
      console.log('Updating partner metrics for user:', userId);
      
      // Build update object
      const updateData: any = {
        store_visits: metrics.storeVisits || {
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          allTime: 0
        },
        store_credit_score: metrics.storeCreditScore || 750,
        store_rating: metrics.storeRating || 0,
        total_products: metrics.totalProducts || 0,
        active_products: metrics.activeProducts || 0,
        commission_rate: metrics.commissionRate || 0.10,
        is_verified: metrics.isVerified || false,
        is_active: metrics.isActive !== false,
        updated_at: new Date().toISOString()
      };
      
      console.log('Updating partner metrics with data:', updateData);
      
      const { error: updateError } = await supabase
        .from('partner_profiles')
        .update(updateData)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      // Update local state immediately
      setPartnerMetrics(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          ...metrics
        }
      }));

      setTimeout(() => {
        setSavingMetrics(null);
        setShowPartnerMetricsModal(false);
        alert('✅ Partner metrics updated successfully!');
      }, 500);
    } catch (error: any) {
      console.error('Error updating partner metrics:', error);
      setSavingMetrics(null);
      alert(`❌ Failed to update partner metrics: ${error.message || 'Unknown error'}`);
    }
  };

  const calculateVisitsPerUnit = (totalVisits: number, timePeriod: 'hour' | 'minute' | 'second') => {
    const totalUnits = 24; // 24 hours
    const unitsPerPeriod = timePeriod === 'hour' ? 1 : 
                          timePeriod === 'minute' ? 60 : 
                          3600; // seconds per hour
    
    const totalPeriods = totalUnits * unitsPerPeriod;
    const visitsPerUnit = totalVisits / totalPeriods;
    
    // Return the exact value for precise distribution, not rounded down
    return visitsPerUnit;
  };

  const startVisitDistribution = async (userId: string, totalVisits: number, timePeriod: 'hour' | 'minute' | 'second') => {
    const visitsPerUnit = calculateVisitsPerUnit(totalVisits, timePeriod);
    
    if (visitsPerUnit <= 0) {
      alert('Invalid configuration: Visits per unit must be greater than 0');
      return;
    }

    // Calculate end time (24 hours from now)
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + (24 * 60 * 60 * 1000)); // 24 hours from now

    // Create distribution record in database
    try {
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
      const newDistribution = {
        totalVisits,
        timePeriod,
        visitsPerUnit,
        isActive: true,
        lastDistribution: startTime.toISOString(),
        totalDistributed: 0,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      };
      
      setVisitDistribution(prev => ({
        ...prev,
        [userId]: newDistribution
      }));

      // Start the distribution process
      startDistributionTimer(userId, newDistribution);
      
      alert(`✅ Automatic visit distribution started: ${totalVisits} visits over 24 hours (${visitsPerUnit.toFixed(4)} visits per ${timePeriod})`);
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
      
      alert('✅ Automatic visit distribution stopped');
    } catch (error) {
      console.error('Error stopping visit distribution:', error);
      alert('❌ Failed to stop visit distribution');
    }
  };

  const startDistributionTimer = (userId: string, config: any) => {
    const intervalMs = config.timePeriod === 'hour' ? 60 * 60 * 1000 : 
                       config.timePeriod === 'minute' ? 60 * 1000 : 
                       1000; // seconds

    // Track accumulated fractional visits
    let accumulatedVisits = 0;

    const timer = setInterval(async () => {
      try {
        // Add fractional visits to accumulator
        accumulatedVisits += config.visitsPerUnit;
        
        // Only add whole visits to the store
        const wholeVisitsToAdd = Math.floor(accumulatedVisits);
        
        if (wholeVisitsToAdd > 0) {
          // Subtract the whole visits from accumulator
          accumulatedVisits -= wholeVisitsToAdd;
          
          // Add visits to partner store
          const currentMetrics = partnerMetrics[userId];
          if (currentMetrics) {
            const updatedVisits = {
              ...currentMetrics.storeVisits,
              today: (currentMetrics.storeVisits.today || 0) + wholeVisitsToAdd,
              thisWeek: (currentMetrics.storeVisits.thisWeek || 0) + wholeVisitsToAdd,
              thisMonth: (currentMetrics.storeVisits.thisMonth || 0) + wholeVisitsToAdd,
              allTime: (currentMetrics.storeVisits.allTime || 0) + wholeVisitsToAdd
            };

            // Update local state
            setPartnerMetrics(prev => ({
              ...prev,
              [userId]: {
                ...prev[userId],
                storeVisits: updatedVisits
              }
            }));

            // Update database
            await supabase
              .from('partner_profiles')
              .update({
                store_visits: updatedVisits,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', userId);

            console.log(`Added ${wholeVisitsToAdd} visits to partner ${userId} (accumulated: ${accumulatedVisits.toFixed(4)})`);
          }
        }
      } catch (error) {
        console.error('Error in distribution timer:', error);
      }
    }, intervalMs);

    // Store timer reference for cleanup
    (window as any).visitDistributionTimers = (window as any).visitDistributionTimers || {};
    (window as any).visitDistributionTimers[userId] = timer;
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || user.user_type === filterType;
    
    return matchesSearch && matchesType;
  });

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
                📋 Filter by Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as UserTypeEnum | 'all')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:focus:ring-amber-400 dark:focus:border-amber-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all"
              >
                <option value="all">👥 All Types</option>
                <option value="customer">🛒 Customers</option>
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
                <span className="text-2xl">👥</span>
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
                <span className="text-2xl">⏳</span>
              </div>
              <div className="text-yellow-600 dark:text-yellow-400 text-sm font-semibold">Pending</div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Partners</div>
            <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">
              {users.filter(u => u.partner_status === 'pending').length}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in hover:shadow-lg transition-shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 dark:border-amber-400 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <span className="text-4xl mb-4 block">👥</span>
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
                              {user.full_name || 'No Name'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {user.email}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {user.phone || 'No Phone'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getBadgeColor('user_type', user.user_type)}`}>
                              {user.user_type === 'admin' && '⚙️ '}
                              {user.user_type === 'partner' && '🏪 '}
                              {user.user_type === 'user' && '🛒 '}
                              {user.user_type}
                            </span>
                            {user.user_type === 'partner' && (
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getBadgeColor('partner_status', user.partner_status)}`}>
                                {user.partner_status === 'approved' && '✅ '}
                                {user.partner_status === 'pending' && '⏳ '}
                                {user.partner_status === 'rejected' && '❌ '}
                                {user.partner_status === 'suspended' && '🚫 '}
                                {user.partner_status}
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
                              onClick={() => openUserModal(user)}
                              className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 text-left font-medium flex items-center gap-1 transition-colors"
                            >
                              ✏️ Edit Info
                            </button>
                            <button
                              onClick={() => openBalanceModal(user)}
                              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-left font-medium flex items-center gap-1 transition-colors"
                            >
                              💰 Adjust Balance
                            </button>
                            {user.user_type === 'partner' && (
                              <button
                                onClick={() => openPartnerMetricsModal(user)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-left font-medium flex items-center gap-1 transition-colors"
                              >
                                📊 Partner Metrics
                              </button>
                            )}
                            <button
                              onClick={() => deleteUser(user.id)}
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
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Edit User: {selectedUser.email}
                </h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    User Type
                  </label>
                  <select
                    value={editForm.user_type}
                    onChange={(e) => setEditForm({...editForm, user_type: e.target.value as UserTypeEnum})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  >
                    <option value="customer">Customer</option>
                    <option value="partner">Partner</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {editForm.user_type === 'partner' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Partner Status
                    </label>
                    <select
                      value={editForm.partner_status}
                      onChange={(e) => setEditForm({...editForm, partner_status: e.target.value as PartnerStatus})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateUser(selectedUser.id)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balance Update Modal */}
      {showBalanceModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Adjust Balance: {selectedUser.email}
                </h2>
                <button
                  onClick={() => setShowBalanceModal(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Current Balance</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${(userBalances[selectedUser.id]?.balance || 0).toFixed(2)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Action
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={balanceUpdate.type === 'add'}
                        onChange={() => setBalanceUpdate({...balanceUpdate, type: 'add'})}
                        className="mr-2"
                      />
                      <span className="text-green-600 dark:text-green-400">Add Funds</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={balanceUpdate.type === 'subtract'}
                        onChange={() => setBalanceUpdate({...balanceUpdate, type: 'subtract'})}
                        className="mr-2"
                      />
                      <span className="text-red-600 dark:text-red-400">Subtract Funds</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
                    <input
                      type="number"
                      value={balanceUpdate.amount}
                      onChange={(e) => setBalanceUpdate({...balanceUpdate, amount: parseFloat(e.target.value) || 0})}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reason for Adjustment
                  </label>
                  <textarea
                    value={balanceUpdate.reason}
                    onChange={(e) => setBalanceUpdate({...balanceUpdate, reason: e.target.value})}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    placeholder="Explain why you're adjusting this balance..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    onClick={() => setShowBalanceModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateUserBalance}
                    className={`px-4 py-2 rounded-lg text-white transition-colors ${
                      balanceUpdate.type === 'add' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {balanceUpdate.type === 'add' ? 'Add Funds' : 'Subtract Funds'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Partner Metrics Modal */}
      {showPartnerMetricsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Partner Metrics: {selectedUser.full_name || selectedUser.email}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Manage partner performance metrics and analytics
                  </p>
                </div>
                <button
                  onClick={() => setShowPartnerMetricsModal(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading partner metrics...</p>
                </div>
              )}

              {/* Error State */}
              {!loading && !partnerMetrics[selectedUser.id] && (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Unable to load partner metrics</p>
                  <button
                    onClick={loadUsers}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 mx-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              )}

              {/* Main Content */}
              {!loading && partnerMetrics[selectedUser.id] && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Store Visits Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          Store Visits
                        </h3>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                          Auto-calculated
                        </span>
                      </div>
                      <div className="space-y-3">
                        {/* Today's Visits - Manual Input */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Today's Visits
                            </label>
                            <span className="text-xs text-gray-500">Manual Input</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            value={partnerMetrics[selectedUser.id]?.storeVisits?.today || 0}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              const currentMetrics = partnerMetrics[selectedUser.id];
                              
                              // Calculate week/month based on today's change
                              const todayChange = value - (currentMetrics.storeVisits?.today || 0);
                              
                              setPartnerMetrics(prev => ({
                                ...prev,
                                [selectedUser.id]: {
                                  ...prev[selectedUser.id],
                                  storeVisits: {
                                    today: value,
                                    thisWeek: (prev[selectedUser.id]?.storeVisits?.thisWeek || 0) + todayChange,
                                    thisMonth: (prev[selectedUser.id]?.storeVisits?.thisMonth || 0) + todayChange,
                                    allTime: (prev[selectedUser.id]?.storeVisits?.allTime || 0) + todayChange
                                  }
                                }
                              }));
                            }}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>

                        {/* Auto-calculated Periods */}
                        <div className="space-y-2">
                          {[
                            { label: 'This Week', key: 'thisWeek' },
                            { label: 'This Month', key: 'thisMonth' },
                            { label: 'All Time', key: 'allTime' }
                          ].map(({ label, key }) => (
                            <div key={key} className="relative">
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {label}
                                </label>
                                <span className="text-xs text-gray-500">Auto-calculated</span>
                              </div>
                              <input
                                type="number"
                                readOnly
                                value={partnerMetrics[selectedUser.id]?.storeVisits?.[key] || 0}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent dark:via-gray-800/5 rounded-lg pointer-events-none" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Store Performance Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Store Performance
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {/* Database-fetched Fields */}
                        {[
                          { 
                            label: 'Store Credit Score', 
                            key: 'storeCreditScore', 
                            icon: <Award className="w-4 h-4" />,
                            max: 1000 
                          },
                          { 
                            label: 'Store Rating', 
                            key: 'storeRating', 
                            icon: <Star className="w-4 h-4" />,
                            max: 5,
                            step: 0.1 
                          }
                        ].map(({ label, key, icon, max, step = 1 }) => (
                          <div key={key}>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                {icon}
                                {label}
                              </label>
                              <span className="text-xs text-gray-500">Fetched from database</span>
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                readOnly
                                min="0"
                                max={max}
                                step={step}
                                value={partnerMetrics[selectedUser.id]?.[key] || 0}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent dark:via-gray-800/5 rounded-lg pointer-events-none" />
                            </div>
                          </div>
                        ))}

                        {/* Commission Rate - Manual Input */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              Commission Rate
                            </label>
                            <span className="text-xs text-gray-500">Manual Input</span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={((partnerMetrics[selectedUser.id]?.commissionRate || 0) * 100).toFixed(2)}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                setPartnerMetrics(prev => ({
                                  ...prev,
                                  [selectedUser.id]: {
                                    ...prev[selectedUser.id],
                                    commissionRate: value / 100
                                  }
                                }));
                              }}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-10"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Products Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Package className="w-5 h-5" />
                          Products
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {[
                          { label: 'Total Products', key: 'totalProducts' },
                          { label: 'Active Products', key: 'activeProducts' }
                        ].map(({ label, key }) => (
                          <div key={key}>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {label}
                              </label>
                              <span className="text-xs text-gray-500">Fetched from database</span>
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                readOnly
                                min="0"
                                value={partnerMetrics[selectedUser.id]?.[key] || 0}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent dark:via-gray-800/5 rounded-lg pointer-events-none" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Settings className="w-5 h-5" />
                          Status & Settings
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {/* Status Toggles */}
                        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Verified Partner
                                </label>
                                <p className="text-xs text-gray-500">Manual toggle</p>
                              </div>
                            </div>
                            <Switch
                              checked={partnerMetrics[selectedUser.id]?.isVerified || false}
                              onCheckedChange={(checked) => {
                                setPartnerMetrics(prev => ({
                                  ...prev,
                                  [selectedUser.id]: {
                                    ...prev[selectedUser.id],
                                    isVerified: checked
                                  }
                                }));
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Active Partner
                                </label>
                                <p className="text-xs text-gray-500">Manual toggle</p>
                              </div>
                            </div>
                            <Switch
                              checked={partnerMetrics[selectedUser.id]?.isActive !== false}
                              onCheckedChange={(checked) => {
                                setPartnerMetrics(prev => ({
                                  ...prev,
                                  [selectedUser.id]: {
                                    ...prev[selectedUser.id],
                                    isActive: checked
                                  }
                                }));
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Auto-save indicator */}
                  {savingMetrics === selectedUser.id && (
                    <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                        <span className="text-sm text-blue-700 dark:text-blue-300">
                          Saving changes to database...
                        </span>
                      </div>
                      <span className="text-xs text-blue-600 dark:text-blue-400 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded">
                        Real-time
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setShowPartnerMetricsModal(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        const metrics = partnerMetrics[selectedUser.id];
                        if (metrics) {
                          updatePartnerMetrics(selectedUser.id, metrics);
                        }
                      }}
                      disabled={savingMetrics === selectedUser.id}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      {savingMetrics === selectedUser.id ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Update All Changes
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}