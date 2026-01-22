import { supabase } from './client';
import type { Order, OrderItem, ShippingAddress } from '../types';

export interface CreateOrderData {
  customer_id: string;
  partner_id?: string;
  items: Array<{
    product_id: string;
    partner_product_id?: string;
    quantity: number;
    unit_price: number;
  }>;
  shipping_address: ShippingAddress;
  billing_address?: ShippingAddress;
  payment_method?: string;
  notes?: string;
}

export const orderService = {
  /**
   * Create a new order
   */
  async createOrder(orderData: CreateOrderData) {
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calculate total amount
    const totalAmount = orderData.items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: orderData.customer_id,
        partner_id: orderData.partner_id || null,
        total_amount: totalAmount,
        status: 'pending',
        shipping_address: orderData.shipping_address,
        billing_address: orderData.billing_address || orderData.shipping_address,
        payment_status: 'pending',
        payment_method: orderData.payment_method || null,
        notes: orderData.notes || null,
      })
      .select()
      .single();

    if (orderError) {
      return { data: null, error: orderError };
    }

    // Create order items (explicitly exclude subtotal as it's generated)
    const orderItems = orderData.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      partner_product_id: item.partner_product_id || null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      created_at: new Date().toISOString()
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // Rollback order creation
      await supabase.from('orders').delete().eq('id', order.id);
      return { data: null, error: itemsError };
    }

    return { data: order as Order, error: null };
  },

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        order_items (
          *,
          product:products (*)
        )
      `
      )
      .eq('id', orderId)
      .single();

    return { data, error };
  },

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        order_items (
          *,
          product:products (*)
        )
      `
      )
      .eq('order_number', orderNumber)
      .single();

    return { data, error };
  },

  /**
   * Get orders for a customer
   */
  async getCustomerOrders(customerId: string, limit = 50) {
    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        order_items (
          *,
          product:products (*)
        )
      `
      )
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data, error };
  },

  /**
   * Get orders for a partner
   */
  async getPartnerOrders(partnerId: string, limit = 50) {
    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        order_items (
          *,
          product:products (*)
        )
      `
      )
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data, error };
  },

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: Order['status']) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Update payment status
   */
  async updatePaymentStatus(orderId: string, paymentStatus: Order['payment_status']) {
    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Get order tracking information
   */
  async getOrderTracking(orderId: string) {
    const { data, error } = await supabase
      .from('logistics_tracking')
      .select('*')
      .eq('order_id', orderId)
      .single();

    return { data, error };
  },
};
