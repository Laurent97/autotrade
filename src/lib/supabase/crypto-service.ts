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
      const { data, error } = await supabase
        .from('crypto_addresses')
        .select('*')
        .eq('is_active', true)
        .order('crypto_type', { ascending: true });

      return { data: data || [], error };
    } catch (error) {
      console.error('Error fetching crypto addresses:', error);
      return { data: [], error };
    }
  },

  // Get crypto address by type
  async getCryptoAddressByType(cryptoType: string): Promise<{ data: CryptoAddress | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('crypto_addresses')
        .select('*')
        .eq('crypto_type', cryptoType)
        .eq('is_active', true)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error fetching crypto address:', error);
      return { data: null, error };
    }
  },

  // Get supported crypto types
  async getSupportedCryptoTypes(): Promise<{ data: string[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('crypto_addresses')
        .select('crypto_type')
        .eq('is_active', true)
        .order('crypto_type', { ascending: true });

      const types = data?.map(item => item.crypto_type) || [];
      return { data: types, error };
    } catch (error) {
      console.error('Error fetching supported crypto types:', error);
      return { data: [], error };
    }
  }
};
