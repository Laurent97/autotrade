// Database type definitions based on Supabase schema

export type UserType = 'user' | 'partner' | 'admin';
export type PartnerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type ProductCategory = 'car' | 'part' | 'accessory';
export type Condition = 'new' | 'used' | 'reconditioned';
export type OrderStatus = 
  | 'pending' 
  | 'waiting_confirmation' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'in_transit' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'completed' 
  | 'cancelled'
  // Pre-shipment statuses
  | 'order_received'
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
  | 'security_delay'
  | 'customs_hold'
  | 'damaged'
  | 'lost'
  | 'address_issue'
  | 'customer_unavailable';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type EarningsStatus = 'pending' | 'released' | 'hold';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  user_type: UserType;
  partner_status?: PartnerStatus;
  created_at: string;
  updated_at: string;
}

export interface PartnerProfile {
  id: string;
  user_id: string;
  store_id?: string; // Unique store identifier
  store_name: string;
  store_slug: string;
  logo_url?: string;
  banner_url?: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  country?: string;
  city?: string;
  tax_id?: string;
  bank_account_details?: Record<string, any>;
  commission_rate: number;
  total_earnings: number;
  pending_balance: number;
  available_balance: number;
  store_visits: number;
  conversion_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  sku?: string;
  title?: string;
  name?: string;
  description?: string;
  category?: string;
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  condition?: string;
  specifications?: Record<string, unknown>;
  price?: number; // Some products use this field
  original_price?: number; // Some products use this field
  stock_quantity?: number;
  quantity_available?: number;
  images?: string[];
  is_active?: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  featured?: boolean;
  category_path?: string | Record<string, any>;
  rating?: number;
}

export interface PartnerProduct {
  id: string;
  partner_id: string;
  product_id: string;
  selling_price: number;
  profit_margin?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product?: Product;
  partner_store_name?: string;
  store_name?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  partner_id?: string;
  total_amount: number;
  status: OrderStatus;
  shipping_address: Record<string, any>;
  billing_address?: Record<string, any>;
  payment_status: PaymentStatus;
  payment_method?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  customer?: User;
  partner?: PartnerProfile;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  partner_product_id?: string;
  quantity: number;
  unit_price: number;
  // subtotal is a generated column (quantity * unit_price)
  created_at: string;
  product?: Product;
}

export interface LogisticsTracking {
  id: string;
  order_id: string;
  shipping_provider?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  current_status?: string;
  location_updates?: Record<string, any>[];
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PartnerEarnings {
  id: string;
  partner_id: string;
  order_id: string;
  product_id: string;
  sale_amount: number;
  commission: number;
  partner_share: number;
  status: EarningsStatus;
  released_at?: string;
  created_at: string;
}

export interface StoreVisit {
  id: string;
  partner_id: string;
  visitor_id?: string;
  page_visited?: string;
  session_duration?: number;
  created_at: string;
}

// Extended types for UI
export interface ProductWithPricing extends Product {
  partner_price?: number;
  discount_percentage?: number;
}

export interface CartItem {
  product: Product;
  partner_product?: PartnerProduct;
  quantity: number;
  unit_price: number;
  subtotal: number;
  name?: string;
  title?: string;
  partner_store_name?: string;
  partner_id?: string;
}

export interface ShippingAddress {
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  phone?: string;
}
