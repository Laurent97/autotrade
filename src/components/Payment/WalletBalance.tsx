import { useState, useEffect } from 'react';
import { paymentService } from '../../lib/supabase/payment-service';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function WalletBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Check for dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const htmlElement = document.documentElement;
    setIsDarkMode(htmlElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    if (user) {
      loadBalance();
    }
  }, [user]);

  const loadBalance = async () => {
    if (!user) return;
    
    const { data } = await paymentService.getWalletBalance(user.id);
    setBalance(data);
    setLoading(false);
  };

  if (!user) {
    return (
      <div className={`p-4 rounded-lg border ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50'
      }`}>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          Login to view wallet balance
        </p>
        <Link
          to="/auth"
          className={`inline-block mt-2 transition-colors ${
            isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
          }`}
        >
          Sign in →
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`p-4 rounded-lg border ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50'
      }`}>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2">
            <div className={`h-4 rounded ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
            <div className={`h-6 rounded w-1/2 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-lg border ${
      isDarkMode 
        ? 'bg-gradient-to-r from-blue-900/30 to-green-900/30 border-blue-700/50'
        : 'bg-gradient-to-r from-blue-50 to-green-50 border-blue-200'
    }`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className={`text-lg font-semibold ${
            isDarkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>
            Wallet Balance
          </h3>
          <div className="mt-2">
            <div className={`text-3xl font-bold ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`}>
              ${balance?.balance?.toFixed(2) || '0.00'}
            </div>
            <div className={`text-sm mt-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Available to spend
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Pending
          </div>
          <div className={`text-lg font-semibold ${
            isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
          }`}>
            ${balance?.pending_balance?.toFixed(2) || '0.00'}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link
          to="/payment/crypto-deposit"
          className={`py-2 px-4 rounded-lg text-center transition-colors ${
            isDarkMode 
              ? 'bg-blue-700 hover:bg-blue-600 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          Deposit
        </Link>
        <Link
          to="/payment/withdraw"
          className={`py-2 px-4 rounded-lg text-center transition-colors ${
            isDarkMode
              ? 'bg-gray-700 text-blue-400 border border-blue-600 hover:bg-gray-600'
              : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
          }`}
        >
          Withdraw
        </Link>
      </div>

      <div className={`mt-4 text-xs ${
        isDarkMode ? 'text-gray-500' : 'text-gray-500'
      }`}>
        <p>• Use balance for instant checkout</p>
        <p>• Deposits processed within 10-30 minutes</p>
        <p>• Withdrawals take 24-48 hours</p>
      </div>
    </div>
  );
}
