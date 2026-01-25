import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, CheckCircle, Clock, Bitcoin, AlertCircle, ExternalLink } from 'lucide-react';
import { usePayment } from '@/contexts/PaymentContext';
import { useAuth } from '@/contexts/AuthContext';

interface CryptoPaymentFormProps {
  orderId: string;
  amount: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface CryptoOption {
  symbol: string;
  name: string;
  address: string;
  icon: string;
  color: string;
}

export const CryptoPaymentForm: React.FC<CryptoPaymentFormProps> = ({
  orderId,
  amount,
  onSuccess,
  onError
}) => {
  const { user } = useAuth();
  const { recordPendingPayment } = usePayment();
  const [step, setStep] = useState<'selection' | 'payment' | 'confirmation' | 'submitted'>('selection');
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoOption | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fixed: Ensure proper component structure
  console.log('CryptoPaymentForm mounted with:', { orderId, amount });

  const cryptoOptions: CryptoOption[] = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      icon: '₿',
      color: 'text-orange-600',
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      icon: 'Ξ',
      color: 'text-blue-600',
    },
    {
      symbol: 'USDT',
      name: 'Tether (ERC20)',
      address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      icon: '₮',
      color: 'text-green-600',
    }
  ];

  const handleCryptoSelect = (crypto: CryptoOption) => {
    setSelectedCrypto(crypto);
    setStep('payment');
  };

  const handleCopyAddress = async () => {
    if (!selectedCrypto) return;
    try {
      await navigator.clipboard.writeText(selectedCrypto.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const handleCopyAmount = async () => {
    try {
      await navigator.clipboard.writeText(amount.toString());
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    } catch (err) {
      console.error('Failed to copy amount:', err);
    }
  };

  const handleTransactionSubmit = async () => {
    if (!transactionId.trim()) {
      setError('Please enter a valid transaction ID');
      return;
    }

    if (!selectedCrypto) {
      setError('Please select a cryptocurrency');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Record crypto payment with TX ID
      await recordPendingPayment({
        order_id: orderId,
        customer_id: user?.id || '',
        payment_method: 'crypto',
        amount,
        crypto_address: selectedCrypto.address,
        crypto_transaction_id: transactionId,
        crypto_type: selectedCrypto.symbol
      });

      setStep('submitted');
      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      console.error('Error recording crypto payment:', err);
      setError('Failed to record payment. Please try again.');
      if (onError) {
        onError('Failed to record payment. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="crypto-payment-form space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          <Bitcoin className="w-5 h-5 inline mr-2" />
          Pay with Cryptocurrency
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose your preferred cryptocurrency and send the payment
        </p>
      </div>

      {step === 'selection' && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Select Cryptocurrency:</h4>
          <div className="grid gap-3">
            {cryptoOptions.map((crypto) => (
              <button
                key={crypto.symbol}
                onClick={() => handleCryptoSelect(crypto)}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  selectedCrypto?.symbol === crypto.symbol
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl ${crypto.color}`}>{crypto.icon}</span>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{crypto.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{crypto.symbol}</div>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedCrypto?.symbol === crypto.symbol
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedCrypto?.symbol === crypto.symbol && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'payment' && selectedCrypto && (
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Send {selectedCrypto.name} Payment
            </h4>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedCrypto.name} Address:
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={selectedCrypto.address}
                    readOnly
                    className="font-mono bg-white dark:bg-gray-900 dark:border-gray-600"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAddress}
                    className="dark:border-gray-600 dark:text-gray-300"
                  >
                    {copiedAddress ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Amount to Send:
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={amount.toFixed(2)}
                    readOnly
                    className="font-mono bg-white dark:bg-gray-900 dark:border-gray-600"
                  />
                  <span className="text-gray-600 dark:text-gray-400">USD</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAmount}
                    className="dark:border-gray-600 dark:text-gray-300"
                  >
                    {copiedAmount ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reference:
                </Label>
                <div className="font-mono text-sm bg-white dark:bg-gray-900 p-2 rounded border border-gray-300 dark:border-gray-600 mt-1">
                  Order #{orderId}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="transactionId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Transaction Hash/ID
              </Label>
              <Input
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction hash after sending"
                className="dark:bg-gray-800 dark:border-gray-600"
              />
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('selection')}
                className="dark:border-gray-600 dark:text-gray-300"
              >
                Back
              </Button>
              <Button
                onClick={handleTransactionSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Bitcoin className="w-4 h-4" />
                    I've Sent the Payment
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 'confirmation' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Confirming Payment
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we verify your cryptocurrency transaction...
          </p>
        </div>
      )}

      {step === 'submitted' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Payment Submitted Successfully
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your cryptocurrency payment has been submitted and is awaiting confirmation.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                <strong>Transaction ID:</strong> {transactionId}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoPaymentForm;
