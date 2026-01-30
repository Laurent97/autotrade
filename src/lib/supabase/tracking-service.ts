import { supabase } from './client';
import { OrderTracking, TrackingUpdate, TrackingWithUpdates, ShippingFormData, TrackingUpdateFormData } from '../types/tracking';

export class TrackingService {
  // Admin: Mark order as shipped
  static async createTracking(data: ShippingFormData & { orderId: string; adminId: string }) {
    try {
      console.log('🚚 Creating tracking with data:', data);
      
      const { data: tracking, error } = await supabase
        .from('order_tracking')
        .insert({
          order_id: data.orderId,
          tracking_number: data.trackingNumber,
          shipping_method: data.shippingMethod,
          carrier: data.carrier,
          status: 'shipped',
          admin_id: data.adminId,
          partner_id: data.partnerId,
          estimated_delivery: data.estimatedDelivery
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error creating tracking:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Create initial tracking updates
      const updates = [
        {
          tracking_id: tracking.id,
          status: 'processing',
          description: 'Order processed and ready for shipment',
          location: 'Warehouse',
          updated_by: data.adminId,
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
        },
        {
          tracking_id: tracking.id,
          status: 'shipped',
          description: `Package shipped via ${data.carrier}`,
          location: 'Distribution Center',
          updated_by: data.adminId,
          timestamp: new Date().toISOString() // Now
        }
      ];

      const { error: updatesError } = await supabase
        .from('tracking_updates')
        .insert(updates);

      if (updatesError) {
        console.error('❌ Error creating tracking updates:', updatesError);
        // Don't throw - tracking was created successfully
      }
      
      console.log('✅ Tracking created successfully:', tracking);
      return tracking;
    } catch (error) {
      console.error('💥 Error creating tracking:', error);
      throw error;
    }
  }

  // Get tracking by tracking number (public)
  static async getTrackingByNumber(trackingNumber: string): Promise<TrackingWithUpdates | null> {
    try {
      let tracking = null;
      
      // First try to find in order_tracking table
      const { data: trackingData, error: trackingError } = await supabase
        .from('order_tracking')
        .select('*')
        .eq('tracking_number', trackingNumber)
        .single();

      if (!trackingError && trackingData) {
        tracking = trackingData;
      } else {
        // If not found in order_tracking, check orders table
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('id, order_number, shipping_tracking_number, shipping_provider, shipping_status, shipping_address, created_at, updated_at')
          .eq('shipping_tracking_number', trackingNumber)
          .single();

        if (!orderError && orderData) {
          // Create a tracking-like object from order data
          tracking = {
            id: orderData.id,
            order_id: orderData.order_number,
            tracking_number: orderData.shipping_tracking_number,
            carrier: orderData.shipping_provider,
            status: orderData.shipping_status || 'processing',
            shipping_method: 'standard',
            estimated_delivery: null,
            actual_delivery: null,
            created_at: orderData.created_at,
            updated_at: orderData.updated_at,
            partner_id: null,
            admin_id: null
          };
        }
      }

      if (!tracking) return null;

      // Get tracking updates if we have a proper tracking record
      let updates = [];
      if (tracking.id && tracking.id !== tracking.order_id) { // Only if it's a real tracking record
        const { data: updatesData, error: updatesError } = await supabase
          .from('tracking_updates')
          .select('*')
          .eq('tracking_id', tracking.id)
          .order('timestamp', { ascending: false });

        if (!updatesError) {
          updates = updatesData || [];
        }
      }

      return {
        ...tracking,
        updates
      };
    } catch (error) {
      console.error('Error fetching tracking:', error);
      return null;
    }
  }

  // Get tracking by order ID (admin/partner)
  static async getTrackingByOrderId(orderId: string): Promise<TrackingWithUpdates | null> {
    try {
      const { data: tracking, error: trackingError } = await supabase
        .from('order_tracking')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (trackingError || !tracking) return null;

      const { data: updates, error: updatesError } = await supabase
        .from('tracking_updates')
        .select('*')
        .eq('tracking_id', tracking.id)
        .order('timestamp', { ascending: false });

      if (updatesError) throw updatesError;

      return {
        ...tracking,
        updates: updates || []
      };
    } catch (error) {
      console.error('Error fetching tracking by order ID:', error);
      return null;
    }
  }

  // Admin: Get all tracking records
  static async getAllTracking() {
    try {
      const { data, error } = await supabase
        .from('order_tracking')
        .select(`
          *,
          tracking_updates (
            id,
            status,
            location,
            description,
            timestamp
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching all tracking:', error);
      throw error;
    }
  }

  // Partner: Get tracking for their orders
  static async getPartnerTracking(partnerId: string) {
    try {
      const { data, error } = await supabase
        .from('order_tracking')
        .select(`
          *,
          tracking_updates (
            id,
            status,
            location,
            description,
            timestamp
          )
        `)
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching partner tracking:', error);
      throw error;
    }
  }

  // Admin: Update tracking status
  static async updateTrackingStatus(data: TrackingUpdateFormData & { adminId: string }) {
    try {
      // Update the main tracking record
      const { data: tracking, error: trackingError } = await supabase
        .from('order_tracking')
        .update({
          status: data.status,
          actual_delivery: data.status === 'delivered' ? new Date().toISOString() : undefined
        })
        .eq('id', data.trackingId)
        .select()
        .single();

      if (trackingError) throw trackingError;

      // Add tracking update
      const { data: update, error: updateError } = await supabase
        .from('tracking_updates')
        .insert({
          tracking_id: data.trackingId,
          location: data.location,
          status: data.status,
          description: data.description,
          updated_by: data.adminId
        })
        .select()
        .single();

      if (updateError) throw updateError;

      return { tracking, update };
    } catch (error) {
      console.error('Error updating tracking status:', error);
      throw error;
    }
  }

  // Update estimated delivery
  static async updateEstimatedDelivery(trackingId: string, estimatedDelivery: string) {
    try {
      const { data, error } = await supabase
        .from('order_tracking')
        .update({ estimated_delivery: estimatedDelivery })
        .eq('id', trackingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating estimated delivery:', error);
      throw error;
    }
  }

  // Delete tracking (admin only)
  static async deleteTracking(trackingId: string) {
    try {
      const { error } = await supabase
        .from('order_tracking')
        .delete()
        .eq('id', trackingId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting tracking:', error);
      throw error;
    }
  }

  // Subscribe to real-time tracking updates
  static subscribeToTracking(trackingId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`tracking:${trackingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_tracking',
          filter: `id=eq.${trackingId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tracking_updates',
          filter: `tracking_id=eq.${trackingId}`
        },
        callback
      )
      .subscribe();
  }

  // Unsubscribe from tracking updates
  static unsubscribeFromTracking(subscription: any) {
    supabase.removeChannel(subscription);
  }
}
