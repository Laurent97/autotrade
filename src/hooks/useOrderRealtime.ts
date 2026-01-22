import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase/client';

interface UseOrderRealtimeProps {
  onOrderUpdate?: (payload: any) => void;
  onOrderInsert?: (payload: any) => void;
  onOrderDelete?: (payload: any) => void;
  enabled?: boolean;
}

export const useOrderRealtime = ({
  onOrderUpdate,
  onOrderInsert,
  onOrderDelete,
  enabled = true
}: UseOrderRealtimeProps) => {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled) {
      // Cleanup existing channel if disabled
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    // Subscribe to realtime updates
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Realtime order update:', payload);
          
          if (payload.eventType === 'UPDATE' && onOrderUpdate) {
            onOrderUpdate(payload);
          }
          
          if (payload.eventType === 'INSERT' && onOrderInsert) {
            onOrderInsert(payload);
          }
          
          if (payload.eventType === 'DELETE' && onOrderDelete) {
            onOrderDelete(payload);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, onOrderUpdate, onOrderInsert, onOrderDelete]);

  return { channel: channelRef.current };
};
