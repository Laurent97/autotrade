// Updated Payments component with real database integration and window opening
// Last updated: 2025-01-26 - Fixed window opening and database integration

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase/client';
import { walletService } from '../../lib/supabase/wallet-service';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  Check,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Eye,
  Bitcoin,
  ExternalLink,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Shield,
  MapPin,
  Globe,
  Monitor,
  Smartphone,
  Fingerprint,
  AlertCircle,
  Receipt,
  FileText,
  UserCheck,
  Ban,
  Info,
  Copy,
  Gift,
  Building,
  Percent,
  Calendar,
  Download,
  Filter
} from 'lucide-react';

interface StripePaymentAttempt {
  id: string;
  order_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  payment_intent_id?: string;
  status: string;
  rejection_reason?: string;
  collected_data?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
  };
}

interface PendingPayment {
  id: string;
  order_id: string;
  customer_id: string;
  payment_method: 'paypal' | 'crypto';
  amount: number;
  currency: string;
  paypal_email?: string;
  paypal_transaction_id?: string;
  crypto_address?: string;
  crypto_transaction_id?: string;
  crypto_type?: string;
  status: string;
  admin_notes?: string;
  confirmed_by?: string;
  confirmed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
  };
}

interface PaymentSecurityLog {
  id: string;
  user_id: string;
  event_type: string;
  event_data?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
  };
}

interface PaymentStats {
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  totalTransactions: number;
  pendingPayments: number;
  completedPayments: number;
  failedPayments: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
}

interface WalletTransaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'order_payment' | 'order_refund' | 'commission' | 'bonus';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  payment_method?: string;
  order_id?: string;
  transaction_hash?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
  };
}

interface WalletBalance {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
  };
}

