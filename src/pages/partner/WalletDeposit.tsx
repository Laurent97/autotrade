import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import PaymentOptions from '../../components/Payment/PaymentOptions';
import { walletService } from '../../lib/supabase/wallet-service';
import { ArrowLeft, Shield, Zap, CreditCard, HelpCircle, Wallet } from 'lucide-react';

export default function WalletDeposit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [amount, setAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Check for dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const htmlElement = document.documentElement;
    setIsDarkMode(htmlElement.classList.contains('dark'));
  }, []);

  const presetAmounts = [10, 25, 50, 100, 250, 500];

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/auth', { 
        state: { from: '/partner/wallet/deposit' }
      });
      return;
    }

    // Load wallet balance
    const loadBalance = async () => {
      try {
        const { data } = await walletService.getBalance(user.id);
        if (data) {
          setBalance(data.balance || 0);
        }
      } catch (error) {
        console.error('Error loading balance:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBalance();
  }, [user, navigate]);

  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount);
    setIsCustom(false);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setAmount(numValue);
      setIsCustom(true);
    }
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      // Process the deposit using wallet service
      const { success, error } = await walletService.processDeposit(
        user.id,
        amount,
        paymentData.paymentMethod || 'payment gateway',
        paymentData.transactionId
      );

      if (success) {
        // Show success message
        alert(`Deposit successful! $${amount.toFixed(2)} has been added to your wallet.`);
        
        // Redirect back to wallet
        navigate('/partner/dashboard/wallet');
      } else {
        throw error;
      }
    } catch (error: any) {
      console.error('Error processing deposit:', error);
      alert(`Deposit failed: ${error?.message || 'Unknown error occurred'}`);
    }
  };

  const handlePaymentError = (error: string) => {
    alert(`Deposit failed: ${error}`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className={`flex-grow ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className={`rounded-lg p-8 text-center ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading wallet information...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={`flex-grow ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => navigate('/partner/dashboard/wallet')}
                className={`flex items-center mb-6 transition-colors ${
                  isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                }`}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Wallet
              </button>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <h1 className={`text-4xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Add Funds to Wallet
                  </h1>
                  <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Choose an amount to deposit to your partner wallet
                  </p>
                </div>
                <div className={`p-6 rounded-xl border-2 ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center">
                    <Wallet className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Current Balance</p>
                      <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(balance)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left Column - Amount Selection & Payment */}
              <div className="xl:col-span-2 space-y-8">
                {/* Amount Selection */}
                <div className={`rounded-xl shadow-lg p-8 ${
                  isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                }`}>
                  <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Select Amount
                  </h2>
                  
                  {/* Preset Amounts */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                    {presetAmounts.map((presetAmount) => (
                      <button
                        key={presetAmount}
                        onClick={() => handleAmountSelect(presetAmount)}
                        className={`py-4 px-6 rounded-xl border-2 transition-all font-semibold text-lg ${
                          amount === presetAmount && !isCustom
                            ? isDarkMode 
                              ? 'border-blue-500 bg-blue-900/30 text-blue-300 shadow-lg'
                              : 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg'
                            : isDarkMode
                              ? 'border-gray-600 hover:border-gray-500 text-gray-300 hover:bg-gray-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        ${presetAmount}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div className="space-y-4">
                    <label className={`block text-lg font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Custom Amount
                    </label>
                    <div className="relative">
                      <span className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-lg font-semibold ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        $
                      </span>
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => handleCustomAmountChange(e.target.value)}
                        placeholder="Enter custom amount"
                        min="1"
                        step="0.01"
                        className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } ${
                          isCustom ? 'border-blue-500' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Selected Amount Display */}
                  {amount > 0 && (
                    <div className={`mt-8 p-6 rounded-xl border-2 ${
                      isDarkMode 
                        ? 'bg-blue-900/30 border-blue-700'
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-lg font-semibold ${
                          isDarkMode ? 'text-blue-300' : 'text-blue-800'
                        }`}>
                          Deposit Amount:
                        </span>
                        <span className={`text-3xl font-bold ${
                          isDarkMode ? 'text-blue-200' : 'text-blue-900'
                        }`}>
                          ${amount.toFixed(2)}
                        </span>
                      </div>
                      <div className={`text-base font-medium ${
                        isDarkMode ? 'text-blue-300/80' : 'text-blue-700'
                      }`}>
                        New Balance: {formatCurrency(balance + amount)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Options */}
                {amount > 0 && (
                  <div className={`rounded-xl shadow-lg p-8 ${
                    isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                  }`}>
                    <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Payment Method
                    </h2>
                    <PaymentOptions
                      amount={amount}
                      orderId={`WALLET-DEPOSIT-${Date.now()}`}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                    />
                  </div>
                )}
              </div>

              {/* Right Column - Info */}
              <div className="xl:col-span-1 space-y-8">
                {/* Wallet Info */}
                <div className={`rounded-xl shadow-lg p-6 ${
                  isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                }`}>
                  <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Wallet Information
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${
                        isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
                      }`}>
                        <Zap className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                      </div>
                      <div>
                        <div className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Instant Processing
                        </div>
                        <div className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Funds available immediately
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${
                        isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                      }`}>
                        <Shield className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                      <div>
                        <div className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Secure Transactions
                        </div>
                        <div className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          256-bit encryption
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${
                        isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
                      }`}>
                        <CreditCard className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                      </div>
                      <div>
                        <div className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Multiple Payment Options
                        </div>
                        <div className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Card, PayPal, Crypto
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage Info */}
                <div className={`rounded-xl border-2 p-6 ${
                  isDarkMode 
                    ? 'bg-blue-900/20 border-blue-800/50'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <h3 className={`text-xl font-bold mb-4 ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-800'
                  }`}>
                    How Wallet Funds Work
                  </h3>
                  <ul className={`text-base space-y-3 ${
                    isDarkMode ? 'text-blue-200/90' : 'text-blue-700'
                  }`}>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Funds are automatically used for order payments</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>No transaction fees on internal transfers</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Available for withdrawal after 24 hours</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Minimum withdrawal: $10</span>
                    </li>
                  </ul>
                </div>

                {/* Support */}
                <div className={`rounded-xl border-2 p-6 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center mb-4">
                    <HelpCircle className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Need Help?
                    </h3>
                  </div>
                  <p className={`text-base mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Having trouble with your deposit? Contact our support team.
                  </p>
                  <button
                    onClick={() => window.open('https://wa.me/1234567890', '_blank')}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center ${
                      isDarkMode 
                        ? 'bg-green-700 hover:bg-green-600 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                    </svg>
                    WhatsApp Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}