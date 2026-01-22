import { supabase } from './client';

export interface CryptoDepositRequest {
  userId: string;
  cryptoType: 'BTC' | 'ETH' | 'USDT_TRX' | 'XRP';
  amount: number;
  usdValue: number;
  fromAddress: string;
  transactionHash: string;
}

export interface WithdrawalRequest {
  userId: string;
  cryptoType: 'BTC' | 'ETH' | 'USDT_TRX' | 'XRP';
  amount: number;
  usdValue: number;
  toAddress: string;
  tag?: string; // For XRP
}

export interface PayPalOrder {
  orderId: string;
  amount: number;
  currency?: string;
  payerEmail?: string;
  paymentSource?: string;
}

export const paymentService = {
  // Get platform crypto addresses
  async getPlatformCryptoAddresses() {
    const { data, error } = await supabase
      .from('platform_crypto_addresses')
      .select('*')
      .eq('is_active', true);

    return { data, error };
  },

  // Get user wallet balance
  async getWalletBalance(userId: string) {
    const { data, error } = await supabase
      .from('wallet_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If no balance record exists, create one
    if (error && error.code === 'PGRST116') {
      const { data: newBalance, error: insertError } = await supabase
        .from('wallet_balances')
        .insert({ user_id: userId })
        .select()
        .single();

      return { data: newBalance, error: insertError };
    }

    return { data, error };
  },

  // Create crypto deposit
  async createCryptoDeposit(deposit: CryptoDepositRequest) {
    const platformAddress = await this.getPlatformAddress(deposit.cryptoType);

    const { data, error } = await supabase
      .from('crypto_transactions')
      .insert({
        user_id: deposit.userId,
        transaction_type: 'deposit',
        crypto_type: deposit.cryptoType,
        amount: deposit.amount,
        usd_value: deposit.usdValue,
        from_address: deposit.fromAddress,
        to_address: platformAddress?.data?.address || '',
        transaction_hash: deposit.transactionHash,
        status: 'pending',
        required_confirmations: deposit.cryptoType === 'BTC' ? 3 : 12,
      })
      .select()
      .single();

    return { data, error };
  },

  // Create withdrawal request
  async createWithdrawalRequest(withdrawal: WithdrawalRequest) {
    // First check if user has enough balance
    const { data: wallet } = await this.getWalletBalance(withdrawal.userId);

    if (!wallet || Number(wallet.balance || 0) < withdrawal.usdValue) {
      throw new Error('Insufficient balance');
    }

    const { data, error } = await supabase
      .from('crypto_transactions')
      .insert({
        user_id: withdrawal.userId,
        transaction_type: 'withdrawal',
        crypto_type: withdrawal.cryptoType,
        amount: withdrawal.amount,
        usd_value: withdrawal.usdValue,
        to_address: withdrawal.toAddress,
        tag: withdrawal.tag,
        status: 'pending',
      })
      .select()
      .single();

    // Deduct from wallet balance
    if (data && !error) {
      await supabase
        .from('wallet_balances')
        .update({
          balance: Number(wallet.balance) - withdrawal.usdValue,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', withdrawal.userId);
    }

    return { data, error };
  },

  // Get platform address by crypto type
  async getPlatformAddress(cryptoType: string) {
    const { data, error } = await supabase
      .from('platform_crypto_addresses')
      .select('*')
      .eq('crypto_type', cryptoType)
      .single();

    return { data, error };
  },

  // Get user crypto transactions
  async getUserCryptoTransactions(userId: string, limit = 20) {
    const { data, error } = await supabase
      .from('crypto_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data, error };
  },

  // Create PayPal transaction
  async createPayPalTransaction(paypalData: PayPalOrder) {
    const { data, error } = await supabase
      .from('paypal_transactions')
      .insert({
        paypal_order_id: paypalData.orderId,
        amount: paypalData.amount,
        currency: paypalData.currency || 'USD',
        payer_email: paypalData.payerEmail,
        payment_source: paypalData.paymentSource,
        status: 'created',
      })
      .select()
      .single();

    return { data, error };
  },

  // Update PayPal transaction status
  async updatePayPalTransaction(orderId: string, status: string, captureId?: string) {
    const { data, error } = await supabase
      .from('paypal_transactions')
      .update({
        status,
        capture_id: captureId,
        updated_at: new Date().toISOString(),
      })
      .eq('paypal_order_id', orderId)
      .select()
      .single();

    return { data, error };
  },

  // Link order to payment
  async linkOrderToPayment(
    orderId: string,
    paymentType: string,
    amount: number,
    transactionRef?: string
  ) {
    const { data, error } = await supabase
      .from('order_payments')
      .insert({
        order_id: orderId,
        payment_type: paymentType,
        amount: amount,
        transaction_reference: transactionRef,
        status: paymentType === 'paypal' ? 'processing' : 'pending',
      })
      .select()
      .single();

    return { data, error };
  },

  // Get cryptocurrency current prices (mock - integrate with API later)
  async getCryptoPrices() {
    // In production, integrate with CoinGecko, Binance, etc.
    return {
      BTC: 45000,
      ETH: 3000,
      USDT: 1,
      XRP: 0.5,
    };
  },

  // Calculate crypto amount from USD
  calculateCryptoAmount(usdAmount: number, cryptoType: string, prices: any) {
    const price = prices[cryptoType === 'USDT_TRX' ? 'USDT' : cryptoType] || 1;
    return usdAmount / price;
  },
};
