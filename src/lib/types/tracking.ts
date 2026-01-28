export interface OrderTracking {
  id: string;
  order_id: string;
  tracking_number?: string;
  shipping_method?: string;
  carrier?: string;
  status: 'processing' | 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered';
  admin_id?: string;
  partner_id?: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  created_at: string;
  updated_at: string;
}

export interface TrackingUpdate {
  id: string;
  tracking_id: string;
  location?: string;
  status: string;
  description?: string;
  timestamp: string;
  updated_by?: string;
}

export interface TrackingWithUpdates extends OrderTracking {
  updates: TrackingUpdate[];
}

export interface ShippingFormData {
  trackingNumber: string;
  shippingMethod: 'standard' | 'express' | 'overnight';
  carrier: string;
  estimatedDelivery: string;
  partnerId: string;
}

export interface TrackingUpdateFormData {
  trackingId: string;
  status: OrderTracking['status'];
  location?: string;
  description?: string;
}

export interface TrackingStatus {
  label: string;
  color: string;
  icon: string;
  completed: boolean;
}

export const TRACKING_STATUSES: Record<OrderTracking['status'], TrackingStatus> = {
  processing: {
    label: 'Processing',
    color: 'yellow',
    icon: 'Clock',
    completed: false
  },
  shipped: {
    label: 'Shipped',
    color: 'blue',
    icon: 'Package',
    completed: true
  },
  in_transit: {
    label: 'In Transit',
    color: 'yellow',
    icon: 'Truck',
    completed: true
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    color: 'orange',
    icon: 'MapPin',
    completed: true
  },
  delivered: {
    label: 'Delivered',
    color: 'green',
    icon: 'CheckCircle',
    completed: true
  }
};

export const SHIPPING_METHODS = [
  { value: 'standard', label: 'Standard Shipping (5-7 days)' },
  { value: 'express', label: 'Express Shipping (2-3 days)' },
  { value: 'overnight', label: 'Overnight Shipping (1 day)' }
] as const;

export const CARRIERS = [
  'FedEx',
  'UPS',
  'DHL',
  'USPS',
  'Amazon Logistics',
  'Local Courier'
] as const;
