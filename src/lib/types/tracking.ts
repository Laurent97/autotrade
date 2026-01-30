export interface OrderTracking {
  id: string;
  order_id: string;
  tracking_number?: string;
  shipping_method?: string;
  carrier?: string;
  status: 
    | 'processing' 
    | 'shipped' 
    | 'in_transit' 
    | 'out_for_delivery' 
    | 'delivered'
    // Pre-shipment statuses
    | 'order_received'
    | 'payment_authorized'
    | 'order_verified' 
    | 'inventory_allocated'
    | 'order_processing'
    | 'picking_started'
    | 'picking_completed'
    | 'packing_started'
    | 'packing_completed'
    | 'ready_to_ship'
    // Shipping statuses
    | 'carrier_pickup_scheduled'
    | 'picked_up'
    | 'arrived_at_origin'
    | 'departed_origin'
    | 'arrived_at_sort'
    | 'processed_at_sort'
    | 'departed_sort'
    | 'arrived_at_destination'
    // Delivery statuses
    | 'delivery_attempted'
    // Exception statuses
    | 'delayed'
    | 'weather_delay'
    | 'mechanical_delay'
    | 'address_issue'
    | 'customer_unavailable'
    | 'security_delay'
    | 'customs_hold'
    | 'damaged'
    | 'lost';
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
  // Basic statuses
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
  },
  
  // Pre-shipment statuses
  order_received: {
    label: 'Order Received',
    color: 'blue',
    icon: 'Package',
    completed: true
  },
  payment_authorized: {
    label: 'Payment Authorized',
    color: 'green',
    icon: 'CheckCircle',
    completed: true
  },
  order_verified: {
    label: 'Order Verified',
    color: 'blue',
    icon: 'CheckCircle',
    completed: true
  },
  inventory_allocated: {
    label: 'Inventory Allocated',
    color: 'blue',
    icon: 'Package',
    completed: true
  },
  order_processing: {
    label: 'Order Processing',
    color: 'yellow',
    icon: 'Clock',
    completed: true
  },
  picking_started: {
    label: 'Picking Started',
    color: 'yellow',
    icon: 'Package',
    completed: true
  },
  picking_completed: {
    label: 'Picking Completed',
    color: 'blue',
    icon: 'CheckCircle',
    completed: true
  },
  packing_started: {
    label: 'Packing Started',
    color: 'yellow',
    icon: 'Package',
    completed: true
  },
  packing_completed: {
    label: 'Packing Completed',
    color: 'blue',
    icon: 'CheckCircle',
    completed: true
  },
  ready_to_ship: {
    label: 'Ready to Ship',
    color: 'green',
    icon: 'Package',
    completed: true
  },
  
  // Shipping statuses
  carrier_pickup_scheduled: {
    label: 'Carrier Pickup Scheduled',
    color: 'blue',
    icon: 'Clock',
    completed: true
  },
  picked_up: {
    label: 'Picked Up',
    color: 'blue',
    icon: 'Truck',
    completed: true
  },
  arrived_at_origin: {
    label: 'Arrived at Origin',
    color: 'yellow',
    icon: 'MapPin',
    completed: true
  },
  departed_origin: {
    label: 'Departed Origin',
    color: 'yellow',
    icon: 'Truck',
    completed: true
  },
  arrived_at_sort: {
    label: 'Arrived at Sort Facility',
    color: 'yellow',
    icon: 'MapPin',
    completed: true
  },
  processed_at_sort: {
    label: 'Processed at Sort',
    color: 'blue',
    icon: 'Package',
    completed: true
  },
  departed_sort: {
    label: 'Departed Sort Facility',
    color: 'yellow',
    icon: 'Truck',
    completed: true
  },
  arrived_at_destination: {
    label: 'Arrived at Destination',
    color: 'yellow',
    icon: 'MapPin',
    completed: true
  },
  
  // Delivery statuses
  delivery_attempted: {
    label: 'Delivery Attempted',
    color: 'orange',
    icon: 'MapPin',
    completed: true
  },
  
  // Exception statuses
  delayed: {
    label: 'Delayed',
    color: 'orange',
    icon: 'Clock',
    completed: true
  },
  weather_delay: {
    label: 'Weather Delay',
    color: 'orange',
    icon: 'Cloud',
    completed: true
  },
  mechanical_delay: {
    label: 'Mechanical Delay',
    color: 'orange',
    icon: 'Tool',
    completed: true
  },
  security_delay: {
    label: 'Security Delay',
    color: 'orange',
    icon: 'Shield',
    completed: true
  },
  customs_hold: {
    label: 'Customs Hold',
    color: 'orange',
    icon: 'AlertTriangle',
    completed: true
  },
  damaged: {
    label: 'Damaged',
    color: 'red',
    icon: 'AlertTriangle',
    completed: true
  },
  lost: {
    label: 'Lost',
    color: 'red',
    icon: 'AlertTriangle',
    completed: true
  },
  address_issue: {
    label: 'Address Issue',
    color: 'orange',
    icon: 'MapPin',
    completed: true
  },
  customer_unavailable: {
    label: 'Customer Unavailable',
    color: 'orange',
    icon: 'User',
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
