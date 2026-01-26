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
  Info,
  Copy
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

const Payments: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stripeAttempts, setStripeAttempts] = useState<StripePaymentAttempt[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [securityLogs, setSecurityLogs] = useState<PaymentSecurityLog[]>([]);
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

  // Dialog states
  const [selectedPayment, setSelectedPayment] = useState<StripePaymentAttempt | PendingPayment | null>(null);
  const [selectedLog, setSelectedLog] = useState<PaymentSecurityLog | null>(null);
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
        .from('stripe_payment_attempts')
        .select(`
          *,
          users!user_id(id, email, full_name)
        `)
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
        .from('pending_payments')
        .select(`
          *,
          users!user_id(id, email, full_name)
        `)
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
        .from('payment_security_logs')
        .select(`
          *,
          users!user_id(id, email, full_name)
        `)
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

      // Calculate stats
      const allPayments = [...(stripeData || []), ...(pendingData || [])];
      const completedPayments = allPayments.filter(p => p.status === 'completed' || p.status === 'succeeded');
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
        totalRevenue: completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        todayRevenue: todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        monthRevenue: monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        totalTransactions: allPayments.length,
        pendingPayments: allPayments.filter(p => p.status === 'pending' || p.status === 'pending_confirmation').length,
        completedPayments: completedPayments.length,
        failedPayments: allPayments.filter(p => p.status === 'failed' || p.status === 'rejected').length,
        totalWithdrawals: 0, // Not implemented in current schema
        pendingWithdrawals: 0
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
      setError('Payment approved successfully');
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
      setError('Payment rejected successfully');
    } catch (error: any) {
      console.error('Error rejecting payment:', error);
      setError('Failed to reject payment');
    } finally {
      setProcessingAction(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setError('Copied to clipboard!');
  };

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

                                  {selectedPayment.status === 'pending_confirmation' && (
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
      </Tabs>
    </div>
  );
};

export default Payments;
