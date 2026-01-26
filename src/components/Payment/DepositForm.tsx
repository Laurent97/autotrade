import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cryptoService } from '@/lib/supabase/crypto-service';
import { depositService } from '@/lib/supabase/deposit-service';
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
  Clock,
  Copy,
  ExternalLink
} from 'lucide-react';

interface DepositFormData {
  amount: number;
  paymentMethod: 'stripe' | 'paypal' | 'crypto' | 'bank';
  cardNumber?: string;
  cardExpiry?: string;
  cardCvc?: string;
  email?: string;
  cryptoType?: string;
  cryptoAddress?: string;
  cryptoTransactionId?: string;
  xrpTag?: string;
  bankAccount?: string;
  bankName?: string;
  routingNumber?: string;
}

export default function DepositForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [cryptoAddresses, setCryptoAddresses] = useState<any[]>([]);
  const [loadingCrypto, setLoadingCrypto] = useState(false);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<string[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [formData, setFormData] = useState<DepositFormData>({
    amount: 0,
    paymentMethod: 'stripe'
  });

  // Load crypto addresses and available payment methods from database
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('=== DEPOSIT FORM DEBUG: Loading data from database ===');
        
        // Test database connection first
        console.log('=== DEPOSIT FORM DEBUG: Testing database connection...');
        const connectionTest = await depositService.testConnection();
        console.log('=== DEPOSIT FORM DEBUG: Connection test result:', connectionTest);
        
        if (!connectionTest.success) {
          console.error('=== DEPOSIT FORM DEBUG: Database connection failed:', connectionTest.message);
          toast({
            title: "Database Connection Failed",
            description: connectionTest.message,
            variant: "destructive"
          });
          return;
        }
        
        console.log('=== DEPOSIT FORM DEBUG: Database connection test passed:', connectionTest.message);
        
        // Load crypto addresses
        console.log('=== DEPOSIT FORM DEBUG: Loading crypto addresses...');
        setLoadingCrypto(true);
        const cryptoResult = await cryptoService.getActiveCryptoAddresses();
        console.log('=== DEPOSIT FORM DEBUG: Crypto service result:', cryptoResult);
        
        if (cryptoResult.error) {
          console.error('=== DEPOSIT FORM DEBUG: Error loading crypto addresses:', cryptoResult.error);
          toast({
            title: "Crypto Loading Error",
            description: `Failed to load crypto addresses: ${cryptoResult.error?.message || 'Unknown error'}`,
            variant: "destructive"
          });
        } else {
          console.log('=== DEPOSIT FORM DEBUG: Crypto addresses loaded:', cryptoResult.data?.length || 0);
          console.log('=== DEPOSIT FORM DEBUG: Crypto addresses data:', cryptoResult.data);
          setCryptoAddresses(cryptoResult.data || []);
          
          if (cryptoResult.data && cryptoResult.data.length > 0) {
            console.log('=== DEPOSIT FORM DEBUG: Showing success toast for crypto addresses');
            toast({
              title: "Crypto Wallets Available",
              description: `${cryptoResult.data.length} cryptocurrency wallets loaded.`,
            });
          } else {
            console.log('=== DEPOSIT FORM DEBUG: No crypto addresses found, showing error toast');
            toast({
              title: "No Crypto Wallets",
              description: "No active cryptocurrency wallets found in database.",
              variant: "destructive"
            });
          }
        }
        setLoadingCrypto(false);

        // Load available payment methods
        setLoadingPaymentMethods(true);
        const methods = ['stripe', 'paypal', 'crypto', 'bank'];
        const availableMethods: string[] = [];
        
        for (const method of methods) {
          const { available } = await depositService.isPaymentMethodAvailable(method, 'partner');
          if (available) {
            availableMethods.push(method);
          }
        }
        
        console.log('Available payment methods:', availableMethods);
        setAvailablePaymentMethods(availableMethods);
        setLoadingPaymentMethods(false);
        
        // Set default payment method to first available
        if (availableMethods.length > 0 && !availableMethods.includes(formData.paymentMethod)) {
          setFormData({ ...formData, paymentMethod: availableMethods[0] as any });
        }
        
      } catch (error) {
        console.error('Error loading deposit form data:', error);
        toast({
          title: "Loading Error",
          description: "Failed to load payment options. Please refresh the page.",
          variant: "destructive"
        });
      }
    };

    loadData();
  }, []);

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
  ].filter(method => availablePaymentMethods.includes(method.id));

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
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to make a deposit.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('Submitting deposit request to database:', {
        user_id: user.id,
        amount: formData.amount,
        payment_method: formData.paymentMethod,
        payment_details: formData
      });

      // Create deposit request object
      const depositRequest = {
        user_id: user.id,
        amount: formData.amount,
        payment_method: formData.paymentMethod as any,
        payment_details: {
          cardNumber: formData.cardNumber,
          cardExpiry: formData.cardExpiry,
          cardCvc: formData.cardCvc,
          email: formData.email,
          cryptoType: formData.cryptoType,
          cryptoAddress: formData.cryptoType ? 
            cryptoAddresses.find(c => c.crypto_type === formData.cryptoType)?.address : undefined,
          xrpTag: formData.cryptoType === 'XRP' ? 
            cryptoAddresses.find(c => c.crypto_type === formData.cryptoType)?.xrp_tag : undefined,
          cryptoTransactionId: formData.cryptoTransactionId,
          bankName: formData.bankName,
          bankAccount: formData.bankAccount,
          routingNumber: formData.routingNumber
        },
        status: 'pending' as const,
        description: `Deposit request via ${formData.paymentMethod}`
      };

      let result;
      
      // Process payment based on method
      switch (formData.paymentMethod) {
        case 'stripe':
          result = await depositService.processStripePayment(depositRequest);
          break;
        case 'paypal':
          result = await depositService.processPayPalPayment(depositRequest);
          break;
        case 'crypto':
          result = await depositService.processCryptoPayment(depositRequest);
          break;
        case 'bank':
          result = await depositService.processBankTransferPayment(depositRequest);
          break;
        default:
          throw new Error('Unsupported payment method');
      }

      if (result.error) {
        throw result.error;
      }

      console.log('Deposit request submitted successfully:', result.data);
      
      // Show success message
      toast({
        title: "Deposit Request Submitted!",
        description: `$${formData.amount.toFixed(2)} deposit request has been submitted for admin approval.`,
      });
      
      // Navigate back to wallet
      navigate('/partner/dashboard/wallet', {
        state: {
          success: true,
          message: `Deposit request of $${formData.amount.toFixed(2)} has been submitted for admin approval. You will be notified once it's approved.`,
          amount: formData.amount,
          pendingApproval: true,
          transactionId: result.data?.transaction?.id
        }
      });
      
    } catch (error: any) {
      console.error('Error submitting deposit request:', error);
      toast({
        title: "Deposit Request Failed",
        description: error?.message || "There was an error submitting your deposit request. Please try again.",
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
                <CardTitle className="text-lg">Cryptocurrency Deposit</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Select Cryptocurrency</label>
                <div className="mt-2 space-y-2">
                  {loadingCrypto ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Loading available cryptocurrencies...</span>
                    </div>
                  ) : cryptoAddresses.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No cryptocurrency wallets available at the moment.
                      <div className="text-xs text-red-500 mt-1">
                        Debug: cryptoAddresses.length = {cryptoAddresses.length}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-xs text-green-500 mb-2">
                        Debug: Found {cryptoAddresses.length} crypto addresses
                      </div>
                      {cryptoAddresses.map((crypto) => (
                        <div
                          key={crypto.id}
                          onClick={() => setFormData({ ...formData, cryptoType: crypto.crypto_type })}
                          className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-primary ${
                            formData.cryptoType === crypto.crypto_type ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                                <Bitcoin className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                              </div>
                              <div>
                                <h4 className="font-medium text-foreground">{crypto.crypto_type}</h4>
                                <p className="text-sm text-muted-foreground">{crypto.network}</p>
                                <p className="text-xs text-muted-foreground">{crypto.address}</p>
                              </div>
                            </div>
                            {formData.cryptoType === crypto.crypto_type && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {formData.cryptoType && (
                <>
                  <div>
                    <label className="text-sm font-medium text-foreground">Deposit Address</label>
                    <div className="mt-1 space-y-2">
                      {cryptoAddresses
                        .filter(crypto => crypto.crypto_type === formData.cryptoType)
                        .map((crypto) => (
                          <div key={crypto.id} className="border rounded-lg p-3 bg-muted/50">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 mr-2">
                                <p className="font-mono text-sm text-foreground break-all">
                                  {crypto.address}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Network: {crypto.network}
                                </p>
                                {crypto.crypto_type === 'XRP' && crypto.xrp_tag && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    XRP Tag: {crypto.xrp_tag}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const addressToCopy = crypto.crypto_type === 'XRP' && crypto.xrp_tag 
                                    ? `${crypto.address}\nXRP Tag: ${crypto.xrp_tag}`
                                    : crypto.address;
                                  navigator.clipboard.writeText(addressToCopy);
                                  toast({
                                    title: "Address Copied!",
                                    description: crypto.crypto_type === 'XRP' && crypto.xrp_tag 
                                      ? "XRP address and tag copied to clipboard"
                                      : "Crypto address copied to clipboard",
                                  });
                                }}
                                className="flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3" />
                                Copy
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Transaction ID (Optional)</label>
                    <Input
                      placeholder="Enter transaction hash after sending"
                      value={formData.cryptoTransactionId || ''}
                      onChange={(e) => setFormData({ ...formData, cryptoTransactionId: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="flex items-start gap-2 text-sm text-orange-800 dark:text-orange-200">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium mb-1">Important Instructions:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Send {formData.cryptoType} to the address above</li>
                          <li>Make sure you're sending on the correct network</li>
                          {formData.cryptoType === 'XRP' && (
                            <li>Include the XRP Tag (476565842) when sending XRP</li>
                          )}
                          <li>Minimum deposit: $10.00 USD equivalent</li>
                          <li>Transaction will be credited after confirmation</li>
                          <li>Save your transaction ID for reference</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
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
            {loadingPaymentMethods ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-muted-foreground">Loading available payment methods...</span>
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Payment Methods Available</h3>
                <p className="text-muted-foreground">No payment methods are currently available. Please try again later.</p>
              </div>
            ) : (
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
            )}

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
                disabled={loading || loadingPaymentMethods || paymentMethods.length === 0}
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
            {loading ? 'Submitting Request...' : `Submit Deposit Request ${formatCurrency(formData.amount)}`}
          </Button>
        </div>
      )}
    </div>
  );
}
