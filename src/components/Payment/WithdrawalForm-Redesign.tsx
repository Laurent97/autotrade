import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Banknote, 
  Mail, 
  Bitcoin, 
  CreditCard, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Shield,
  Clock,
  Download,
  Zap
} from 'lucide-react';

interface WithdrawalFormData {
  amount: number;
  withdrawalMethod: 'bank' | 'paypal' | 'crypto' | 'card';
  bankName?: string;
  bankAccount?: string;
  routingNumber?: string;
  email?: string;
  cryptoAddress?: string;
  cardNumber?: string;
  cardHolder?: string;
}

export default function WithdrawalForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [balance, setBalance] = useState(0);
  const [formData, setFormData] = useState<WithdrawalFormData>({
    amount: 0,
    withdrawalMethod: 'bank'
  });

  // Load user balance
  useEffect(() => {
    // This would typically come from your wallet service
    // For now, using a mock balance
    setBalance(1250.00);
  }, []);

  const withdrawalMethods = [
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: <Banknote className="w-5 h-5" />,
      description: 'Direct transfer to your bank account (1-3 business days)',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      fee: 2.50
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: <Mail className="w-5 h-5" />,
      description: 'Instant withdrawal to your PayPal account',
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
      fee: 0
    },
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      icon: <Bitcoin className="w-5 h-5" />,
      description: 'Withdraw in Bitcoin, Ethereum, or other crypto',
      color: 'text-orange-500',
      bgColor: 'bg-orange-100',
      fee: 1.00
    },
    {
      id: 'card',
      name: 'Card Transfer',
      icon: <CreditCard className="w-5 h-5" />,
      description: 'Transfer to your debit/credit card',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      fee: 3.00
    }
  ];

  const handleWithdrawalMethodSelect = (method: string) => {
    setFormData({ ...formData, withdrawalMethod: method as WithdrawalFormData['withdrawalMethod'] });
    setStep(2);
  };

  const handleAmountSubmit = () => {
    if (formData.amount < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum withdrawal amount is $10.00",
        variant: "destructive"
      });
      return;
    }
    if (formData.amount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal.",
        variant: "destructive"
      });
      return;
    }
    setStep(2);
  };

  const handleWithdrawalSubmit = async () => {
    setLoading(true);
    
    try {
      // Simulate API call for withdrawal processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      toast({
        title: "Withdrawal Requested!",
        description: `$${formData.amount.toFixed(2)} withdrawal request has been submitted for processing.`,
      });
      
      // Navigate back to wallet
      navigate('/partner/dashboard/wallet', {
        state: {
          success: true,
          message: `Withdrawal request of $${formData.amount.toFixed(2)} has been submitted successfully.`,
          amount: formData.amount
        }
      });
      
    } catch (error) {
      toast({
        title: "Withdrawal Failed",
        description: "There was an error processing your withdrawal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getFee = () => {
    const method = withdrawalMethods.find(m => m.id === formData.withdrawalMethod);
    return method?.fee || 0;
  };

  const getNetAmount = () => {
    return formData.amount - getFee();
  };

  const renderWithdrawalMethodForm = () => {
    switch (formData.withdrawalMethod) {
      case 'bank':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Banknote className="w-5 h-5 text-green-600" />
                <CardTitle className="text-lg">Bank Transfer Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Bank Name</label>
                <Input
                  placeholder="Your Bank Name"
                  value={formData.bankName || ''}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Account Number</label>
                <Input
                  placeholder="Your Account Number"
                  value={formData.bankAccount || ''}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Routing Number</label>
                <Input
                  placeholder="Your Routing Number"
                  value={formData.routingNumber || ''}
                  onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
                  <Clock className="w-4 h-4" />
                  <span>Processing time: 1-3 business days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'paypal':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-lg">PayPal Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">PayPal Email</label>
                <Input
                  type="email"
                  placeholder="your-email@example.com"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                  <Zap className="w-4 h-4" />
                  <span>Instant withdrawal to your PayPal account</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'crypto':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Bitcoin className="w-5 h-5 text-orange-500" />
                <CardTitle className="text-lg">Cryptocurrency Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Crypto Address</label>
                <Input
                  placeholder="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
                  value={formData.cryptoAddress || ''}
                  onChange={(e) => setFormData({ ...formData, cryptoAddress: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-orange-800 dark:text-orange-200">
                  <AlertCircle className="w-4 h-4" />
                  <span>Crypto withdrawal will be processed within 15-30 minutes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'card':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-lg">Card Transfer Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Card Number</label>
                <Input
                  placeholder="1234 5678 9012 3456"
                  value={formData.cardNumber || ''}
                  onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Cardholder Name</label>
                <Input
                  placeholder="John Doe"
                  value={formData.cardHolder || ''}
                  onChange={(e) => setFormData({ ...formData, cardHolder: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-purple-800 dark:text-purple-200">
                  <Shield className="w-4 h-4" />
                  <span>Card transfer will be processed within 1-2 business days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Amount Selection */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Enter Withdrawal Amount</CardTitle>
            <p className="text-muted-foreground">How much would you like to withdraw?</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium text-foreground">Amount (USD)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="mt-1 text-lg"
                min="10"
                max={balance}
                step="0.01"
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[25, 50, 100, 250, 500, 1000].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => setFormData({ ...formData, amount })}
                  className="h-12"
                  disabled={amount > balance}
                >
                  ${amount}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Available Balance:</span>
                <span className="font-medium text-foreground">{formatCurrency(balance)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Minimum Withdrawal:</span>
                <span className="font-medium text-foreground">$10.00</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Processing Fee:</span>
                <span className="font-medium text-foreground">{formatCurrency(getFee())}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>You'll Receive:</span>
                <span className="text-green-600">{formatCurrency(getNetAmount())}</span>
              </div>
            </div>

            <Button 
              onClick={handleAmountSubmit}
              disabled={formData.amount < 10 || formData.amount > balance}
              className="w-full"
            >
              Continue to Withdrawal Method
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Withdrawal Method Selection */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Choose Withdrawal Method</CardTitle>
            <p className="text-muted-foreground">Select how you want to withdraw {formatCurrency(getNetAmount())}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {withdrawalMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => handleWithdrawalMethodSelect(method.id)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-primary ${
                    formData.withdrawalMethod === method.id ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${method.bgColor}`}>
                      <span className={method.color}>{method.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{method.name}</h3>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                      <p className="text-xs text-muted-foreground">Fee: {formatCurrency(method.fee)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleWithdrawalSubmit}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Processing...' : `Withdraw ${formatCurrency(getNetAmount())}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Withdrawal Form */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              onClick={() => setStep(1)}
              size="sm"
            >
              Back to Amount
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Withdrawal Method:</span>
              <Badge className="bg-primary/10 text-primary">
                {withdrawalMethods.find(m => m.id === formData.withdrawalMethod)?.name}
              </Badge>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(getNetAmount())}
              </span>
            </div>
          </div>
          {renderWithdrawalMethodForm()}
          
          <Button 
            onClick={handleWithdrawalSubmit}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Processing Withdrawal...' : `Withdraw ${formatCurrency(getNetAmount())}`}
          </Button>
        </div>
      )}
    </div>
  );
}
