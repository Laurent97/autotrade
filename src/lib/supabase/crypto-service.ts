import { supabase } from './client';

export interface CryptoAddress {
  id: string;
  crypto_type: 'BTC' | 'ETH' | 'USDT';
  address: string;
  is_active: boolean;
  network: string;
  created_at: string;
  updated_at: string;
}

export const cryptoService = {
  // Get all active crypto addresses
  async getActiveCryptoAddresses(): Promise<{ data: CryptoAddress[]; error: any }> {
    try {
      console.log('Fetching crypto addresses from database...');
      const { data, error } = await supabase
        .from('crypto_addresses')
        .select('*')
        .eq('is_active', true)
        .order('crypto_type', { ascending: true });

      if (error) {
        console.error('Database query error:', error);
        throw error;
      }

      console.log('Crypto addresses fetched successfully:', data?.length || 0, 'addresses');
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching crypto addresses:', error);
      return { data: [], error };
    }
  },

  // Get crypto address by type
  async getCryptoAddressByType(cryptoType: string): Promise<{ data: CryptoAddress | null; error: any }> {
    try {
      console.log(`Fetching ${cryptoType} address from database...`);
      const { data, error } = await supabase
        .from('crypto_addresses')
        .select('*')
        .eq('crypto_type', cryptoType)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error(`Database query error for ${cryptoType}:`, error);
        throw error;
      }

      console.log(`${cryptoType} address fetched successfully:`, data?.address ? 'Address found' : 'No address');
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching crypto address:', error);
      return { data: null, error };
    }
  },

  // Get supported crypto types
  async getSupportedCryptoTypes(): Promise<{ data: string[]; error: any }> {
    try {
      console.log('Fetching supported crypto types from database...');
      const { data, error } = await supabase
        .from('crypto_addresses')
        .select('crypto_type')
        .eq('is_active', true)
        .order('crypto_type', { ascending: true });

      if (error) {
        console.error('Database query error for crypto types:', error);
        throw error;
      }

      const types = data?.map(item => item.crypto_type) || [];
      console.log('Supported crypto types fetched:', types);
      return { data: types, error: null };
    } catch (error) {
      console.error('Error fetching supported crypto types:', error);
      return { data: [], error };
    }
  },

  // Test database connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Testing crypto database connection...');
      const { data, error } = await supabase
        .from('crypto_addresses')
        .select('count')
        .eq('is_active', true);

      if (error) {
        console.error('Database connection test failed:', error);
        return { success: false, message: `Database connection failed: ${error.message}` };
      }

      const count = data?.[0]?.count || 0;
      console.log('Database connection test successful. Active crypto addresses:', count);
      return { success: true, message: `Connected successfully. ${count} active crypto addresses found.` };
    } catch (error) {
      console.error('Database connection test error:', error);
      return { success: false, message: `Connection test failed: ${error.message}` };
    }
  }
};
