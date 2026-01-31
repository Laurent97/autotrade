import { useState, useEffect, useCallback } from 'react';
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
import DashboardHeader from '../../components/Partner/DashboardHeader';
import StatsGrid from '../../components/Partner/StatsGrid';
import { 
  Store,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Default stats structure to avoid repetition
const DEFAULT_STATS = {
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
  commissionRate: 10
};

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { isDark } = useTheme();
  
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(DEFAULT_STATS);

  // Check authentication and authorization
  const checkAccess = useCallback(() => {
    if (!user) {
      navigate('/auth', { state: { from: '/partner/dashboard' } });
      return false;
    }

    const userType = userProfile?.user_type || 'user';
    
    if (userType === 'admin') {
      navigate('/admin');
      return false;
    }
    
    if (userType !== 'partner') {
      navigate('/partner/register');
      return false;
    }

    if (userProfile?.partner_status !== 'approved') {
      navigate('/partner/pending');
      return false;
    }

    return true;
  }, [user, userProfile, navigate]);

  // Calculate pending balance from transactions
  const calculatePendingBalance = useCallback((transactions: any[]) => {
    return transactions?.reduce((sum, transaction) => {
      if (transaction.type === 'deposit' || transaction.type === 'commission' || transaction.type === 'bonus') {
        return sum + transaction.amount;
      }
      return sum;
    }, 0) || 0;
  }, []);

  // Load partner data
  const loadPartnerData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Load partner profile
      const { data: partnerData, error: partnerError } = await partnerService.getPartnerProfile(user.id);
      
      if (partnerError) {
        console.warn('Partner profile not found:', partnerError);
        setPartner(null);
      } else {
        setPartner(partnerData);
      }

      if (partnerData) {
        // Load partner analytics
        const { success, data: partnerStats } = await partnerService.getPartnerStats(partnerData.id);
        
        if (success && partnerStats) {
          setStats({
            ...DEFAULT_STATS,
            totalSales: partnerStats.totalSales || 0,
            pendingOrders: partnerStats.pendingOrders || 0,
            totalEarnings: partnerStats.totalEarnings || 0,
            conversionRate: partnerStats.conversionRate || 0,
            averageOrderValue: partnerStats.averageOrderValue || 0,
            totalOrders: partnerStats.totalOrders || 0,
            storeVisits: partnerStats.storeVisits || {
              today: 0,
              thisWeek: 0,
              thisMonth: 0,
              lastMonth: 0,
              allTime: 0
            },
            storeCreditScore: partnerStats.storeCreditScore || 750,
            storeRating: partnerStats.storeRating || 0,
            totalProducts: partnerStats.totalProducts || 0,
            activeProducts: partnerStats.activeProducts || 0,
            walletBalance: partnerStats.availableBalance || 0,
            pendingBalance: partnerStats.pendingBalance || 0,
            monthlyRevenue: partnerStats.thisMonthRevenue || 0,
            lastMonthRevenue: partnerStats.lastMonthRevenue || 0,
            commissionRate: partnerStats.commissionRate || 10
          });
        }
      } else {
        setStats(DEFAULT_STATS);
      }
    } catch (error) {
      console.error('Failed to load partner data:', error);
      setStats(DEFAULT_STATS);
    } finally {
      setLoading(false);
    }
  }, [user, calculatePendingBalance]);

  const refreshData = async () => {
    setRefreshing(true);
    await loadPartnerData();
    setRefreshing(false);
  };

  useEffect(() => {
    if (checkAccess()) {
      loadPartnerData();
    }
  }, [checkAccess, loadPartnerData]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
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
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🏪</div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Partner Profile Not Found
            </h2>
            <p className="text-muted-foreground mb-6">
              Please complete your partner registration to access the dashboard.
            </p>
            <Button
              onClick={() => navigate('/partner/register')}
              className="bg-primary hover:bg-primary/90"
            >
              Complete Registration
            </Button>
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
        {/* Dashboard Header */}
        <DashboardHeader
          partner={partner}
          userProfile={userProfile}
          storeName={partner?.store_name || userProfile?.email || 'Partner'}
          refreshing={refreshing}
          onRefresh={refreshData}
        />

        {/* Stats Metrics Bar */}
        <StatsGrid stats={stats} />

        {/* Main Content Area */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <PartnerSidebar />
              </div>
            </div>

            {/* Dynamic Content Area */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-6">
                  <Breadcrumbs />
                  <div className="mt-6">
                    <Outlet context={{ stats, partner, refreshData }} />
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