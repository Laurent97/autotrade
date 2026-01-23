import { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripeService, stripePromise } from '../../lib/stripe/stripe-service';
import { useAuth } from '../../contexts/AuthContext';

interface StripePaymentProps {
  amount: number;
  orderId?: string;
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
}

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

function StripePaymentForm({ amount, orderId, onSuccess, onError }: StripePaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check for dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const htmlElement = document.documentElement;
    setIsDarkMode(htmlElement.classList.contains('dark'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !user) {
      setError('Stripe not loaded or user not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment intent
      const { clientSecret, paymentIntentId } = await stripeService.createPaymentIntent({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'USD',
        userId: user.id,
        orderId,
      });

      if (!clientSecret || clientSecret === 'mock_client_secret') {
        throw new Error('Stripe payment requires backend API configuration. Please set up your Stripe backend endpoint.');
      }

      // Confirm payment with card
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: user.email,
          },
        },
      });

      if (confirmError) {
        throw confirmError;
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess({
          orderId: orderId || `ORD-${Date.now()}`,
          amount,
          method: 'stripe',
          paymentIntentId: paymentIntent.id,
        });
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Payment failed';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: isDarkMode ? '#ffffff' : '#424770',
        '::placeholder': {
          color: isDarkMode ? '#9ca3af' : '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  if (!stripePublishableKey) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h4 className="font-semibold text-yellow-800 mb-2">Stripe Not Configured</h4>
        <p className="text-yellow-700 text-sm">
          Please configure VITE_STRIPE_PUBLISHABLE_KEY in your .env file to use Stripe payments.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/40 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
        <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>Pay with Card</h3>
        <p className={`text-sm mb-4 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
          Enter your card details below. Your payment is secured by Stripe.
        </p>
      </div>

      <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          Card Information
        </label>
        <CardElement options={cardElementOptions} />
      </div>

      {error && (
        <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-red-900/40 border-red-800' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
      >
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>

      <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
        <p>🔒 Your payment information is encrypted and secure</p>
        <p className="mt-1">Powered by Stripe - PCI DSS compliant</p>
      </div>
    </form>
  );
}

export default function StripePayment(props: StripePaymentProps) {
  if (!stripePromise) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h4 className="font-semibold text-yellow-800 mb-2">Stripe Not Available</h4>
        <p className="text-yellow-700 text-sm">
          Stripe is not configured. Please add VITE_STRIPE_PUBLISHABLE_KEY to your .env file.
        </p>
      </div>
    );
  }

  const options: StripeElementsOptions = {
    mode: 'payment',
    amount: Math.round(props.amount * 100),
    currency: 'usd',
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripePaymentForm {...props} />
    </Elements>
  );
}
