-- Create the missing RPC function get_partner_profile_by_user_id
-- This function should return the correct user profile data

CREATE OR REPLACE FUNCTION get_partner_profile_by_user_id(p_user_id UUID)
RETURNS TABLE(
    id UUID,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    user_type TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    store_name TEXT,
    store_slug TEXT,
    description TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    country TEXT,
    city TEXT,
    is_active BOOLEAN,
    is_verified BOOLEAN,
    store_rating DECIMAL,
    store_credit_score INTEGER,
    commission_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.full_name,
        u.phone,
        u.user_type,
        u.created_at,
        u.updated_at,
        pp.store_name,
        pp.store_slug,
        pp.description,
        pp.contact_email,
        pp.contact_phone,
        pp.country,
        pp.city,
        pp.is_active,
        pp.is_verified,
        pp.store_rating,
        pp.store_credit_score,
        pp.commission_rate
    FROM users u
    LEFT JOIN partner_profiles pp ON u.id = pp.user_id
    WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT * FROM get_partner_profile_by_user_id('e2731c06-58b4-4f37-96c7-f721af43263c');

-- Also test with the other ID to see what happens
SELECT * FROM get_partner_profile_by_user_id('33235e84-d175-4d35-a260-1037ca5cfd0c');
