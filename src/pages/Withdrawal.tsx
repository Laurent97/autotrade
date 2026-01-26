import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { walletService } from '../lib/supabase/wallet-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import WithdrawalForm from '../components/Payment/WithdrawalForm-Redesign';
import { 
  ArrowLeft, 
  Download, 
  Wallet, 
  TrendingDown, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  CreditCard, 
  Bitcoin, 
  Mail, 
  Banknote,
  HelpCircle,
  DollarSign
} from 'lucide-react';

export default function Withdrawal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);

  // Real-time wallet balance
  const { data: walletData, loading: walletLoading, refresh: refreshWallet } = useRealtimeSubscription(
    async () => {
      if (!user) return [];
      const { data } = await walletService.getBalance(user.id);
      return data ? [data] : [];
    },
    {
      table: 'wallet_balances',
      event: '*',
      filter: `user_id=eq.${user?.id}`
    }
  );

  const balance = walletData?.[0]?.balance || 0;

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/auth', { state: { from: '/payment/withdraw' } });
    }
    setLoading(false);
  }, [user, navigate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getWithdrawalMethodInfo = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'bank':
        return { icon: <Banknote className="w-5 h-5" />, name: 'Bank Transfer', color: 'text-blue-600', bgColor: 'bg-blue-100' };
      case 'stripe':
        return { icon: <CreditCard className="w-5 h-5" />, name: 'Card', color: 'text-purple-600', bgColor: 'bg-purple-100' };
      case 'paypal':
        return { icon: <Mail className="w-5 h-5" />, name: 'PayPal', color: 'text-blue-500', bgColor: 'bg-blue-100' };
      case 'crypto':
        return { icon: <Bitcoin className="w-5 h-5" />, name: 'Crypto', color: 'text-orange-500', bgColor: 'bg-orange-100' };
      default:
        return { icon: <DollarSign className="w-5 h-5" />, name: 'Payment', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  if (loading || walletLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/partner/dashboard/wallet')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Wallet
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Withdraw Funds</h1>
            <p className="text-muted-foreground">Transfer money from your wallet to your account</p>
          </div>
        </div>

        {/* Current Balance Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                  <Wallet className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Available Balance</CardTitle>
                  <p className="text-sm text-muted-foreground">Available for withdrawal</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(balance)}
                </div>
                <p className="text-xs text-muted-foreground">Real-time balance</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Withdrawal Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Withdrawal Request</CardTitle>
            <p className="text-muted-foreground">Enter withdrawal details and select payment method</p>
          </CardHeader>
          <CardContent>
            <WithdrawalForm />
          </CardContent>
        </Card>

        {/* Withdrawal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg">Processing Time</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Bank Transfer</span>
                  <Badge className="bg-green-100 text-green-800">1-3 business days</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">PayPal</span>
                  <Badge className="bg-green-100 text-green-800">Instant</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Crypto</span>
                  <Badge className="bg-green-100 text-green-800">15-30 minutes</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                  <TrendingDown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <CardTitle className="text-lg">Withdrawal Limits</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Minimum Withdrawal</span>
                  <span className="text-sm font-medium text-foreground">$10.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Maximum Daily</span>
                  <span className="text-sm font-medium text-foreground">$5,000.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Maximum Monthly</span>
                  <span className="text-sm font-medium text-foreground">$50,000.00</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Withdrawal Methods */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Available Withdrawal Methods</CardTitle>
            <p className="text-muted-foreground">Choose your preferred withdrawal method</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { method: 'bank', name: 'Bank Transfer', description: 'Direct transfer to your bank account', icon: <Banknote className="w-6 h-6" />, color: 'text-blue-600', bgColor: 'bg-blue-100' },
                { method: 'paypal', name: 'PayPal', description: 'Instant transfer to PayPal account', icon: <Mail className="w-6 h-6" />, color: 'text-blue-500', bgColor: 'bg-blue-100' },
                { method: 'crypto', name: 'Cryptocurrency', description: 'Withdraw in Bitcoin, Ethereum, etc.', icon: <Bitcoin className="w-6 h-6" />, color: 'text-orange-500', bgColor: 'bg-orange-100' },
                { method: 'stripe', name: 'Card Transfer', description: 'Transfer to your debit/credit card', icon: <CreditCard className="w-6 h-6" />, color: 'text-purple-600', bgColor: 'bg-purple-100' }
              ].map((method) => (
                <div key={method.method} className="border border-border rounded-lg p-4 hover:border-primary transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${method.bgColor}`}>
                      <span className={method.color}>{method.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{method.name}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security & Support */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-lg">Secure Withdrawals</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                All withdrawals are processed securely with encryption and fraud protection. Your funds are safe with us.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg">24/7 Support</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Need help with your withdrawal? Our support team is available 24/7 to assist you with any questions.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">How long do withdrawals take?</p>
                  <p className="text-sm text-muted-foreground">
                    Processing times vary by method: Bank transfers (1-3 business days), PayPal (instant), Crypto (15-30 minutes).
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Are there any fees?</p>
                  <p className="text-sm text-muted-foreground">
                    Small processing fees may apply depending on the withdrawal method. Bank transfers may have a $2.50 fee.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">What if my withdrawal is rejected?</p>
                  <p className="text-sm text-muted-foreground">
                    If your withdrawal is rejected, the funds will be returned to your wallet within 24 hours with an explanation.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
