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
import { Textarea } from '../../components/ui/textarea';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase/client';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Eye,
  Bitcoin,
  ExternalLink,
  Wallet,
  ArrowUpRight,
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
  Info
} from 'lucide-react';

interface Payment {
  id: string;
  order_id?: string;
  user_id: string;
  payment_method: 'stripe' | 'paypal' | 'crypto' | 'wallet';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  payment_intent_id?: string;
  stripe_charge_id?: string;
  paypal_order_id?: string;
  paypal_transaction_id?: string;
  crypto_type?: string;
  crypto_address?: string;
  crypto_transaction_id?: string;
  crypto_confirmations?: number;
  failure_reason?: string;
  refund_amount?: number;
  refund_reason?: string;
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
    full_name: string;
  };
  order?: {
    id: string;
    order_number: string;
  };
  // Secure payment details (PCI compliant)
  payment_details?: {
    // Card information (masked for security)
    card_last4?: string;
    card_brand?: string;
    card_exp_month?: number;
    card_exp_year?: number;
    card_fingerprint?: string;
    card_country?: string;
    card_funding?: string;
    
    // 3D Secure information
    three_d_secure?: {
      authenticated: boolean;
      version: string;
      result: string;
      method: string;
    };
    
    // Billing information
    billing_address?: {
      name: string;
      email: string;
      phone: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
    
    // Security and fraud detection
    fraud_detection?: {
      risk_score: number;
      risk_level: 'low' | 'medium' | 'high';
      ip_address: string;
      ip_country: string;
      device_fingerprint: string;
      browser_info: {
        user_agent: string;
        language: string;
        timezone: string;
        screen_resolution: string;
      };
      velocity_checks: {
        attempts_last_hour: number;
        attempts_last_day: number;
        unique_cards_used: number;
      };
    };
    
    // Transaction metadata
    stripe_metadata?: {
      payment_method_id: string;
      customer_id: string;
      invoice_id?: string;
      receipt_url?: string;
      balance_transaction_id?: string;
      transfer_group?: string;
      description?: string;
      statement_descriptor?: string;
    };
    
    // Dispute and chargeback information
    dispute?: {
      id: string;
      reason: string;
      status: string;
      amount: number;
      currency: string;
      evidence_due_by: string;
      is_chargeback: boolean;
    };
    
    // Refund information
    refunds?: Array<{
      id: string;
      amount: number;
      currency: string;
      reason: string;
      status: string;
      created_at: string;
    }>;
  };
}

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  crypto_type: 'BTC' | 'ETH' | 'USDT_TRX' | 'XRP';
  to_address: string;
  tag?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transaction_hash?: string;
  network_fee?: number;
  processing_fee?: number;
  failure_reason?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
    full_name: string;
  };
}

