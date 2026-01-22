import { useState, useEffect } from 'react';
import { paymentService } from '@/lib/supabase/payment-service';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Clock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function WithdrawalForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [selectedCrypto, setSelectedCrypto] = useState('USDT_TRX');
  const [withdrawalAddress, setWithdrawalAddress] = useState('');
  const [tag, setTag] = useState('');
  const [usdAmount, setUsdAmount] = useState(0);
  const [cryptoAmount, setCryptoAmount] = useState(0);
  const [prices, setPrices] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const htmlElement = document.documentElement;
    setIsDarkMode(htmlElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    if (user) {
      loadBalance();
      loadPrices();
    }
  }, [user]);

  useEffect(() => {
    calculateCryptoAmount();
  }, [usdAmount, selectedCrypto, prices]);

  const loadBalance = async () => {
    if (!user) return;
    try {
      const { data } = await paymentService.getWalletBalance(user.id);
      if (data) {
        setBalance(Number(data.balance || 0));
        setUsdAmount(Math.min(100, Number(data.balance || 0)));
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const loadPrices = async () => {
    try {
      const pricesData = await paymentService.getCryptoPrices();
      setPrices(pricesData);
    } catch (error) {
      console.error('Error loading prices:', error);
    }
  };

  const calculateCryptoAmount = () => {
    const price = prices[selectedCrypto === 'USDT_TRX' ? 'USDT' : selectedCrypto] || 1;
    const amount = usdAmount / price;
    setCryptoAmount(parseFloat(amount.toFixed(8)));
  };

  const handleWithdrawal = async () => {
    if (!user || !withdrawalAddress) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (usdAmount < 10) {
      toast({
        title: 'Minimum withdrawal',
        description: 'Minimum withdrawal amount is $10',
        variant: 'destructive',
      });
      return;
    }

    if (usdAmount > balance) {
      toast({
        title: 'Insufficient balance',
        description: 'You do not have enough balance',
        variant: 'destructive',
      });
      return;
    }

    if (selectedCrypto === 'XRP' && !tag) {
      toast({
        title: 'XRP Tag Required',
        description: 'XRP withdrawals require a destination tag',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await paymentService.createWithdrawalRequest({
        userId: user.id,
        cryptoType: selectedCrypto as any,
        amount: cryptoAmount,
        usdValue: usdAmount,
        toAddress: withdrawalAddress,
        tag: selectedCrypto === 'XRP' ? tag : undefined,
      });

      toast({
        title: 'Withdrawal submitted',
        description: 'Your withdrawal request has been submitted. Processing time: 24-48 hours.',
      });
      setWithdrawalAddress('');
      setTag('');
      setUsdAmount(0);
      loadBalance();
    } catch (error: any) {
      toast({
        title: 'Withdrawal failed',
        description: error.message || 'Failed to process withdrawal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="w-full">

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-[380px_520px_1fr] gap-8">

          {/* LEFT COLUMN — WITHDRAWAL ACTION */}
          <section className="space-y-6">

            {/* Available Balance */}
            <Card title="Available Balance">
              <div className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-green-900/20 border-green-800/50' : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>Current Balance</p>
                    <p className={`text-3xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                      ${balance.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>Minimum</p>
                    <p className={`text-lg font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>$10.00</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Amount */}
            <Card title="Withdrawal Amount">
              <div className="space-y-4">
                <div className="relative">
                  <span className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-lg font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    $
                  </span>
                  <input
                    type="number"
                    value={usdAmount}
                    onChange={(e) => setUsdAmount(parseFloat(e.target.value) || 0)}
                    className={`w-full rounded-lg px-4 py-3 text-lg font-semibold outline-none pl-12 ${
                      isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
                    }`}
                    min="10"
                    max={balance}
                    step="10"
                  />
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Min: $10.00</span>
                  <button
                    onClick={() => setUsdAmount(balance)}
                    className={`text-sm hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                  >
                    Withdraw All
                  </button>
                </div>
                <div className={`mt-3 rounded-lg px-4 py-3 text-sm ${
                  isDarkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'
                }`}>
                  You will receive: <strong>{cryptoAmount.toFixed(8)} {selectedCrypto}</strong>
                </div>
              </div>
            </Card>

            {/* Crypto Selection */}
            <Card title="Receive As">
              <div className="grid grid-cols-2 gap-4">
                {['USDT_TRX', 'BTC', 'ETH', 'XRP'].map((crypto) => (
                  <CryptoOption
                    key={crypto}
                    active={selectedCrypto === crypto}
                    name={crypto}
                    amount={cryptoAmount.toFixed(8)}
                    onClick={() => setSelectedCrypto(crypto)}
                  />
                ))}
              </div>
            </Card>

            {/* Withdrawal Address */}
            <Card title="Withdrawal Address">
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedCrypto} Address
                  </label>
                  <input
                    type="text"
                    value={withdrawalAddress}
                    onChange={(e) => setWithdrawalAddress(e.target.value)}
                    placeholder={`Paste your ${selectedCrypto} address here`}
                    className={`w-full rounded-lg px-4 py-3 font-mono text-sm outline-none ${
                      isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
                    }`}
                  />
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                    Double-check the address. Funds cannot be recovered if sent to wrong address.
                  </p>
                </div>

                {/* XRP Tag */}
                {selectedCrypto === 'XRP' && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Destination Tag
                    </label>
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      placeholder="Enter destination tag if required"
                      className={`w-full rounded-lg px-4 py-3 font-mono text-sm outline-none ${
                        isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
                      }`}
                    />
                    <div className={`mt-2 p-3 rounded-lg border ${
                      isDarkMode ? 'bg-red-900/20 border-red-800/50' : 'bg-red-50 border-red-200'
                    }`}>
                      <p className={`text-xs font-medium flex items-center ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        XRP withdrawals require a destination tag
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

          </section>

          {/* MIDDLE COLUMN — SUMMARY & STATUS */}
          <section className="space-y-6">

            {/* Withdrawal Summary */}
            <Card title="Withdrawal Summary">
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className={`text-muted-foreground ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    You Send
                  </span>
                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    ${usdAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={`text-muted-foreground ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    You Receive
                  </span>
                  <span className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {cryptoAmount.toFixed(8)} {selectedCrypto}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={`text-muted-foreground ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Platform Fee
                  </span>
                  <span className={`font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>0%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={`text-muted-foreground ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Network Fee
                  </span>
                  <span className={`font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>Covered</span>
                </div>
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between">
                    <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Processing Time</span>
                    <span className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>24-48 hours</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Processing Status */}
            <Card title="Processing Status">
              <StatusItem step={1} title="Request Submitted" active />
              <StatusItem step={2} title="Processing" />
              <StatusItem step={3} title="Completed" />
            </Card>

            {/* Important Notes */}
            <Card>
              <div className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-yellow-900/20 border-yellow-800/50' : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className={`w-4 h-4 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  <h3 className={`font-semibold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                    Important Notes
                  </h3>
                </div>
                <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-yellow-200/90' : 'text-yellow-700'}`}>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    Withdrawals processed within 24-48 business hours
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    Ensure address supports {selectedCrypto} network
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    Network fees covered by platform
                  </li>
                </ul>
              </div>
            </Card>

          </section>

          {/* RIGHT COLUMN — SECURITY & SUPPORT */}
          <section className="space-y-6">

            {/* Security */}
            <Card>
              <div className="flex flex-col items-center text-center space-y-3">
                <Shield className={`h-10 w-10 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Secure & Protected
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Your withdrawals are protected with multi-layer security
                </p>
              </div>
            </Card>

            {/* Processing Times */}
            <Card title="Processing Times">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <div>
                      <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Normal</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Standard processing</div>
                    </div>
                  </div>
                  <span className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>24-48 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                    <div>
                      <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Express</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Contact support</div>
                    </div>
                  </div>
                  <span className={`font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>2-6 hours</span>
                </div>
              </div>
            </Card>

            {/* Submit Button */}
            <Card>
              <button
                onClick={handleWithdrawal}
                disabled={loading || !withdrawalAddress || usdAmount < 10}
                className={`w-full py-4 px-6 rounded-xl font-semibold transition-colors ${
                  loading || !withdrawalAddress || usdAmount < 10
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {loading ? 'Processing...' : 'Submit Withdrawal Request'}
              </button>
            </Card>

          </section>

        </div>
      </div>
    </div>
  );
}

/* ---------- COMPONENTS ---------- */

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const htmlElement = document.documentElement;
    setIsDarkMode(htmlElement.classList.contains('dark'));
  }, []);

  return (
    <div className={`rounded-2xl border p-6 shadow-lg ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      {title && <h2 className={`mb-4 text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h2>}
      {children}
    </div>
  );
}

function CryptoOption({ name, amount, active, onClick }: { 
  name: string; 
  amount: string; 
  active: boolean; 
  onClick: () => void;
}) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const htmlElement = document.documentElement;
    setIsDarkMode(htmlElement.classList.contains('dark'));
  }, []);

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-4 text-center cursor-pointer transition ${
        active 
          ? isDarkMode 
            ? "border-blue-500 bg-blue-900/30" 
            : "border-blue-500 bg-blue-50"
          : isDarkMode
            ? "border-gray-600 hover:bg-gray-700"
            : "border-gray-200 hover:bg-gray-50"
      }`}
    >
      <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{name}</div>
      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{amount}</div>
    </div>
  );
}

function StatusItem({ step, title, active }: { 
  step: number; 
  title: string; 
  active?: boolean;
}) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const htmlElement = document.documentElement;
    setIsDarkMode(htmlElement.classList.contains('dark'));
  }, []);

  return (
    <div className="flex items-center gap-4 py-2">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
          active 
            ? "bg-blue-500 text-white" 
            : isDarkMode
              ? "bg-gray-700 text-gray-400"
              : "bg-gray-200 text-gray-500"
        }`}
      >
        {active ? <CheckCircle size={16} /> : step}
      </div>
      <span className={
        active 
          ? `font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`
          : `${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`
      }>
        {title}
      </span>
    </div>
  );
}
