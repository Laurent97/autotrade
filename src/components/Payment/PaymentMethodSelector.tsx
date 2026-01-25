import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePayment } from '@/contexts/PaymentContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserTypeDetection } from '@/utils/userTypeDetection';
import StripePaymentForm from './StripePaymentForm';
import StripeDataCollection from './StripeDataCollection';
import PayPalPaymentForm from './PayPalPaymentForm';
import CryptoPaymentForm from './CryptoPaymentForm';
import WalletPayment from './WalletPayment';
import { CreditCard, Mail, Bitcoin, Wallet, AlertTriangle, User } from 'lucide-react';

export type PaymentMethod = 'stripe' | 'paypal' | 'crypto' | 'wallet';

interface PaymentMethodSelectorProps {
  orderId: string;
  amount: number;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
}

interface PaymentMethodInfo {
  id: PaymentMethod;
  name: string;
  icon: React.ReactNode;
  description: string;
  available: boolean;
  requiresConfirmation?: boolean;
  securityNote?: string;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  orderId,
  amount,
  onPaymentSuccess,
  onPaymentError
}) => {
  const { user, loading: authLoading } = useAuth();
  const { availableMethods, isLoading: paymentLoading, canUseMethod, paymentConfigs } = usePayment();
  const { getUserTypeInfo, logPaymentMethodAccess } = useUserTypeDetection();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const userTypeInfo = getUserTypeInfo();
  const isLoading = authLoading || paymentLoading;

  const getPaymentMethodInfo = (method: PaymentMethod): PaymentMethodInfo => {
    const canUse = canUseMethod(method);
    
    // Log payment method access for debugging
    logPaymentMethodAccess(method, canUse, canUse ? 'User has access based on role' : 'User does not have access based on role');
    
    switch (method) {
      case 'stripe':
        return {
          id: method,
          name: 'Credit/Debit Card',
          icon: <CreditCard className="h-5 w-5" />,
          description: 'Pay securely with your credit or debit card',
          available: canUse,
          securityNote: userTypeInfo.type === 'customer' ? 'Security restricted for your account type' : undefined
        };
      case 'paypal':
        return {
          id: method,
          name: 'PayPal',
          icon: <Mail className="h-5 w-5" />,
          description: 'Pay with your PayPal account',
          available: canUse,
          requiresConfirmation: true
        };
      case 'crypto':
        return {
          id: method,
          name: 'Cryptocurrency',
          icon: <Bitcoin className="h-5 w-5" />,
          description: 'Pay with Bitcoin, Ethereum, or USDT',
          available: canUse,
          requiresConfirmation: true
        };
      case 'wallet':
        return {
          id: method,
          name: 'Wallet Balance',
          icon: <Wallet className="h-5 w-5" />,
          description: 'Use your account wallet balance',
          available: canUse
        };
      default:
        return {
          id: method,
          name: method,
          icon: <Wallet className="h-5 w-5" />,
          description: 'Payment method',
          available: false
        };
    }
  };

  const renderPaymentForm = () => {
    if (!selectedMethod) return null;

    switch (selectedMethod) {
      case 'stripe':
        // Use data collection for customers, regular form for partners/admins
        if (userTypeInfo.type === 'customer') {
          return (
            <StripeDataCollection
              orderId={orderId}
              amount={amount}
              onSuccess={onPaymentSuccess}
              onError={onPaymentError}
            />
          );
        } else {
          return (
            <StripePaymentForm
              orderId={orderId}
              amount={amount}
              onSuccess={onPaymentSuccess}
              onError={onPaymentError}
            />
          );
        }
      case 'paypal':
        return (
          <PayPalPaymentForm
            orderId={orderId}
            amount={amount}
            onSuccess={onPaymentSuccess}
            onError={onPaymentError}
          />
        );
      case 'crypto':
        return (
          <CryptoPaymentForm
            orderId={orderId}
            amount={amount}
            onSuccess={onPaymentSuccess}
            onError={onPaymentError}
          />
        );
      case 'wallet':
        return (
          <WalletPayment
            orderId={orderId}
            amount={amount}
            onSuccess={onPaymentSuccess}
            onError={onPaymentError}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="payment-method-selector">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
          <span>
            {authLoading ? 'Loading user profile...' : 'Loading payment methods...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-method-selector space-y-6">
      {/* Debug Information */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">🔍 Debug Information</h4>
        <div className="text-sm space-y-1">
          <div className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-gray-100">User Logged In:</strong> {user ? 'Yes' : 'No'}</div>
          <div className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-gray-100">User Email:</strong> {user?.email || 'N/A'}</div>
          <div className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-gray-100">User Type:</strong> {userTypeInfo.type}</div>
          <div className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-gray-100">Available Methods:</strong> {availableMethods.join(', ')}</div>
          <div className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-gray-100">Payment Configs:</strong> {Object.keys(paymentConfigs).join(', ')}</div>
        </div>
      </div>

      {/* User Type Display */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Account Type</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{userTypeInfo.description}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl ${userTypeInfo.color}`}>
              {userTypeInfo.icon}
            </span>
            <Badge variant="outline" className={userTypeInfo.color}>
              {userTypeInfo.label}
            </Badge>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Select Payment Method</h2>
        <p className="text-gray-600 dark:text-gray-400">Choose your preferred payment method to complete your order</p>
      </div>

      {!selectedMethod && (
        <div className="grid gap-4 md:grid-cols-2">
          {(['stripe', 'paypal', 'crypto', 'wallet'] as PaymentMethod[]).map((method) => {
            const methodInfo = getPaymentMethodInfo(method);
            
            if (!methodInfo.available && method !== 'stripe') {
              return null; // Hide unavailable methods except Stripe (for security logging)
            }

            return (
              <Card
                key={method}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !methodInfo.available ? 'opacity-50 cursor-not-allowed' : ''
                } dark:bg-gray-800 dark:border-gray-700`}
                onClick={() => methodInfo.available && setSelectedMethod(method)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        method === 'stripe' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' :
                        method === 'paypal' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' :
                        method === 'crypto' ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400' :
                        'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                      }`}>
                        {methodInfo.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900 dark:text-white">{methodInfo.name}</CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{methodInfo.description}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      {methodInfo.requiresConfirmation && (
                        <Badge variant="secondary" className="text-xs">
                          Admin Confirmation Required
                        </Badge>
                      )}
                      {methodInfo.securityNote && (
                        <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                          <AlertTriangle className="h-3 w-3" />
                          <span>{methodInfo.securityNote}</span>
                        </div>
                      )}
                    </div>
                    
                    {methodInfo.available ? (
                      <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300">
                        Select
                      </Button>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        Not Available
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedMethod && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${
                selectedMethod === 'stripe' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' :
                selectedMethod === 'paypal' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' :
                selectedMethod === 'crypto' ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400' :
                'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
              }`}>
                {getPaymentMethodInfo(selectedMethod).icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{getPaymentMethodInfo(selectedMethod).name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{getPaymentMethodInfo(selectedMethod).description}</p>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setSelectedMethod(null)}
              className="dark:border-gray-600 dark:text-gray-300"
            >
              Change Method
            </Button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            {renderPaymentForm()}
          </div>
        </div>
      )}

      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Payment Information</h4>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Order ID:</span>
            <span className="font-medium text-gray-900 dark:text-white">#{orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Amount:</span>
            <span className="font-medium text-gray-900 dark:text-white">${amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">User Type:</span>
            <span className="font-medium text-gray-900 dark:text-white">{userTypeInfo.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
