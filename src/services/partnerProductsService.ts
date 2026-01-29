// Quick Fix Service for Partner Products (Fixes PGRST200 Error)
// This provides RPC functions for partner products operations

import { supabase } from '../lib/supabase/client'

// Partner product interface
export interface PartnerProduct {
  id: string
  partner_id: string
  product_id: string
  selling_price?: number
  profit_margin?: number
  is_active: boolean
  created_at: string
  updated_at: string
  product?: {
    id: string
    sku: string
    title: string
    description?: string
    category: string
    make: string
    model: string
    original_price: number
    stock_quantity: number
    is_active: boolean
  }
}

// Get partner products using RPC function
export async function getPartnerProducts(partnerId: string): Promise<PartnerProduct[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_partner_products', { p_partner_id: partnerId })

    if (error) {
      console.error('Error fetching partner products:', error)
      // Fallback to direct query if RPC fails
      return await getPartnerProductsFallback(partnerId);
    }

    return data || []
  } catch (err) {
    console.error('Unexpected error:', err)
    return []
  }
}

// Fallback: Get partner products using direct query (if RPC doesn't work)
export async function getPartnerProductsFallback(partnerId: string): Promise<PartnerProduct[]> {
  try {
    const { data, error } = await supabase
      .from('partner_products')
      .select(`
        *,
        product:products(*)
      `)
      .eq('partner_id', partnerId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching partner products (fallback):', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Unexpected error (fallback):', err)
    return []
  }
}

// Create partner product
export async function createPartnerProduct(
  partnerId: string,
  productId: string,
  sellingPrice?: number,
  profitMargin?: number
): Promise<PartnerProduct | null> {
  try {
    const { data, error } = await supabase
      .from('partner_products')
      .insert({
        partner_id: partnerId,
        product_id: productId,
        selling_price: sellingPrice,
        profit_margin: profitMargin,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating partner product:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Unexpected error:', err)
    return null
  }
}

// Update partner product
export async function updatePartnerProduct(
  id: string,
  updates: Partial<PartnerProduct>
): Promise<PartnerProduct | null> {
  try {
    const { data, error } = await supabase
      .from('partner_products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating partner product:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Unexpected error:', err)
    return null
  }
}

// Delete partner product
export async function deletePartnerProduct(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('partner_products')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting partner product:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Unexpected error:', err)
    return false
  }
}

// Toggle partner product status
export async function togglePartnerProductStatus(id: string, currentStatus: boolean): Promise<PartnerProduct | null> {
  return updatePartnerProduct(id, { is_active: !currentStatus })
}

// Get partner products with product details (enhanced)
export async function getPartnerProductsWithDetails(partnerId: string): Promise<PartnerProduct[]> {
  try {
    // Try RPC function first
    const rpcResult = await getPartnerProducts(partnerId)
    if (rpcResult.length > 0) {
      return rpcResult
    }

    // Fallback to direct query
    const fallbackResult = await getPartnerProductsFallback(partnerId)
    return fallbackResult
  } catch (err) {
    console.error('Error in enhanced partner products fetch:', err)
    return []
  }
}

// Format price for display
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price)
}

// Check if partner has custom pricing for a product
export async function hasCustomPricing(partnerId: string, productId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('partner_products')
      .select('selling_price')
      .eq('partner_id', partnerId)
      .eq('product_id', productId)
      .eq('is_active', true)
      .single()

    if (error) {
      return false
    }

    return data && data.selling_price !== null && data.selling_price !== undefined
  } catch (err) {
    console.error('Error checking custom pricing:', err)
    return false
  }
}

// Get partner's effective price (selling or original)
export async function getEffectivePrice(partnerId: string, productId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('partner_products')
      .select('selling_price')
      .eq('partner_id', partnerId)
      .eq('product_id', productId)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      // Fallback to original price
      const { data: productData } = await supabase
        .from('products')
        .select('original_price')
        .eq('id', productId)
        .single()

      return productData?.original_price || 0
    }

    return data.selling_price || 0
  } catch (err) {
    console.error('Error getting effective price:', err)
    return 0
  }
}
