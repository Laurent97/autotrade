import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import { walletService } from '../../lib/supabase/wallet-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import DepositForm from '../../components/Payment/DepositForm';
import { 
  ArrowLeft, 
  Shield, 
  Zap, 
  CreditCard, 
  HelpCircle, 
  Wallet,
  Upload,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  Bitcoin,
  Mail,
  TrendingUp
} from 'lucide-react';

export default function WalletDeposit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
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
      navigate('/auth', { 
        state: { from: '/partner/wallet/deposit' }
      });
      return;
    }
  }, [user, navigate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  if (walletLoading) {
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Deposit Funds</h1>
            <p className="text-muted-foreground">Add money to your partner wallet</p>
          </div>
        </div>

        {/* Current Balance Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Current Balance</CardTitle>
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

        {/* Deposit Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Deposit Form</CardTitle>
            <p className="text-muted-foreground">Choose amount and payment method to add funds to your wallet</p>
          </CardHeader>
          <CardContent>
            <DepositForm />
          </CardContent>
        </Card>

        {/* Security & Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-lg">Secure Deposit</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                All transactions are encrypted and secure. Your financial information is protected with industry-standard security.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg">Instant Processing</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Deposits are processed instantly and added to your wallet immediately after payment confirmation.
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-lg">Multiple Options</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Choose from various payment methods including cards, PayPal, and cryptocurrency for your convenience.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">Deposit Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Processing Time</p>
                  <p className="text-sm text-muted-foreground">
                    Most deposits are processed instantly. Some payment methods may take a few minutes for confirmation.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Minimum Deposit</p>
                  <p className="text-sm text-muted-foreground">The minimum deposit amount is $10.00 USD.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Refund Policy</p>
                  <p className="text-sm text-muted-foreground">
                    Deposits are refundable within 24 hours if there are any issues with the transaction.
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