interface LoanApplication {
  id: string;
  partner_name: string;
  partner_email: string;
  loan_amount: number;
  loan_purpose: string;
  loan_term: number;
  status: 'pending' | 'approved' | 'rejected';
  applied_date: string;
  approved_date?: string;
  rejected_date?: string;
  credit_score: number;
  annual_revenue: number;
  documents: string[];
  rejection_reason?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

const Payments: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stripeAttempts, setStripeAttempts] = useState<StripePaymentAttempt[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [securityLogs, setSecurityLogs] = useState<PaymentSecurityLog[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [walletBalances, setWalletBalances] = useState<WalletBalance[]>([]);
  const [loanApplications, setLoanApplications] = useState<LoanApplication[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    totalTransactions: 0,
    pendingPayments: 0,
    completedPayments: 0,
    failedPayments: 0,
    totalWithdrawals: 0,
    pendingWithdrawals: 0
  });

  // Filters
  const [paymentStatus, setPaymentStatus] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('30');
  const [walletTransactionType, setWalletTransactionType] = useState<string>('all');
  const [walletStatus, setWalletStatus] = useState<string>('all');
  const [loanStatus, setLoanStatus] = useState<string>('all');
  const [loanSearchTerm, setLoanSearchTerm] = useState('');

  // Dialog states
  const [selectedPayment, setSelectedPayment] = useState<StripePaymentAttempt | PendingPayment | null>(null);
  const [selectedLog, setSelectedLog] = useState<PaymentSecurityLog | null>(null);
  const [selectedLoanApplication, setSelectedLoanApplication] = useState<LoanApplication | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchPaymentData();
    }
  }, [user, paymentStatus, paymentMethod, searchTerm, dateRange]);

  const fetchPaymentData = async () => {
    setLoading(true);
    try {
      // Fetch Stripe payment attempts
      let stripeQuery = supabase
        .from('v_stripe_payment_attempts_with_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        stripeQuery = stripeQuery.or(`user.email.ilike.%${searchTerm}%,user.full_name.ilike.%${searchTerm}%,order_id.ilike.%${searchTerm}%`);
      }
      if (dateRange !== 'all') {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
        stripeQuery = stripeQuery.gte('created_at', daysAgo.toISOString());
      }

      const { data: stripeData, error: stripeError } = await stripeQuery;

      if (stripeError) {
        console.error('Error fetching Stripe attempts:', stripeError);
        setStripeAttempts([]);
      } else {
        setStripeAttempts(stripeData || []);
      }

      // Fetch pending payments (PayPal and Crypto)
      let pendingQuery = supabase
        .from('v_pending_payments_with_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentMethod !== 'all') {
        pendingQuery = pendingQuery.eq('payment_method', paymentMethod);
      }
      if (searchTerm) {
        pendingQuery = pendingQuery.or(`user.email.ilike.%${searchTerm}%,user.full_name.ilike.%${searchTerm}%,order_id.ilike.%${searchTerm}%`);
      }
      if (dateRange !== 'all') {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
        pendingQuery = pendingQuery.gte('created_at', daysAgo.toISOString());
      }

      const { data: pendingData, error: pendingError } = await pendingQuery;

      if (pendingError) {
        console.error('Error fetching pending payments:', pendingError);
        setPendingPayments([]);
      } else {
        setPendingPayments(pendingData || []);
      }

      // Fetch security logs
      let logsQuery = supabase
        .from('v_payment_security_logs_with_users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (searchTerm) {
        logsQuery = logsQuery.or(`user.email.ilike.%${searchTerm}%,user.full_name.ilike.%${searchTerm}%,event_type.ilike.%${searchTerm}%`);
      }
      if (dateRange !== 'all') {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
        logsQuery = logsQuery.gte('created_at', daysAgo.toISOString());
      }

      const { data: logsData, error: logsError } = await logsQuery;

      if (logsError) {
        console.error('Error fetching security logs:', logsError);
        setSecurityLogs([]);
      } else {
        setSecurityLogs(logsData || []);
      }

      // Fetch wallet transactions
      let walletTransactionsQuery = supabase
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (walletTransactionType !== 'all') {
        walletTransactionsQuery = walletTransactionsQuery.eq('type', walletTransactionType);
      }
      if (walletStatus !== 'all') {
        walletTransactionsQuery = walletTransactionsQuery.eq('status', walletStatus);
      }
      if (searchTerm) {
        walletTransactionsQuery = walletTransactionsQuery.or(`user.email.ilike.%${searchTerm}%,user.full_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      if (dateRange !== 'all') {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
        walletTransactionsQuery = walletTransactionsQuery.gte('created_at', daysAgo.toISOString());
      }

      const { data: walletTransactionsData, error: walletTransactionsError } = await walletTransactionsQuery;

      if (walletTransactionsError) {
        console.error('Error fetching wallet transactions:', walletTransactionsError);
        setWalletTransactions([]);
      } else {
        setWalletTransactions(walletTransactionsData || []);
      }

      // Fetch wallet balances
      let walletBalancesQuery = supabase
        .from('wallet_balances')
        .select('*')
        .order('balance', { ascending: false })
        .limit(100);

      if (searchTerm) {
        walletBalancesQuery = walletBalancesQuery.or(`user_id.ilike.%${searchTerm}%`);
      }

      const { data: walletBalancesData, error: walletBalancesError } = await walletBalancesQuery;

      if (walletBalancesError) {
        console.error('Error fetching wallet balances:', walletBalancesError);
        setWalletBalances([]);
      } else {
        setWalletBalances(walletBalancesData || []);
      }

      // Calculate stats
      const allPayments = [...(stripeData || []), ...(pendingData || [])];
      const completedPayments = allPayments.filter(p => p.status === 'completed' || p.status === 'succeeded');
      const walletWithdrawals = walletTransactionsData?.filter(t => t.type === 'withdrawal') || [];
      const pendingWalletWithdrawals = walletWithdrawals.filter(w => w.status === 'pending');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayPayments = completedPayments.filter(p => 
        new Date(p.created_at) >= today
      );
      
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const monthPayments = completedPayments.filter(p => 
        new Date(p.created_at) >= thisMonth
      );

      const totalWalletBalance = walletBalancesData?.reduce((sum, balance) => sum + (balance.balance || 0), 0) || 0;

      // Mock loan applications data (replace with actual database call)
      const mockLoanApplications: LoanApplication[] = [
        {
          id: 'APP001',
          partner_name: 'John Auto Parts',
          partner_email: 'john@example.com',
          loan_amount: 15000,
          loan_purpose: 'Inventory Expansion',
          loan_term: 24,
          status: 'pending',
          applied_date: '2024-01-15',
          credit_score: 720,
          annual_revenue: 250000,
          documents: ['tax_return.pdf', 'business_license.pdf'],
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'APP002',
          partner_name: 'Smith Motors',
          partner_email: 'smith@example.com',
          loan_amount: 50000,
          loan_purpose: 'Equipment Purchase',
          loan_term: 36,
          status: 'approved',
          applied_date: '2024-01-10',
          approved_date: '2024-01-12',
          credit_score: 680,
          annual_revenue: 500000,
          documents: ['financial_statements.pdf'],
          created_at: '2024-01-10T14:30:00Z',
          updated_at: '2024-01-12T09:15:00Z'
        },
        {
          id: 'APP003',
          partner_name: 'City Garage LLC',
          partner_email: 'city@example.com',
          loan_amount: 10000,
          loan_purpose: 'Working Capital',
          loan_term: 12,
          status: 'rejected',
          applied_date: '2024-01-05',
          rejected_date: '2024-01-08',
          credit_score: 650,
          annual_revenue: 150000,
          documents: ['bank_statements.pdf'],
          rejection_reason: 'Insufficient credit history',
          created_at: '2024-01-05T16:45:00Z',
          updated_at: '2024-01-08T11:20:00Z'
        }
      ];

      setLoanApplications(mockLoanApplications);

      setStats({
        totalRevenue: completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        todayRevenue: todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        monthRevenue: monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        totalTransactions: allPayments.length,
        pendingPayments: allPayments.filter(p => p.status === 'pending' || p.status === 'pending_confirmation').length,
        completedPayments: completedPayments.length,
        failedPayments: allPayments.filter(p => p.status === 'failed' || p.status === 'rejected').length,
        totalWithdrawals: walletWithdrawals.length,
        pendingWithdrawals: pendingWalletWithdrawals.length
      });

    } catch (error) {
      console.error('Error fetching payment data:', error);
      setError('Failed to fetch payment data');
    } finally {
      setLoading(false);
    }
  };

  const approvePayment = async (payment: PendingPayment) => {
    setProcessingAction(`approve-${payment.id}`);
    setError('');
    
    try {
      const { error } = await supabase
        .from('pending_payments')
        .update({
          status: 'confirmed',
          confirmed_by: user.id,
          confirmed_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      if (error) throw error;

      // Update the order's payment_status to 'paid'
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed', // Also update order status to confirmed
          updated_at: new Date().toISOString()
        })
        .eq('order_number', payment.order_id);

      if (orderError) {
        console.error('Error updating order payment status:', orderError);
        throw orderError;
      }

      // Log the approval
      await supabase
        .from('payment_security_logs')
        .insert({
          user_id: payment.customer_id,
          event_type: 'payment_approved',
          event_data: {
            payment_id: payment.id,
            order_id: payment.order_id,
            amount: payment.amount,
            payment_method: payment.payment_method
          },
          admin_id: user.id
        });

      await fetchPaymentData();
      setError('Payment approved successfully and order status updated');
    } catch (error: any) {
      console.error('Error approving payment:', error);
      setError('Failed to approve payment');
    } finally {
      setProcessingAction(null);
    }
  };

  const rejectPayment = async (payment: PendingPayment, reason: string) => {
    setProcessingAction(`reject-${payment.id}`);
    setError('');
    
    try {
      const { error } = await supabase
        .from('pending_payments')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          confirmed_by: user.id,
          confirmed_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      if (error) throw error;

      // Update the order's payment_status to 'failed'
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          status: 'pending', // Keep order in pending status for retry
          updated_at: new Date().toISOString()
        })
        .eq('order_number', payment.order_id);

      if (orderError) {
        console.error('Error updating order payment status:', orderError);
        throw orderError;
      }

      // Log the rejection
      await supabase
        .from('payment_security_logs')
        .insert({
          user_id: payment.customer_id,
          event_type: 'payment_rejected',
          event_data: {
            payment_id: payment.id,
            order_id: payment.order_id,
            amount: payment.amount,
            payment_method: payment.payment_method,
            reason: reason
          },
          admin_id: user.id
        });

      await fetchPaymentData();
      setError('Payment rejected successfully and order status updated');
    } catch (error: any) {
      console.error('Error rejecting payment:', error);
      setError('Failed to reject payment');
    } finally {
      setProcessingAction(null);
    }
  };

  // Wallet management functions
  const approveWithdrawal = async (transaction: WalletTransaction) => {
    setProcessingAction(`approve-withdrawal-${transaction.id}`);
    setError('');
    
    try {
      const { error } = await walletService.approveWithdrawal(transaction.id);

      if (error) throw error;

      await fetchPaymentData();
      setError('Withdrawal approved successfully');
    } catch (error: any) {
      console.error('Error approving withdrawal:', error);
      setError('Failed to approve withdrawal');
    } finally {
      setProcessingAction(null);
    }
  };

  const rejectWithdrawal = async (transaction: WalletTransaction, reason: string) => {
    setProcessingAction(`reject-withdrawal-${transaction.id}`);
    setError('');
    
    try {
      const { error } = await walletService.rejectTransaction(transaction.id, reason);

      if (error) throw error;

      await fetchPaymentData();
      setError('Withdrawal rejected successfully');
    } catch (error: any) {
      console.error('Error rejecting withdrawal:', error);
      setError('Failed to reject withdrawal');
    } finally {
      setProcessingAction(null);
    }
  };

  const approveDeposit = async (transaction: WalletTransaction) => {
    setProcessingAction(`approve-deposit-${transaction.id}`);
    setError('');
    
    try {
      const { error } = await walletService.approveDeposit(transaction.id);

      if (error) throw error;

      await fetchPaymentData();
      setError('Deposit approved successfully');
    } catch (error: any) {
      console.error('Error approving deposit:', error);
      setError('Failed to approve deposit');
    } finally {
      setProcessingAction(null);
    }
  };

  const updateWalletBalance = async (userId: string, newBalance: number) => {
    setProcessingAction(`update-balance-${userId}`);
    setError('');
    
    try {
      const { error } = await walletService.updateBalance(userId, { balance: newBalance });

      if (error) throw error;

      await fetchPaymentData();
      setError('Wallet balance updated successfully');
    } catch (error: any) {
      console.error('Error updating wallet balance:', error);
      setError('Failed to update wallet balance');
    } finally {
      setProcessingAction(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setError('Copied to clipboard!');
  };

  // Loan application management functions
  const approveLoanApplication = async (application: LoanApplication) => {
    setProcessingAction(`approve-loan-${application.id}`);
    setError('');
    
    try {
      // Update loan application status
      const updatedApplications = loanApplications.map(app => 
        app.id === application.id 
          ? { 
              ...app, 
              status: 'approved' as const, 
              approved_date: new Date().toISOString().split('T')[0],
              updated_at: new Date().toISOString()
            }
          : app
      );
      
      setLoanApplications(updatedApplications);
      setError('Loan application approved successfully');
    } catch (error: any) {
      console.error('Error approving loan application:', error);
      setError('Failed to approve loan application');
    } finally {
      setProcessingAction(null);
    }
  };

  const rejectLoanApplication = async (application: LoanApplication, reason: string) => {
    setProcessingAction(`reject-loan-${application.id}`);
    setError('');
    
    try {
      // Update loan application status
      const updatedApplications = loanApplications.map(app => 
        app.id === application.id 
          ? { 
              ...app, 
              status: 'rejected' as const, 
              rejected_date: new Date().toISOString().split('T')[0],
              rejection_reason: reason,
              updated_at: new Date().toISOString()
            }
          : app
      );
      
      setLoanApplications(updatedApplications);
      setError('Loan application rejected successfully');
    } catch (error: any) {
      console.error('Error rejecting loan application:', error);
      setError('Failed to reject loan application');
    } finally {
      setProcessingAction(null);
    }
  };

  const filteredLoanApplications = loanApplications.filter(app => {
    const matchesSearch = app.partner_name.toLowerCase().includes(loanSearchTerm.toLowerCase()) ||
                         app.partner_email.toLowerCase().includes(loanSearchTerm.toLowerCase()) ||
                         app.id.toLowerCase().includes(loanSearchTerm.toLowerCase());
    const matchesStatus = loanStatus === 'all' || app.status === loanStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      pending: { variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      pending_confirmation: { variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      confirmed: { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      completed: { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      succeeded: { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      failed: { variant: 'destructive', icon: <XCircle className="w-3 h-3" /> },
      rejected: { variant: 'destructive', icon: <Ban className="w-3 h-3" /> },
      cancelled: { variant: 'destructive', icon: <XCircle className="w-3 h-3" /> }
    };

    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons = {
      stripe: <CreditCard className="w-4 h-4" />,
      paypal: <Wallet className="w-4 h-4" />,
      crypto: <Bitcoin className="w-4 h-4" />,
      btc: <Bitcoin className="w-4 h-4" />,
      eth: <Bitcoin className="w-4 h-4" />,
      usdt: <Bitcoin className="w-4 h-4" />
    };
    return icons[method as keyof typeof icons] || <Wallet className="w-4 h-4" />;
  };

  const getTransactionTypeIcon = (type: string) => {
    const icons = {
      deposit: <ArrowUpRight className="w-4 h-4 text-green-600" />,
      withdrawal: <ArrowDownRight className="w-4 h-4 text-red-600" />,
      order_payment: <DollarSign className="w-4 h-4 text-blue-600" />,
      order_refund: <RefreshCw className="w-4 h-4 text-orange-600" />,
      commission: <TrendingUp className="w-4 h-4 text-purple-600" />,
      bonus: <Gift className="w-4 h-4 text-pink-600" />
    };
    return icons[type as keyof typeof icons] || <DollarSign className="w-4 h-4" />;
  };

  const getWalletStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      pending: { variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      completed: { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      failed: { variant: 'destructive', icon: <XCircle className="w-3 h-3" /> },
      cancelled: { variant: 'destructive', icon: <Ban className="w-3 h-3" /> }
    };

    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Open payments in a new window
  const openPaymentsWindow = () => {
    const url = '/admin/payments';
    const windowFeatures = 'width=1400,height=900,scrollbars=yes,resizable=yes,status=1,toolbar=0,menubar=0,location=0';
    window.open(url, '_blank', windowFeatures);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payment Management</h1>
            <p className="text-muted-foreground">Manage payments, transactions, and financial operations</p>
          </div>
          <Button onClick={openPaymentsWindow}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in New Window
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +${stats.todayRevenue.toFixed(2)} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wallet Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${walletBalances.reduce((sum, balance) => sum + (balance.balance || 0), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {walletBalances.length} active wallets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-muted-foreground text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingWithdrawals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalWithdrawals} total withdrawals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.failedPayments} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalTransactions > 0 
                ? Math.round((stats.completedPayments / stats.totalTransactions) * 100) 
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Payment completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by email, name, or order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="min-w-[150px]">
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="stripe" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stripe">Stripe Attempts</TabsTrigger>
          <TabsTrigger value="pending">Pending Payments</TabsTrigger>
          <TabsTrigger value="loans">Loan Applications</TabsTrigger>
          <TabsTrigger value="wallet">Wallet Management</TabsTrigger>
          <TabsTrigger value="security">Security Logs</TabsTrigger>
        </TabsList>

        {/* Stripe Attempts Tab */}
        <TabsContent value="stripe" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stripe Payment Attempts</CardTitle>
              <CardDescription>Monitor Stripe payment attempts and security events</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Intent</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stripeAttempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-mono text-xs">
                        {attempt.order_id}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{attempt.user?.full_name}</div>
                          <div className="text-sm text-muted-foreground">{attempt.user?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">${attempt.amount.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">{attempt.currency}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(attempt.status)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {attempt.payment_intent_id || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(attempt.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPayment(attempt)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Stripe Payment Attempt Details</DialogTitle>
                              <DialogDescription>
                                Full information about this payment attempt
                              </DialogDescription>
                            </DialogHeader>
                            {selectedPayment && 'payment_intent_id' in selectedPayment && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Order ID</Label>
                                    <p className="font-mono text-sm bg-muted p-2 rounded">{selectedPayment.order_id}</p>
                                  </div>
                                  <div>
                                    <Label>Status</Label>
                                    <div>{getStatusBadge(selectedPayment.status)}</div>
                                  </div>
                                  <div>
                                    <Label>Customer</Label>
                                    <p className="font-medium">{selectedPayment.user?.full_name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedPayment.user?.email}</p>
                                  </div>
                                  <div>
                                    <Label>Amount</Label>
                                    <p className="font-medium">${selectedPayment.amount} {selectedPayment.currency}</p>
                                  </div>
                                </div>

                                {selectedPayment.payment_intent_id && (
                                  <div>
                                    <Label>Payment Intent ID</Label>
                                    <div className="flex gap-2">
                                      <p className="font-mono text-sm bg-muted p-2 rounded flex-1">
                                        {selectedPayment.payment_intent_id}
                                      </p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(selectedPayment.payment_intent_id!)}
                                      >
                                        <Copy className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {selectedPayment.rejection_reason && (
                                  <div>
                                    <Label>Rejection Reason</Label>
                                    <p className="text-sm text-muted-foreground">{selectedPayment.rejection_reason}</p>
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>IP Address</Label>
                                    <p className="text-sm text-muted-foreground">{selectedPayment.ip_address || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label>Created</Label>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(selectedPayment.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                </div>

                                {selectedPayment.collected_data && (
                                  <div>
                                    <Label>Collected Data</Label>
                                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                                      {JSON.stringify(selectedPayment.collected_data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Payments Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payments</CardTitle>
              <CardDescription>Review and approve PayPal and cryptocurrency payments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs">
                        {payment.order_id}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.user?.full_name}</div>
                          <div className="text-sm text-muted-foreground">{payment.user?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(payment.payment_method)}
                          <span className="capitalize">{payment.payment_method}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">${payment.amount.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">{payment.currency}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {payment.paypal_transaction_id || payment.crypto_transaction_id || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedPayment(payment)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Payment Details</DialogTitle>
                                <DialogDescription>
                                  Full information about this pending payment
                                </DialogDescription>
                              </DialogHeader>
                              {selectedPayment && 'payment_method' in selectedPayment && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Order ID</Label>
                                      <p className="font-mono text-sm bg-muted p-2 rounded">{selectedPayment.order_id}</p>
                                    </div>
                                    <div>
                                      <Label>Status</Label>
                                      <div>{getStatusBadge(selectedPayment.status)}</div>
                                    </div>
                                    <div>
                                      <Label>Customer</Label>
                                      <p className="font-medium">{selectedPayment.user?.full_name}</p>
                                      <p className="text-sm text-muted-foreground">{selectedPayment.user?.email}</p>
                                    </div>
                                    <div>
                                      <Label>Amount</Label>
                                      <p className="font-medium">${selectedPayment.amount} {selectedPayment.currency}</p>
                                    </div>
                                  </div>

                                  <div>
                                    <Label>Payment Method</Label>
                                    <div className="flex items-center gap-2">
                                      {getPaymentMethodIcon(selectedPayment.payment_method)}
                                      <span className="capitalize">{selectedPayment.payment_method}</span>
                                    </div>
                                  </div>

                                  {selectedPayment.paypal_email && (
                                    <div>
                                      <Label>PayPal Email</Label>
                                      <p className="text-sm">{selectedPayment.paypal_email}</p>
                                    </div>
                                  )}

                                  {selectedPayment.crypto_address && (
                                    <div>
                                      <Label>Crypto Address</Label>
                                      <div className="flex gap-2">
                                        <p className="font-mono text-sm bg-muted p-2 rounded flex-1">
                                          {selectedPayment.crypto_address}
                                        </p>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => copyToClipboard(selectedPayment.crypto_address!)}
                                        >
                                          <Copy className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {selectedPayment.crypto_type && (
                                    <div>
                                      <Label>Cryptocurrency</Label>
                                      <p className="text-sm">{selectedPayment.crypto_type.toUpperCase()}</p>
                                    </div>
                                  )}

                                  {selectedPayment.admin_notes && (
                                    <div>
                                      <Label>Admin Notes</Label>
                                      <p className="text-sm text-muted-foreground">{selectedPayment.admin_notes}</p>
                                    </div>
                                  )}

                                  {(selectedPayment.status === 'pending_confirmation' || selectedPayment.status === 'pending') && (
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => approvePayment(selectedPayment as PendingPayment)}
                                        disabled={processingAction === `approve-${selectedPayment.id}`}
                                        className="flex-1"
                                      >
                                        {processingAction === `approve-${selectedPayment.id}` ? (
                                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                        )}
                                        Approve
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() => rejectPayment(selectedPayment as PendingPayment, 'Rejected by admin')}
                                        disabled={processingAction === `reject-${selectedPayment.id}`}
                                        className="flex-1"
                                      >
                                        {processingAction === `reject-${selectedPayment.id}` ? (
                                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                          <XCircle className="w-4 h-4 mr-2" />
                                        )}
                                        Reject
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Logs Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Logs</CardTitle>
              <CardDescription>Monitor payment security events and suspicious activities</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Type</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant="outline">{log.event_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.user?.full_name}</div>
                          <div className="text-sm text-muted-foreground">{log.user?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.ip_address || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm max-w-xs truncate">
                          {log.event_data ? JSON.stringify(log.event_data) : 'No details'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Security Log Details</DialogTitle>
                              <DialogDescription>
                                Full information about this security event
                              </DialogDescription>
                            </DialogHeader>
                            {selectedLog && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Event Type</Label>
                                    <Badge variant="outline">{selectedLog.event_type}</Badge>
                                  </div>
                                  <div>
                                    <Label>User</Label>
                                    <p className="font-medium">{selectedLog.user?.full_name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedLog.user?.email}</p>
                                  </div>
                                  <div>
                                    <Label>IP Address</Label>
                                    <p className="font-mono text-sm">{selectedLog.ip_address || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label>Date</Label>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(selectedLog.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                </div>

                                {selectedLog.user_agent && (
                                  <div>
                                    <Label>User Agent</Label>
                                    <p className="text-xs bg-muted p-2 rounded break-all">
                                      {selectedLog.user_agent}
                                    </p>
                                  </div>
                                )}

                                {selectedLog.event_data && (
                                  <div>
                                    <Label>Event Data</Label>
                                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                                      {JSON.stringify(selectedLog.event_data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loan Applications Tab */}
        <TabsContent value="loans" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Loan Applications</CardTitle>
                  <CardDescription>Review and manage partner loan applications</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Loan Applications Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="loan-search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="loan-search"
                      placeholder="Search by name, email, or application ID..."
                      value={loanSearchTerm}
                      onChange={(e) => setLoanSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="min-w-[150px]">
                  <Label>Status</Label>
                  <Select value={loanStatus} onValueChange={setLoanStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Loan Applications Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application ID</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Credit Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoanApplications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-mono text-xs">
                        {application.id}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{application.partner_name}</div>
                          <div className="text-sm text-muted-foreground">{application.partner_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">${application.loan_amount.toLocaleString()}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{application.loan_purpose}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{application.loan_term} months</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <Badge variant={application.credit_score >= 700 ? 'default' : application.credit_score >= 650 ? 'secondary' : 'destructive'}>
                            {application.credit_score}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(application.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(application.applied_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedLoanApplication(application)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Loan Application Details</DialogTitle>
                                <DialogDescription>
                                  Full information about this loan application
                                </DialogDescription>
                              </DialogHeader>
                              {selectedLoanApplication && (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Application ID</Label>
                                      <p className="font-mono text-sm bg-muted p-2 rounded">{selectedLoanApplication.id}</p>
                                    </div>
                                    <div>
                                      <Label>Status</Label>
                                      <div>{getStatusBadge(selectedLoanApplication.status)}</div>
                                    </div>
                                    <div>
                                      <Label>Partner Name</Label>
                                      <p className="font-medium">{selectedLoanApplication.partner_name}</p>
                                      <p className="text-sm text-muted-foreground">{selectedLoanApplication.partner_email}</p>
                                    </div>
                                    <div>
                                      <Label>Loan Amount</Label>
                                      <p className="font-medium">${selectedLoanApplication.loan_amount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <Label>Loan Purpose</Label>
                                      <p className="text-sm">{selectedLoanApplication.loan_purpose}</p>
                                    </div>
                                    <div>
                                      <Label>Loan Term</Label>
                                      <p className="text-sm">{selectedLoanApplication.loan_term} months</p>
                                    </div>
                                    <div>
                                      <Label>Credit Score</Label>
                                      <Badge variant={selectedLoanApplication.credit_score >= 700 ? 'default' : selectedLoanApplication.credit_score >= 650 ? 'secondary' : 'destructive'}>
                                        {selectedLoanApplication.credit_score}
                                      </Badge>
                                    </div>
                                    <div>
                                      <Label>Annual Revenue</Label>
                                      <p className="font-medium">${selectedLoanApplication.annual_revenue.toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <Label>Applied Date</Label>
                                      <p className="text-sm">{new Date(selectedLoanApplication.applied_date).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                      <Label>Documents</Label>
                                      <div className="space-y-1">
                                        {selectedLoanApplication.documents.map((doc, index) => (
                                          <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                                            <FileText className="w-3 h-3" />
                                            {doc}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {selectedLoanApplication.rejection_reason && (
                                    <div>
                                      <Label>Rejection Reason</Label>
                                      <p className="text-sm text-muted-foreground bg-red-50 p-2 rounded">{selectedLoanApplication.rejection_reason}</p>
                                    </div>
                                  )}

                                  {selectedLoanApplication.status === 'pending' && (
                                    <div className="flex gap-2 pt-4">
                                      <Button
                                        onClick={() => approveLoanApplication(selectedLoanApplication)}
                                        disabled={processingAction === `approve-loan-${selectedLoanApplication.id}`}
                                        className="flex-1"
                                      >
                                        {processingAction === `approve-loan-${selectedLoanApplication.id}` ? (
                                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                        )}
                                        Approve Application
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() => {
                                          const reason = prompt('Please enter rejection reason:');
                                          if (reason) {
                                            rejectLoanApplication(selectedLoanApplication, reason);
                                          }
                                        }}
                                        disabled={processingAction === `reject-loan-${selectedLoanApplication.id}`}
                                        className="flex-1"
                                      >
                                        {processingAction === `reject-loan-${selectedLoanApplication.id}` ? (
                                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                          <XCircle className="w-4 h-4 mr-2" />
                                        )}
                                        Reject Application
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          {application.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => approveLoanApplication(application)}
                                disabled={processingAction === `approve-loan-${application.id}`}
                                className="text-green-600 hover:text-green-700"
                              >
                                {processingAction === `approve-loan-${application.id}` ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const reason = prompt('Please enter rejection reason:');
                                  if (reason) {
                                    rejectLoanApplication(application, reason);
                                  }
                                }}
                                disabled={processingAction === `reject-loan-${application.id}`}
                                className="text-red-600 hover:text-red-700"
                              >
                                {processingAction === `reject-loan-${application.id}` ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wallet Management Tab */}
        <TabsContent value="wallet" className="space-y-4">
          {/* Wallet Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Wallet Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="min-w-[150px]">
                  <Label>Transaction Type</Label>
                  <Select value={walletTransactionType} onValueChange={setWalletTransactionType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="deposit">Deposits</SelectItem>
                      <SelectItem value="withdrawal">Withdrawals</SelectItem>
                      <SelectItem value="order_payment">Order Payments</SelectItem>
                      <SelectItem value="order_refund">Order Refunds</SelectItem>
                      <SelectItem value="commission">Commissions</SelectItem>
                      <SelectItem value="bonus">Bonuses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="min-w-[150px]">
                  <Label>Status</Label>
                  <Select value={walletStatus} onValueChange={setWalletStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Balances */}
          <Card>
            <CardHeader>
              <CardTitle>Wallet Balances</CardTitle>
              <CardDescription>Manage user wallet balances</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {walletBalances.map((balance) => (
                    <TableRow key={balance.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{balance.user?.full_name}</div>
                          <div className="text-sm text-muted-foreground">{balance.user?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">${balance.balance.toFixed(2)}</div>
                      </TableCell>
                      <TableCell>{balance.currency}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(balance.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedPayment(balance)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Update Wallet Balance</DialogTitle>
                                <DialogDescription>
                                  Adjust the wallet balance for {balance.user?.full_name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Current Balance</Label>
                                  <p className="font-medium">${balance.balance.toFixed(2)}</p>
                                </div>
                                <div>
                                  <Label>New Balance</Label>
                                  <Input
                                    type="number"
                                    defaultValue={balance.balance}
                                    placeholder="Enter new balance"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => updateWalletBalance(balance.user_id, balance.balance)}
                                    disabled={processingAction === `update-balance-${balance.user_id}`}
                                  >
                                    {processingAction === `update-balance-${balance.user_id}` ? 'Updating...' : 'Update Balance'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Wallet Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Wallet Transactions</CardTitle>
              <CardDescription>Manage deposit and withdrawal requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {walletTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.user?.full_name}</div>
                          <div className="text-sm text-muted-foreground">{transaction.user?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionTypeIcon(transaction.type)}
                          <span className="capitalize">{transaction.type.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {transaction.type === 'withdrawal' ? '-' : '+'}${transaction.amount.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>{getWalletStatusBadge(transaction.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm max-w-xs truncate" title={transaction.description}>
                          {transaction.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedPayment(transaction)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Transaction Details</DialogTitle>
                                <DialogDescription>
                                  Full information about this wallet transaction
                                </DialogDescription>
                              </DialogHeader>
                              {selectedPayment && 'type' in selectedPayment && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Transaction ID</Label>
                                      <p className="font-mono text-sm bg-muted p-2 rounded">{selectedPayment.id}</p>
                                    </div>
                                    <div>
                                      <Label>Status</Label>
                                      <div>{getWalletStatusBadge(selectedPayment.status)}</div>
                                    </div>
                                    <div>
                                      <Label>User</Label>
                                      <p className="font-medium">{selectedPayment.user?.full_name}</p>
                                      <p className="text-sm text-muted-foreground">{selectedPayment.user?.email}</p>
                                    </div>
                                    <div>
                                      <Label>Amount</Label>
                                      <p className="font-medium">
                                        {selectedPayment.type === 'withdrawal' ? '-' : '+'}${selectedPayment.amount}
                                      </p>
                                    </div>
                                  </div>

                                  <div>
                                    <Label>Transaction Type</Label>
                                    <div className="flex items-center gap-2">
                                      {getTransactionTypeIcon(selectedPayment.type)}
                                      <span className="capitalize">{selectedPayment.type.replace('_', ' ')}</span>
                                    </div>
                                  </div>

                                  <div>
                                    <Label>Description</Label>
                                    <p className="text-sm">{selectedPayment.description}</p>
                                  </div>

                                  {selectedPayment.payment_method && (
                                    <div>
                                      <Label>Payment Method</Label>
                                      <p className="text-sm">{selectedPayment.payment_method}</p>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Created</Label>
                                      <p className="text-sm text-muted-foreground">
                                        {new Date(selectedPayment.created_at).toLocaleString()}
                                      </p>
                                    </div>
                                    <div>
                                      <Label>Updated</Label>
                                      <p className="text-sm text-muted-foreground">
                                        {new Date(selectedPayment.updated_at).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>

                                  {selectedPayment.status === 'pending' && (
                                    <div className="flex gap-2 pt-4">
                                      {selectedPayment.type === 'withdrawal' && (
                                        <>
                                          <Button
                                            onClick={() => approveWithdrawal(selectedPayment)}
                                            disabled={processingAction === `approve-withdrawal-${selectedPayment.id}`}
                                            className="bg-green-600 hover:bg-green-700"
                                          >
                                            {processingAction === `approve-withdrawal-${selectedPayment.id}` ? 'Approving...' : 'Approve Withdrawal'}
                                          </Button>
                                          <Button
                                            variant="destructive"
                                            onClick={() => {
                                              const reason = prompt('Rejection reason:');
                                              if (reason) rejectWithdrawal(selectedPayment, reason);
                                            }}
                                            disabled={processingAction === `reject-withdrawal-${selectedPayment.id}`}
                                          >
                                            {processingAction === `reject-withdrawal-${selectedPayment.id}` ? 'Rejecting...' : 'Reject Withdrawal'}
                                          </Button>
                                        </>
                                      )}
                                      {selectedPayment.type === 'deposit' && (
                                        <Button
                                          onClick={() => approveDeposit(selectedPayment)}
                                          disabled={processingAction === `approve-deposit-${selectedPayment.id}`}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          {processingAction === `approve-deposit-${selectedPayment.id}` ? 'Approving...' : 'Approve Deposit'}
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Payments;
