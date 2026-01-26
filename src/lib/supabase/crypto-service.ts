import { supabase } from './client';

export interface CryptoAddress {
  id: string;
  crypto_type: 'BTC' | 'ETH' | 'USDT' | 'XRP';
  address: string;
  is_active: boolean;
  network: string;
  xrp_tag?: string;
  created_at: string;
  updated_at: string;
}

export const cryptoService = {
  // Get all active crypto addresses
  async getActiveCryptoAddresses(): Promise<{ data: CryptoAddress[]; error: any }> {
    try {
      console.log('Fetching crypto addresses from database...');
      
      // First check if table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('crypto_addresses')
        .select('count')
        .limit(1);
      
      if (tableError) {
        console.error('Table does not exist or access error:', tableError);
        return { data: [], error: tableError };
      }
      
      console.log('Table exists, fetching addresses...');
      
      // Add cache-busting parameter to ensure fresh data
      const { data, error } = await supabase
        .from('crypto_addresses')
        .select('id, crypto_type, address, is_active, network, xrp_tag, created_at, updated_at')
        .eq('is_active', true)
        .order('crypto_type', { ascending: true })
        .limit(100); // Add limit to prevent caching issues

      if (error) {
        console.error('Database query error:', error);
        throw error;
      }

      console.log('Crypto addresses fetched successfully:', data?.length || 0, 'addresses');
      console.log('Fetched addresses:', data);
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
      
      // Check if table exists first
      const { data: tableCheck, error: tableError } = await supabase
        .from('crypto_addresses')
        .select('count')
        .limit(1);

      if (tableError) {
        console.error('Table does not exist:', tableError);
        return { success: false, message: `Table crypto_addresses does not exist: ${tableError.message}` };
      }
      
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
      
      // Get actual addresses for debugging
      const { data: addresses } = await supabase
        .from('crypto_addresses')
        .select('crypto_type, address, is_active')
        .eq('is_active', true);
      
      console.log('Available addresses:', addresses);
      
      return { 
        success: true, 
        message: `Connected successfully. ${count} active crypto addresses found: ${addresses?.map(a => a.crypto_type).join(', ')}` 
      };
    } catch (error) {
      console.error('Database connection test error:', error);
      return { success: false, message: `Connection test failed: ${error.message}` };
    }
  }
};
