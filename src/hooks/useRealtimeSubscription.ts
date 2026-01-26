import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

interface RealtimeSubscriptionOptions {
  table: string;
  schema?: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  filter?: string;
}

interface UseRealtimeSubscriptionReturn<T> {
  data: T[] | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdate: Date | null;
}

export function useRealtimeSubscription<T>(
  fetchFunction: () => Promise<T[]>,
  options: RealtimeSubscriptionOptions
): UseRealtimeSubscriptionReturn<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const isRefreshing = useRef(false);

  const refresh = useCallback(async () => {
    if (isRefreshing.current) return; // Prevent duplicate calls
    
    isRefreshing.current = true;
    
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      isRefreshing.current = false;
    }
  }, [fetchFunction]);

  useEffect(() => {
    // Initial load
    refresh();

    // Set up real-time subscription
    const channelName = `${options.table}_realtime_${Date.now()}`;
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event: options.event || '*',
          schema: options.schema || 'public',
          table: options.table,
          filter: options.filter
        },
        (payload) => {
          console.log(`Real-time update for ${options.table}:`, payload);
          // Refresh data when changes occur
          refresh();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // console.log(`Real-time subscription active for ${options.table}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Real-time subscription error for ${options.table}`);
          setError('Real-time connection error');
        }
      });

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [options.table, options.schema, options.event, options.filter]);

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdate
  };
}

// Specialized hooks for common use cases
export function usePartnerProfiles() {
  return useRealtimeSubscription(
    async () => {
      const { data, error } = await supabase
        .from('partner_profiles')
        .select('*')
        .not('store_name', 'is', null)
        .eq('is_active', true)
        .eq('partner_status', 'approved')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    {
      table: 'partner_profiles',
      event: '*'
    }
  );
}

export function usePartnerProducts() {
  return useRealtimeSubscription(
    async () => {
      const { data, error } = await supabase
        .from('partner_products')
        .select(`
          *,
          partner_profiles!partner_products_partner_id_fkey (
            store_name,
            store_slug,
            logo_url
          )
        `)
        .eq('in_stock', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    {
      table: 'partner_products',
      event: '*'
    }
  );
}

export function useOrders() {
  return useRealtimeSubscription(
    async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users (
            email,
            full_name
          ),
          order_items (
            *,
            products (
              name,
              price,
              images
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    {
      table: 'orders',
      event: '*'
    }
  );
}

export function useNotifications() {
  return useRealtimeSubscription(
    async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    {
      table: 'notifications',
      event: '*'
    }
  );
}

export function useUsers() {
  return useRealtimeSubscription(
    async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    {
      table: 'users',
      event: '*'
    }
  );
}
