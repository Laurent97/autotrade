import { supabase } from './client';

export interface EarningsData {
  thisMonth: number;
  lastMonth: number;
  thisYear: number;
  allTime: number;
  availableBalance: number;
  pendingBalance: number;
  commissionEarned: number;
  averageOrderValue: number;
  totalOrders: number;
}

export const earningsService = {
  /**
   * Get real earnings data with time-based calculations
   */
  async getPartnerEarnings(partnerId: string): Promise<{ data: EarningsData | null; error: any }> {
    try {
      console.log('📊 Fetching real earnings data for partner:', partnerId);
      
      // Get current date
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      
      // Get all orders for this partner
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount, commission_amount, status, payment_status, created_at')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Get wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', partnerId)
        .maybeSingle();

      let availableBalance = 0;
      if (walletError?.code === 'PGRST116') {
        availableBalance = 0;
      } else if (wallet) {
        availableBalance = wallet.balance;
      }

      // Calculate time-based earnings
      const thisMonthOrders = orders?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === currentMonth && 
               orderDate.getFullYear() === currentYear &&
               order.payment_status === 'paid';
      }) || [];

      const lastMonthOrders = orders?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === lastMonth && 
               orderDate.getFullYear() === lastMonthYear &&
               order.payment_status === 'paid';
      }) || [];

      const thisYearOrders = orders?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getFullYear() === currentYear &&
               order.payment_status === 'paid';
      }) || [];

      const allTimeOrders = orders?.filter(order => order.payment_status === 'paid') || [];

      const pendingOrders = orders?.filter(order => 
        order.status === 'pending' || order.status === 'processing'
      ) || [];

      // Calculate earnings from COMMISSION AMOUNT ONLY
      const thisMonthEarnings = thisMonthOrders.reduce((sum, order) => sum + (order.commission_amount || 0), 0);
      const lastMonthEarnings = lastMonthOrders.reduce((sum, order) => sum + (order.commission_amount || 0), 0);
      const thisYearEarnings = thisYearOrders.reduce((sum, order) => sum + (order.commission_amount || 0), 0);
      const allTimeEarnings = allTimeOrders.reduce((sum, order) => sum + (order.commission_amount || 0), 0);

      const totalRevenue = allTimeOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const averageOrderValue = allTimeOrders.length > 0 ? totalRevenue / allTimeOrders.length : 0;

      const earningsData: EarningsData = {
        thisMonth: thisMonthEarnings, // Commission only
        lastMonth: lastMonthEarnings, // Commission only
        thisYear: thisYearEarnings, // Commission only
        allTime: allTimeEarnings, // Commission only
        availableBalance: availableBalance,
        pendingBalance: pendingOrders.reduce((sum, order) => sum + (order.commission_amount || 0), 0), // Pending commission only
        commissionEarned: allTimeEarnings, // Total commission earned
        averageOrderValue: averageOrderValue,
        totalOrders: allTimeOrders.length
      };

      console.log('✅ Real earnings data loaded:', earningsData);
      return { data: earningsData, error: null };

    } catch (error) {
      console.error('❌ Error fetching earnings data:', error);
      return { data: null, error };
    }
  },

  /**
   * Get earnings breakdown by month for the past 12 months
   */
  async getMonthlyEarnings(partnerId: string): Promise<{ data: any[] | null; error: any }> {
    try {
      const now = new Date();
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      
      const { data, error } = await supabase
        .from('orders')
        .select('total_amount, payment_status, created_at')
        .eq('partner_id', partnerId)
        .eq('payment_status', 'paid')
        .gte('created_at', twelveMonthsAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by month
      const monthlyData = data?.reduce((acc, order) => {
        const date = new Date(order.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthKey,
            revenue: 0,
            earnings: 0,
            orderCount: 0
          };
        }
        
        acc[monthKey].revenue += order.total_amount || 0;
        acc[monthKey].earnings += (order.total_amount || 0) * 0.1; // 10% commission
        acc[monthKey].orderCount += 1;
        
        return acc;
      }, {}) || {};

      const monthlyArray = Object.values(monthlyData);
      return { data: monthlyArray, error: null };

    } catch (error) {
      console.error('❌ Error fetching monthly earnings:', error);
      return { data: null, error };
    }
  }
};
