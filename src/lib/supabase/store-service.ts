import { supabase } from './client';

export interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  is_active: boolean;
  rating?: number;
  total_products?: number;
  active_products?: number;
  total_orders?: number;
  total_revenue?: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export const storeService = {
  // Get all active stores
  async getAllStores(): Promise<{ data: Store[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching stores:', error);
      return { data: null, error };
    }
  },

  // Get store by slug
  async getStoreBySlug(slug: string): Promise<{ data: Store | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching store by slug:', error);
      return { data: null, error };
    }
  },

  // Get stores by manufacturer
  async getStoresByManufacturer(manufacturerId: string): Promise<{ data: Store[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('manufacturer_id', manufacturerId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching stores by manufacturer:', error);
      return { data: null, error };
    }
  }
};
