import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Mail, 
  Bitcoin, 
  Wallet, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Banknote,
  Shield,
  Zap,
  Clock
} from 'lucide-react';

interface DepositFormData {
  amount: number;
  paymentMethod: 'stripe' | 'paypal' | 'crypto' | 'bank';
  cardNumber?: string;
  cardExpiry?: string;
  cardCvc?: string;
  email?: string;
  cryptoAddress?: string;
  bankAccount?: string;
  bankName?: string;
  routingNumber?: string;
}

export default function DepositForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<DepositFormData>({
    amount: 0,
    paymentMethod: 'stripe'
  });

  const paymentMethods = [
    {
      id: 'stripe',
      name: 'Credit/Debit Card',
      icon: <CreditCard className="w-5 h-5" />,
      description: 'Instant deposit using your credit or debit card',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: <Mail className="w-5 h-5" />,
      description: 'Fast and secure PayPal deposit',
      color: 'text-blue-500',
      bgColor: 'bg-blue-100'
    },
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      icon: <Bitcoin className="w-5 h-5" />,
      description: 'Deposit using Bitcoin, Ethereum, or other crypto',
      color: 'text-orange-500',
      bgColor: 'bg-orange-100'
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: <Banknote className="w-5 h-5" />,
      description: 'Direct bank transfer (1-3 business days)',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    }
  ];

  const handlePaymentMethodSelect = (method: string) => {
    setFormData({ ...formData, paymentMethod: method as DepositFormData['paymentMethod'] });
    setStep(2);
  };

  const handleAmountSubmit = () => {
    if (formData.amount < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum deposit amount is $10.00",
        variant: "destructive"
      });
      return;
    }
    setStep(2);
  };

  const handlePaymentSubmit = async () => {
    setLoading(true);
    
    try {
      // Simulate API call for deposit processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      toast({
        title: "Deposit Successful!",
        description: `$${formData.amount.toFixed(2)} has been added to your wallet.`,
      });
      
      // Navigate back to wallet
      navigate('/partner/dashboard/wallet', {
        state: {
          success: true,
          message: `Deposit successful! $${formData.amount.toFixed(2)} has been added to your wallet.`,
          amount: formData.amount
        }
      });
      
    } catch (error) {
      toast({
        title: "Deposit Failed",
        description: "There was an error processing your deposit. Please try again.",
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

  const renderPaymentMethodForm = () => {
    switch (formData.paymentMethod) {
      case 'stripe':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">Card Information</CardTitle>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Expiry Date</label>
                  <Input
                    placeholder="MM/YY"
                    value={formData.cardExpiry || ''}
                    onChange={(e) => setFormData({ ...formData, cardExpiry: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">CVC</label>
                  <Input
                    placeholder="123"
                    value={formData.cardCvc || ''}
                    onChange={(e) => setFormData({ ...formData, cardCvc: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Your card information is encrypted and secure</span>
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
                  <span>You'll be redirected to PayPal to complete the deposit</span>
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
                  <span>Send crypto to the address above. Deposit will be credited after confirmation.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );

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
                  <span>Bank transfers typically take 1-3 business days to process</span>
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
            <CardTitle className="text-xl font-semibold">Enter Deposit Amount</CardTitle>
            <p className="text-muted-foreground">How much would you like to deposit?</p>
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
                >
                  ${amount}
                </Button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Minimum deposit: <span className="font-medium text-foreground">$10.00</span>
              </div>
              <div className="text-lg font-semibold text-foreground">
                Total: {formatCurrency(formData.amount)}
              </div>
            </div>

            <Button 
              onClick={handleAmountSubmit}
              disabled={formData.amount < 10}
              className="w-full"
            >
              Continue to Payment Method
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment Method Selection */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Choose Payment Method</CardTitle>
            <p className="text-muted-foreground">Select how you want to deposit {formatCurrency(formData.amount)}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => handlePaymentMethodSelect(method.id)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-primary ${
                    formData.paymentMethod === method.id ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${method.bgColor}`}>
                      <span className={method.color}>{method.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{method.name}</h3>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
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
                onClick={handlePaymentSubmit}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Processing...' : `Deposit ${formatCurrency(formData.amount)}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Form */}
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
              <span className="text-sm text-muted-foreground">Payment Method:</span>
              <Badge className="bg-primary/10 text-primary">
                {paymentMethods.find(m => m.id === formData.paymentMethod)?.name}
              </Badge>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(formData.amount)}
              </span>
            </div>
          </div>
          {renderPaymentMethodForm()}
          
          <Button 
            onClick={handlePaymentSubmit}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Processing Deposit...' : `Deposit ${formatCurrency(formData.amount)}`}
          </Button>
        </div>
      )}
    </div>
  );
}
