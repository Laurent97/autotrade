-- Fix the broken get_partner_products RPC function
-- Update it to use correct column names from partner_products table

-- Drop the broken RPC function
DROP FUNCTION IF EXISTS get_partner_products(p_partner_id UUID);

-- Create the corrected RPC function with proper column names
CREATE OR REPLACE FUNCTION get_partner_products(p_partner_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT json_agg(
            json_build_object(
                'id', pp.id,
                'partner_id', pp.partner_id,
                'product_id', pp.product_id,
                'selling_price', pp.selling_price,
                'profit_margin', pp.profit_margin,
                'is_active', pp.is_active,
                'created_at', pp.created_at,
                'updated_at', pp.updated_at,
                'product', row_to_json(p)
            ) ORDER BY pp.created_at DESC
        )
        FROM public.partner_products pp
        LEFT JOIN public.products p ON pp.product_id = p.id
        WHERE pp.partner_id = p_partner_id AND pp.is_active = true
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_partner_products(UUID) TO authenticated;

-- Grant execute permission to service role (for admin access)
GRANT EXECUTE ON FUNCTION get_partner_products(UUID) TO service_role;

-- Test the fixed function (replace with actual partner ID)
-- SELECT get_partner_products('your-partner-id-here'::UUID);

-- Verify the function was created successfully
SELECT 
  'RPC Function Fixed' as status,
  proname as function_name,
  'get_partner_products' as expected_name
FROM pg_proc 
WHERE proname = 'get_partner_products';