interface WalletBalance {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  crypto_type?: string;
  updated_at: string;
  user?: {
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

const Payments: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [walletBalances, setWalletBalances] = useState<WalletBalance[]>([]);
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
  const [withdrawalStatus, setWithdrawalStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('30');

  // Dialog states
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [withdrawalNotes, setWithdrawalNotes] = useState('');
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPaymentData();
    }
  }, [user, paymentStatus, paymentMethod, withdrawalStatus, searchTerm, dateRange]);

  const fetchPaymentData = async () => {
    setLoading(true);
    try {
      // Fetch payments with filters
      let paymentsQuery = supabase
        .from('payments')
        .select(`
          *,
          user:users(id, email, full_name),
          order:orders(id, order_number)
        `)
        .order('created_at', { ascending: false });

      if (paymentStatus !== 'all') {
        paymentsQuery = paymentsQuery.eq('status', paymentStatus);
      }
      if (paymentMethod !== 'all') {
        paymentsQuery = paymentsQuery.eq('payment_method', paymentMethod);
      }
      if (searchTerm) {
        paymentsQuery = paymentsQuery.or(`user.email.ilike.%${searchTerm}%,user.full_name.ilike.%${searchTerm}%,order_id.ilike.%${searchTerm}%`);
      }
      if (dateRange !== 'all') {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
        paymentsQuery = paymentsQuery.gte('created_at', daysAgo.toISOString());
      }

      const { data: paymentsData, error: paymentsError } = await paymentsQuery;

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);

      // Fetch withdrawals with filters
      let withdrawalsQuery = supabase
        .from('withdrawals')
        .select(`
          *,
          user:users(id, email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (withdrawalStatus !== 'all') {
        withdrawalsQuery = withdrawalsQuery.eq('status', withdrawalStatus);
      }
      if (searchTerm) {
        withdrawalsQuery = withdrawalsQuery.or(`user.email.ilike.%${searchTerm}%,user.full_name.ilike.%${searchTerm}%,to_address.ilike.%${searchTerm}%`);
      }
      if (dateRange !== 'all') {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
        withdrawalsQuery = withdrawalsQuery.gte('created_at', daysAgo.toISOString());
      }

      const { data: withdrawalsData, error: withdrawalsError } = await withdrawalsQuery;

      if (withdrawalsError) throw withdrawalsError;
      setWithdrawals(withdrawalsData || []);

      // Fetch wallet balances
      const { data: balancesData, error: balancesError } = await supabase
        .from('wallet_balances')
        .select(`
          *,
          user:users(id, email, full_name)
        `)
        .order('updated_at', { ascending: false })
        .limit(100);

      if (balancesError) throw balancesError;
      setWalletBalances(balancesData || []);

      // Calculate stats
      const completedPayments = paymentsData?.filter(p => p.status === 'completed') || [];
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

      setStats({
        totalRevenue: completedPayments.reduce((sum, p) => sum + p.amount, 0),
        todayRevenue: todayPayments.reduce((sum, p) => sum + p.amount, 0),
        monthRevenue: monthPayments.reduce((sum, p) => sum + p.amount, 0),
        totalTransactions: paymentsData?.length || 0,
        pendingPayments: paymentsData?.filter(p => p.status === 'pending').length || 0,
        completedPayments: completedPayments.length,
        failedPayments: paymentsData?.filter(p => p.status === 'failed').length || 0,
        totalWithdrawals: withdrawalsData?.length || 0,
        pendingWithdrawals: withdrawalsData?.filter(w => w.status === 'pending').length || 0
      });

    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalAction = async (withdrawalId: string, action: 'approve' | 'reject') => {
    setProcessingAction(withdrawalId);
    try {
      const updateData: any = {
        status: action === 'approve' ? 'processing' : 'cancelled',
        admin_notes: withdrawalNotes
      };

      if (action === 'reject') {
        // Refund the amount back to user's wallet
        const withdrawal = withdrawals.find(w => w.id === withdrawalId);
        if (withdrawal) {
          await supabase.rpc('add_to_wallet_balance', {
            p_user_id: withdrawal.user_id,
            p_amount: withdrawal.amount,
            p_currency: withdrawal.currency
          });
        }
      }

      const { error } = await supabase
        .from('withdrawals')
        .update(updateData)
        .eq('id', withdrawalId);

      if (error) throw error;

      setWithdrawalNotes('');
      setSelectedWithdrawal(null);
      fetchPaymentData();
    } catch (error) {
      console.error('Error processing withdrawal:', error);
    } finally {
      setProcessingAction(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      pending: { variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      completed: { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      failed: { variant: 'destructive', icon: <XCircle className="w-3 h-3" /> },
      refunded: { variant: 'outline', icon: <RefreshCw className="w-3 h-3" /> },
      cancelled: { variant: 'outline', icon: <XCircle className="w-3 h-3" /> },
      processing: { variant: 'secondary', icon: <RefreshCw className="w-3 h-3" /> }
    };

    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons: Record<string, React.ReactNode> = {
      stripe: <CreditCard className="w-4 h-4" />,
      paypal: <DollarSign className="w-4 h-4" />,
      crypto: <Bitcoin className="w-4 h-4" />,
      wallet: <Wallet className="w-4 h-4" />
    };
    return icons[method] || <CreditCard className="w-4 h-4" />;
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
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <p className="text-muted-foreground">Manage payments, withdrawals, and financial transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedPayments} completed
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
            <CardTitle className="text-sm font-medium">Withdrawals</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWithdrawals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingWithdrawals} pending
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
                  placeholder="Search by email, name, or ID..."
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
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="wallets">Wallet Balances</TabsTrigger>
          <TabsTrigger value="stripe">Stripe Info</TabsTrigger>
        </TabsList>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Payment Transactions</CardTitle>
                  <CardDescription>All payment transactions and their status</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="wallet">Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs">
                        {payment.id.slice(0, 8)}...
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
                      <TableCell>
                        <div className="text-sm">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
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
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Payment Details - Secure View
                              </DialogTitle>
                              <DialogDescription>
                                Complete payment information with security and fraud detection data
                              </DialogDescription>
                            </DialogHeader>
                            {selectedPayment && (
                              <Tabs defaultValue="overview" className="space-y-4">
                                <TabsList className="grid w-full grid-cols-5">
                                  <TabsTrigger value="overview">Overview</TabsTrigger>
                                  <TabsTrigger value="card">Card Info</TabsTrigger>
                                  <TabsTrigger value="security">Security</TabsTrigger>
                                  <TabsTrigger value="billing">Billing</TabsTrigger>
                                  <TabsTrigger value="disputes">Disputes</TabsTrigger>
                                </TabsList>

                                {/* Overview Tab */}
                                <TabsContent value="overview" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Payment ID</Label>
                                      <p className="font-mono text-sm bg-muted p-2 rounded">{selectedPayment.id}</p>
                                    </div>
                                    <div>
                                      <Label>Status</Label>
                                      <div>{getStatusBadge(selectedPayment.status)}</div>
                                    </div>
                                    <div>
                                      <Label>Amount</Label>
                                      <p className="font-medium text-lg">${selectedPayment.amount} {selectedPayment.currency}</p>
                                    </div>
                                    <div>
                                      <Label>Method</Label>
                                      <div className="flex items-center gap-2">
                                        {getPaymentMethodIcon(selectedPayment.payment_method)}
                                        <span className="capitalize">{selectedPayment.payment_method}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {selectedPayment.payment_intent_id && (
                                    <div>
                                      <Label>Stripe Payment Intent</Label>
                                      <div className="flex items-center gap-2">
                                        <p className="font-mono text-sm bg-muted p-2 rounded flex-1">{selectedPayment.payment_intent_id}</p>
                                        <Button variant="outline" size="sm">
                                          <ExternalLink className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {selectedPayment.stripe_charge_id && (
                                    <div>
                                      <Label>Stripe Charge ID</Label>
                                      <p className="font-mono text-sm bg-muted p-2 rounded">{selectedPayment.stripe_charge_id}</p>
                                    </div>
                                  )}
                                  
                                  {selectedPayment.paypal_order_id && (
                                    <div>
                                      <Label>PayPal Order ID</Label>
                                      <p className="font-mono text-sm bg-muted p-2 rounded">{selectedPayment.paypal_order_id}</p>
                                    </div>
                                  )}
                                  
                                  {selectedPayment.crypto_transaction_id && (
                                    <div>
                                      <Label>Crypto Transaction</Label>
                                      <div className="space-y-2">
                                        <p className="font-mono text-sm bg-muted p-2 rounded">{selectedPayment.crypto_transaction_id}</p>
                                        {selectedPayment.crypto_address && (
                                          <p className="text-sm text-muted-foreground">To: {selectedPayment.crypto_address}</p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {selectedPayment.failure_reason && (
                                    <Alert>
                                      <AlertTriangle className="h-4 w-4" />
                                      <AlertDescription>{selectedPayment.failure_reason}</AlertDescription>
                                    </Alert>
                                  )}
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Created</Label>
                                      <p className="text-sm">{new Date(selectedPayment.created_at).toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <Label>Updated</Label>
                                      <p className="text-sm">{new Date(selectedPayment.updated_at).toLocaleString()}</p>
                                    </div>
                                  </div>
                                </TabsContent>

                                {/* Card Information Tab */}
                                <TabsContent value="card" className="space-y-4">
                                  {selectedPayment.payment_details ? (
                                    <div className="space-y-6">
                                      {/* Card Details */}
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="flex items-center gap-2">
                                            <CreditCard className="w-5 h-5" />
                                            Card Information
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label>Card Number</Label>
                                              <p className="font-mono text-lg">****-****-****-{selectedPayment.payment_details.card_last4}</p>
                                            </div>
                                            <div>
                                              <Label>Card Brand</Label>
                                              <div className="flex items-center gap-2">
                                                <Badge variant="outline">{selectedPayment.payment_details.card_brand}</Badge>
                                                <span className="text-sm text-muted-foreground">{selectedPayment.payment_details.card_funding}</span>
                                              </div>
                                            </div>
                                            <div>
                                              <Label>Expiration</Label>
                                              <p className="font-medium">
                                                {selectedPayment.payment_details.card_exp_month}/{selectedPayment.payment_details.card_exp_year}
                                              </p>
                                            </div>
                                            <div>
                                              <Label>Card Country</Label>
                                              <div className="flex items-center gap-2">
                                                <Globe className="w-4 h-4" />
                                                <span>{selectedPayment.payment_details.card_country}</span>
                                              </div>
                                            </div>
                                            <div className="col-span-2">
                                              <Label>Card Fingerprint</Label>
                                              <p className="font-mono text-sm bg-muted p-2 rounded">{selectedPayment.payment_details.card_fingerprint}</p>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>

                                      {/* 3D Secure Information */}
                                      {selectedPayment.payment_details.three_d_secure && (
                                        <Card>
                                          <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                              <Shield className="w-5 h-5" />
                                              3D Secure Verification
                                            </CardTitle>
                                          </CardHeader>
                                          <CardContent>
                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <Label>Authenticated</Label>
                                                <div className="flex items-center gap-2">
                                                  {selectedPayment.payment_details.three_d_secure.authenticated ? (
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                  ) : (
                                                    <XCircle className="w-4 h-4 text-red-500" />
                                                  )}
                                                  <span>{selectedPayment.payment_details.three_d_secure.authenticated ? 'Yes' : 'No'}</span>
                                                </div>
                                              </div>
                                              <div>
                                                <Label>Version</Label>
                                                <p className="font-medium">{selectedPayment.payment_details.three_d_secure.version}</p>
                                              </div>
                                              <div>
                                                <Label>Result</Label>
                                                <Badge variant={selectedPayment.payment_details.three_d_secure.result === 'authenticate_successful' ? 'default' : 'destructive'}>
                                                  {selectedPayment.payment_details.three_d_secure.result}
                                                </Badge>
                                              </div>
                                              <div>
                                                <Label>Method</Label>
                                                <p className="font-medium">{selectedPayment.payment_details.three_d_secure.method}</p>
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      )}

                                      {/* Stripe Metadata */}
                                      {selectedPayment.payment_details.stripe_metadata && (
                                        <Card>
                                          <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                              <FileText className="w-5 h-5" />
                                              Stripe Metadata
                                            </CardTitle>
                                          </CardHeader>
                                          <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <Label>Payment Method ID</Label>
                                                <p className="font-mono text-sm">{selectedPayment.payment_details.stripe_metadata.payment_method_id}</p>
                                              </div>
                                              <div>
                                                <Label>Customer ID</Label>
                                                <p className="font-mono text-sm">{selectedPayment.payment_details.stripe_metadata.customer_id}</p>
                                              </div>
                                              <div>
                                                <Label>Balance Transaction ID</Label>
                                                <p className="font-mono text-sm">{selectedPayment.payment_details.stripe_metadata.balance_transaction_id}</p>
                                              </div>
                                              <div>
                                                <Label>Transfer Group</Label>
                                                <p className="font-mono text-sm">{selectedPayment.payment_details.stripe_metadata.transfer_group}</p>
                                              </div>
                                            </div>
                                            {selectedPayment.payment_details.stripe_metadata.receipt_url && (
                                              <div>
                                                <Label>Receipt URL</Label>
                                                <Button variant="outline" size="sm" className="mt-1">
                                                  <Receipt className="w-4 h-4 mr-2" />
                                                  View Receipt
                                                </Button>
                                              </div>
                                            )}
                                          </CardContent>
                                        </Card>
                                      )}
                                    </div>
                                  ) : (
                                    <Alert>
                                      <Info className="h-4 w-4" />
                                      <AlertDescription>No card details available for this payment method.</AlertDescription>
                                    </Alert>
                                  )}
                                </TabsContent>

                                {/* Security Tab */}
                                <TabsContent value="security" className="space-y-4">
                                  {selectedPayment.payment_details?.fraud_detection ? (
                                    <div className="space-y-6">
                                      {/* Risk Assessment */}
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5" />
                                            Risk Assessment
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="grid grid-cols-3 gap-4">
                                            <div>
                                              <Label>Risk Score</Label>
                                              <div className="flex items-center gap-2">
                                                <div className="text-2xl font-bold">{selectedPayment.payment_details.fraud_detection.risk_score}</div>
                                                <Badge variant={
                                                  selectedPayment.payment_details.fraud_detection.risk_level === 'low' ? 'default' :
                                                  selectedPayment.payment_details.fraud_detection.risk_level === 'medium' ? 'secondary' : 'destructive'
                                                }>
                                                  {selectedPayment.payment_details.fraud_detection.risk_level.toUpperCase()}
                                                </Badge>
                                              </div>
                                            </div>
                                            <div>
                                              <Label>IP Address</Label>
                                              <div className="flex items-center gap-2">
                                                <Globe className="w-4 h-4" />
                                                <p className="font-mono">{selectedPayment.payment_details.fraud_detection.ip_address}</p>
                                              </div>
                                            </div>
                                            <div>
                                              <Label>IP Country</Label>
                                              <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                <span>{selectedPayment.payment_details.fraud_detection.ip_country}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>

                                      {/* Device Information */}
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="flex items-center gap-2">
                                            <Monitor className="w-5 h-5" />
                                            Device Information
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label>Device Fingerprint</Label>
                                              <p className="font-mono text-sm bg-muted p-2 rounded">{selectedPayment.payment_details.fraud_detection.device_fingerprint}</p>
                                            </div>
                                            <div>
                                              <Label>User Agent</Label>
                                              <p className="text-sm truncate">{selectedPayment.payment_details.fraud_detection.browser_info.user_agent}</p>
                                            </div>
                                            <div>
                                              <Label>Language</Label>
                                              <p className="font-medium">{selectedPayment.payment_details.fraud_detection.browser_info.language}</p>
                                            </div>
                                            <div>
                                              <Label>Timezone</Label>
                                              <p className="font-medium">{selectedPayment.payment_details.fraud_detection.browser_info.timezone}</p>
                                            </div>
                                            <div>
                                              <Label>Screen Resolution</Label>
                                              <p className="font-medium">{selectedPayment.payment_details.fraud_detection.browser_info.screen_resolution}</p>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>

                                      {/* Velocity Checks */}
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="flex items-center gap-2">
                                            <Activity className="w-5 h-5" />
                                            Velocity Checks
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="grid grid-cols-3 gap-4">
                                            <div>
                                              <Label>Attempts (Last Hour)</Label>
                                              <p className="text-2xl font-bold">{selectedPayment.payment_details.fraud_detection.velocity_checks.attempts_last_hour}</p>
                                            </div>
                                            <div>
                                              <Label>Attempts (Last Day)</Label>
                                              <p className="text-2xl font-bold">{selectedPayment.payment_details.fraud_detection.velocity_checks.attempts_last_day}</p>
                                            </div>
                                            <div>
                                              <Label>Unique Cards Used</Label>
                                              <p className="text-2xl font-bold">{selectedPayment.payment_details.fraud_detection.velocity_checks.unique_cards_used}</p>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  ) : (
                                    <Alert>
                                      <Info className="h-4 w-4" />
                                      <AlertDescription>No security information available for this payment.</AlertDescription>
                                    </Alert>
                                  )}
                                </TabsContent>

                                {/* Billing Tab */}
                                <TabsContent value="billing" className="space-y-4">
                                  {selectedPayment.payment_details?.billing_address ? (
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                          <MapPin className="w-5 h-5" />
                                          Billing Address
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label>Name</Label>
                                            <p className="font-medium">{selectedPayment.payment_details.billing_address.name}</p>
                                          </div>
                                          <div>
                                            <Label>Email</Label>
                                            <p className="font-medium">{selectedPayment.payment_details.billing_address.email}</p>
                                          </div>
                                          <div>
                                            <Label>Phone</Label>
                                            <p className="font-medium">{selectedPayment.payment_details.billing_address.phone}</p>
                                          </div>
                                          <div>
                                            <Label>Address Line 1</Label>
                                            <p className="font-medium">{selectedPayment.payment_details.billing_address.line1}</p>
                                          </div>
                                          {selectedPayment.payment_details.billing_address.line2 && (
                                            <div>
                                              <Label>Address Line 2</Label>
                                              <p className="font-medium">{selectedPayment.payment_details.billing_address.line2}</p>
                                            </div>
                                          )}
                                          <div>
                                            <Label>City</Label>
                                            <p className="font-medium">{selectedPayment.payment_details.billing_address.city}</p>
                                          </div>
                                          <div>
                                            <Label>State</Label>
                                            <p className="font-medium">{selectedPayment.payment_details.billing_address.state}</p>
                                          </div>
                                          <div>
                                            <Label>Postal Code</Label>
                                            <p className="font-medium">{selectedPayment.payment_details.billing_address.postal_code}</p>
                                          </div>
                                          <div>
                                            <Label>Country</Label>
                                            <div className="flex items-center gap-2">
                                              <Globe className="w-4 h-4" />
                                              <span>{selectedPayment.payment_details.billing_address.country}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ) : (
                                    <Alert>
                                      <Info className="h-4 w-4" />
                                      <AlertDescription>No billing information available for this payment.</AlertDescription>
                                    </Alert>
                                  )}
                                </TabsContent>

                                {/* Disputes Tab */}
                                <TabsContent value="disputes" className="space-y-4">
                                  {selectedPayment.payment_details?.dispute ? (
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                          <Ban className="w-5 h-5" />
                                          Dispute Information
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label>Dispute ID</Label>
                                            <p className="font-mono text-sm">{selectedPayment.payment_details.dispute.id}</p>
                                          </div>
                                          <div>
                                            <Label>Reason</Label>
                                            <p className="font-medium">{selectedPayment.payment_details.dispute.reason}</p>
                                          </div>
                                          <div>
                                            <Label>Status</Label>
                                            <Badge variant="outline">{selectedPayment.payment_details.dispute.status}</Badge>
                                          </div>
                                          <div>
                                            <Label>Amount</Label>
                                            <p className="font-medium">${selectedPayment.payment_details.dispute.amount} {selectedPayment.payment_details.dispute.currency}</p>
                                          </div>
                                          <div>
                                            <Label>Evidence Due By</Label>
                                            <p className="font-medium">{new Date(selectedPayment.payment_details.dispute.evidence_due_by).toLocaleDateString()}</p>
                                          </div>
                                          <div>
                                            <Label>Is Chargeback</Label>
                                            <div className="flex items-center gap-2">
                                              {selectedPayment.payment_details.dispute.is_chargeback ? (
                                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                              ) : (
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                              )}
                                              <span>{selectedPayment.payment_details.dispute.is_chargeback ? 'Yes' : 'No'}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ) : (
                                    <Alert>
                                      <CheckCircle className="h-4 w-4" />
                                      <AlertDescription>No disputes or chargebacks for this payment.</AlertDescription>
                                    </Alert>
                                  )}

                                  {/* Refunds */}
                                  {selectedPayment.payment_details?.refunds && selectedPayment.payment_details.refunds.length > 0 && (
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                          <RefreshCw className="w-5 h-5" />
                                          Refund History
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="space-y-4">
                                          {selectedPayment.payment_details.refunds.map((refund, index) => (
                                            <div key={refund.id} className="border rounded-lg p-4">
                                              <div className="grid grid-cols-4 gap-4">
                                                <div>
                                                  <Label>Refund ID</Label>
                                                  <p className="font-mono text-sm">{refund.id}</p>
                                                </div>
                                                <div>
                                                  <Label>Amount</Label>
                                                  <p className="font-medium">${refund.amount} {refund.currency}</p>
                                                </div>
                                                <div>
                                                  <Label>Reason</Label>
                                                  <p className="text-sm">{refund.reason}</p>
                                                </div>
                                                <div>
                                                  <Label>Status</Label>
                                                  <Badge variant="outline">{refund.status}</Badge>
                                                </div>
                                              </div>
                                              <div className="mt-2">
                                                <Label>Date</Label>
                                                <p className="text-sm">{new Date(refund.created_at).toLocaleString()}</p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )}
                                </TabsContent>
                              </Tabs>
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
      </Tabs>
    </div>
  );
};

export default Payments;
