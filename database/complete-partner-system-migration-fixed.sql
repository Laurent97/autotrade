-- Complete Partner System Migration (FIXED VERSION)
-- This script sets up the entire partner registration and management system
-- Run this in Supabase SQL Editor to create all necessary tables and functions

-- =====================================================
-- 1. ENHANCED PARTNER PROFILES SCHEMA
-- =====================================================

-- Add enhanced columns to partner_profiles for the new registration form
DO $$
BEGIN
    -- Basic Business Info
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'business_type'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN business_type VARCHAR(50);
        RAISE NOTICE 'Added business_type column to partner_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'store_category'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN store_category VARCHAR(50);
        RAISE NOTICE 'Added store_category column to partner_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'store_tagline'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN store_tagline VARCHAR(200);
        RAISE NOTICE 'Added store_tagline column to partner_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'year_established'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN year_established INTEGER;
        RAISE NOTICE 'Added year_established column to partner_profiles';
    END IF;

    -- Store Design & Branding
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'store_logo'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN store_logo TEXT;
        RAISE NOTICE 'Added store_logo column to partner_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'store_banner'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN store_banner TEXT;
        RAISE NOTICE 'Added store_banner column to partner_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'brand_color'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN brand_color VARCHAR(7) DEFAULT '#3B82F6';
        RAISE NOTICE 'Added brand_color column to partner_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'accent_color'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN accent_color VARCHAR(7) DEFAULT '#10B981';
        RAISE NOTICE 'Added accent_color column to partner_profiles';
    END IF;

    -- Social Media
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'social_facebook'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN social_facebook TEXT;
        RAISE NOTICE 'Added social_facebook column to partner_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'social_instagram'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN social_instagram TEXT;
        RAISE NOTICE 'Added social_instagram column to partner_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'social_linkedin'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN social_linkedin TEXT;
        RAISE NOTICE 'Added social_linkedin column to partner_profiles';
    END IF;

    -- Location & Operations
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'timezone'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN timezone VARCHAR(50);
        RAISE NOTICE 'Added timezone column to partner_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'business_hours'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN business_hours JSONB DEFAULT '{}';
        RAISE NOTICE 'Added business_hours column to partner_profiles';
    END IF;

    -- Enhanced Status & Settings
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN is_active BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_active column to partner_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'commission_rate'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 15.00;
        RAISE NOTICE 'Added commission_rate column to partner_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'rating'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.00;
        RAISE NOTICE 'Added rating column to partner_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'total_sales'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN total_sales INTEGER DEFAULT 0;
        RAISE NOTICE 'Added total_sales column to partner_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'total_earnings'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN total_earnings DECIMAL(12,2) DEFAULT 0.00;
        RAISE NOTICE 'Added total_earnings column to partner_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'customer_count'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN customer_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added customer_count column to partner_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'product_count'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN product_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added product_count column to partner_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'settings'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN settings JSONB DEFAULT '{}';
        RAISE NOTICE 'Added settings column to partner_profiles';
    END IF;

    -- Referral System Updates
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'referral_code'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN referral_code VARCHAR(9) UNIQUE;
        RAISE NOTICE 'Added referral_code column to partner_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'referral_bonus_active'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN referral_bonus_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added referral_bonus_active column to partner_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'invitation_code_used'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN invitation_code_used VARCHAR(9);
        RAISE NOTICE 'Added invitation_code_used column to partner_profiles';
    END IF;

    -- Update existing columns if needed
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'store_slug'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN store_slug TEXT;
        RAISE NOTICE 'Added store_slug column to partner_profiles';
    END IF;

END $$;

-- =====================================================
-- 2. REFERRAL SYSTEM TABLES
-- =====================================================

-- Create referral_benefits table
CREATE TABLE IF NOT EXISTS referral_benefits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
    benefit_type VARCHAR(50) NOT NULL CHECK (benefit_type IN ('welcome_bonus', 'commission_discount', 'credit', 'extended_trial')),
    benefit_amount DECIMAL(10,2) NOT NULL,
    benefit_details JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'revoked')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    UNIQUE(referrer_id, referred_id)
);

-- Create invitation_logs table for tracking invitation usage
CREATE TABLE IF NOT EXISTS invitation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invitation_code VARCHAR(9) NOT NULL,
    referrer_id UUID REFERENCES partner_profiles(id) ON DELETE SET NULL,
    applicant_email VARCHAR(255),
    applicant_ip INET,
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'used' CHECK (status IN ('used', 'expired', 'invalid', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    metadata JSONB DEFAULT '{}'
);

-- Create referral_tiers table for tier-based benefits
CREATE TABLE IF NOT EXISTS referral_tiers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tier_name VARCHAR(20) UNIQUE NOT NULL CHECK (tier_name IN ('bronze', 'silver', 'gold', 'platinum')),
    min_referrals INTEGER NOT NULL,
    commission_bonus_percent DECIMAL(5,2) DEFAULT 0.00,
    commission_reduction_percent DECIMAL(5,2) DEFAULT 0.00,
    monthly_credit DECIMAL(10,2) DEFAULT 0.00,
    benefits JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- 3. INDEXES
-- =====================================================

-- Partner profiles indexes
CREATE INDEX IF NOT EXISTS idx_partner_profiles_business_type ON partner_profiles(business_type);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_store_category ON partner_profiles(store_category);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_referral_code ON partner_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_is_active ON partner_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_commission_rate ON partner_profiles(commission_rate);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_rating ON partner_profiles(rating);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_invitation_code ON partner_profiles(invitation_code);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_referred_by ON partner_profiles(referred_by);

-- Referral system indexes
CREATE INDEX IF NOT EXISTS idx_referral_benefits_referrer_id ON referral_benefits(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_benefits_referred_id ON referral_benefits(referred_id);
CREATE INDEX IF NOT EXISTS idx_invitation_logs_invitation_code ON invitation_logs(invitation_code);
CREATE INDEX IF NOT EXISTS idx_invitation_logs_created_at ON invitation_logs(created_at);

-- =====================================================
-- 4. STORAGE SETUP
-- =====================================================

-- Create storage bucket for partner assets (logos, banners)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'partner-assets', 
    'partner-assets', 
    true, 
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE referral_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_tiers ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_benefits
DROP POLICY IF EXISTS "Users can view their own referral benefits" ON referral_benefits;
CREATE POLICY "Users can view their own referral benefits" ON referral_benefits
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM partner_profiles WHERE id = referrer_id));

DROP POLICY IF EXISTS "Users can view benefits they received" ON referral_benefits;
CREATE POLICY "Users can view benefits they received" ON referral_benefits
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM partner_profiles WHERE id = referred_id));

-- RLS policies for invitation_logs
DROP POLICY IF EXISTS "Users can view logs for their invitation codes" ON invitation_logs;
CREATE POLICY "Users can view logs for their invitation codes" ON invitation_logs
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM partner_profiles WHERE id = referrer_id));

-- RLS policies for referral_tiers (public read access)
DROP POLICY IF EXISTS "Everyone can view referral tiers" ON referral_tiers;
CREATE POLICY "Everyone can view referral tiers" ON referral_tiers
    FOR SELECT USING (true);

-- Storage policies
DROP POLICY IF EXISTS "Partner assets are publicly accessible" ON storage.objects;
CREATE POLICY "Partner assets are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'partner-assets');

DROP POLICY IF EXISTS "Partners can upload their own assets" ON storage.objects;
CREATE POLICY "Partners can upload their own assets" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'partner-assets' AND 
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = 'logos' OR 
        (storage.foldername(name))[1] = 'banners'
    );

-- =====================================================
-- 6. FUNCTIONS
-- =====================================================

-- Function to generate unique invitation code (9 chars: AV + 6 chars + 1 checksum)
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    prefix TEXT := 'AV';
    random_part TEXT;
    checksum_part TEXT;
    attempts INTEGER := 0;
    max_attempts INTEGER := 10;
BEGIN
    LOOP
        -- Generate 6-character random part
        random_part := UPPER(substring(encode(gen_random_bytes(4), 'hex'), 1, 6));
        
        -- Generate checksum
        checksum_part := MOD(
            (ASCII(prefix) + ASCII(SUBSTRING(random_part, 1, 3)) + ASCII(SUBSTRING(random_part, 4, 6))), 
            36
        )::TEXT;
        
        code := prefix || random_part || checksum_part;
        
        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM partner_profiles WHERE referral_code = code) THEN
            EXIT;
        END IF;
        
        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique invitation code after % attempts', max_attempts;
        END IF;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate store slug from store name
CREATE OR REPLACE FUNCTION generate_store_slug(store_name TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Convert to lowercase, replace spaces and special chars with hyphens
    RETURN LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(store_name, '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update store slug when store name changes
CREATE OR REPLACE FUNCTION update_store_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.store_name IS DISTINCT FROM OLD.store_name THEN
        NEW.store_slug := generate_store_slug(NEW.store_name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Simplified business hours validation (no complex loops)
CREATE OR REPLACE FUNCTION validate_business_hours(hours JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if required days exist
    IF NOT (hours ? 'monday' AND hours ? 'tuesday' AND hours ? 'wednesday' AND 
            hours ? 'thursday' AND hours ? 'friday') THEN
        RETURN FALSE;
    END IF;
    
    -- Basic format check - ensure it's a valid JSON object
    IF jsonb_typeof(hours) != 'object' THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to create referral benefit
CREATE OR REPLACE FUNCTION create_referral_benefit(
    p_referrer_id UUID,
    p_referred_id UUID,
    p_benefit_type VARCHAR(50),
    p_benefit_amount DECIMAL(10,2),
    p_benefit_details JSONB DEFAULT '{}',
    p_expires_days INTEGER DEFAULT 365
)
RETURNS UUID AS $$
DECLARE
    benefit_id UUID;
    expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate expiration date
    IF p_expires_days > 0 THEN
        expires_at := NOW() + (p_expires_days || ' days')::INTERVAL;
    END IF;
    
    -- Create benefit
    INSERT INTO referral_benefits (
        referrer_id,
        referred_id,
        benefit_type,
        benefit_amount,
        benefit_details,
        expires_at
    ) VALUES (
        p_referrer_id,
        p_referred_id,
        p_benefit_type,
        p_benefit_amount,
        p_benefit_details,
        expires_at
    ) RETURNING id INTO benefit_id;
    
    -- Update referrer stats
    UPDATE partner_profiles 
    SET 
        referral_count = COALESCE(referral_count, 0) + 1,
        referral_tier = CASE 
            WHEN COALESCE(referral_count, 0) + 1 >= 50 THEN 'platinum'
            WHEN COALESCE(referral_count, 0) + 1 >= 20 THEN 'gold'
            WHEN COALESCE(referral_count, 0) + 1 >= 5 THEN 'silver'
            ELSE 'bronze'
        END
    WHERE id = p_referrer_id;
    
    RETURN benefit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Create trigger for automatic slug generation
DROP TRIGGER IF EXISTS trigger_update_store_slug ON partner_profiles;
CREATE TRIGGER trigger_update_store_slug
    BEFORE INSERT OR UPDATE ON partner_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_store_slug();

-- Trigger to auto-generate referral code for new partners
CREATE OR REPLACE FUNCTION auto_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate referral code only for approved partners
    IF NEW.is_approved = true AND (NEW.referral_code IS NULL OR NEW.referral_code = '') THEN
        NEW.referral_code := generate_invitation_code();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_auto_generate_referral_code ON partner_profiles;
CREATE TRIGGER trigger_auto_generate_referral_code
    BEFORE UPDATE ON partner_profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_referral_code();

-- =====================================================
-- 8. CONSTRAINTS
-- =====================================================

-- Update existing partners with default business hours before adding constraint
UPDATE partner_profiles 
SET business_hours = '{
    "monday": {"open": "09:00", "close": "17:00"},
    "tuesday": {"open": "09:00", "close": "17:00"},
    "wednesday": {"open": "09:00", "close": "17:00"},
    "thursday": {"open": "09:00", "close": "17:00"},
    "friday": {"open": "09:00", "close": "17:00"},
    "saturday": {"open": "10:00", "close": "14:00"},
    "sunday": {"open": "", "close": ""}
}'
WHERE business_hours IS NULL OR business_hours = '{}' OR NOT validate_business_hours(business_hours);

-- Add check constraint for business hours
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE table_name = 'partner_profiles' 
        AND constraint_name = 'valid_business_hours'
    ) THEN
        ALTER TABLE partner_profiles 
        ADD CONSTRAINT valid_business_hours 
        CHECK (validate_business_hours(business_hours));
        RAISE NOTICE 'Added valid_business_hours constraint to partner_profiles';
    END IF;
END $$;

-- =====================================================
-- 9. DEFAULT DATA
-- =====================================================

-- Insert default referral tiers
INSERT INTO referral_tiers (tier_name, min_referrals, commission_bonus_percent, commission_reduction_percent, monthly_credit, benefits) VALUES
('bronze', 0, 0.00, 0.00, 0.00, '{"name": "Bronze Partner", "description": "Starting tier for all partners"}'),
('silver', 5, 1.00, 0.50, 50.00, '{"name": "Silver Partner", "description": "5+ successful referrals"}'),
('gold', 20, 2.50, 1.00, 150.00, '{"name": "Gold Partner", "description": "20+ successful referrals"}'),
('platinum', 50, 5.00, 2.00, 500.00, '{"name": "Platinum Partner", "description": "50+ successful referrals"}')
ON CONFLICT (tier_name) DO NOTHING;

-- Update existing partners with default values
UPDATE partner_profiles SET 
    business_type = COALESCE(business_type, 'individual'),
    store_category = COALESCE(store_category, 'premium_auto'),
    brand_color = COALESCE(brand_color, '#3B82F6'),
    accent_color = COALESCE(accent_color, '#10B981'),
    timezone = COALESCE(timezone, 'UTC'),
    business_hours = COALESCE(business_hours, '{
        "monday": {"open": "09:00", "close": "17:00"},
        "tuesday": {"open": "09:00", "close": "17:00"},
        "wednesday": {"open": "09:00", "close": "17:00"},
        "thursday": {"open": "09:00", "close": "17:00"},
        "friday": {"open": "09:00", "close": "17:00"},
        "saturday": {"open": "10:00", "close": "14:00"},
        "sunday": {"open": "", "close": ""}
    }'),
    settings = COALESCE(settings, '{
        "notifications": true,
        "auto_relist": true,
        "low_stock_alerts": true,
        "email_notifications": true
    }')
WHERE business_type IS NULL OR store_category IS NULL OR brand_color IS NULL;

-- =====================================================
-- 10. PERMISSIONS
-- =====================================================

-- Grant permissions
GRANT ALL ON referral_benefits TO authenticated;
GRANT ALL ON referral_benefits TO service_role;
GRANT ALL ON invitation_logs TO authenticated;
GRANT ALL ON invitation_logs TO service_role;
GRANT SELECT ON referral_tiers TO authenticated;
GRANT SELECT ON referral_tiers TO service_role;
GRANT EXECUTE ON FUNCTION generate_invitation_code TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invitation_code TO service_role;
GRANT EXECUTE ON FUNCTION generate_store_slug TO authenticated;
GRANT EXECUTE ON FUNCTION generate_store_slug TO service_role;
GRANT EXECUTE ON FUNCTION validate_business_hours TO authenticated;
GRANT EXECUTE ON FUNCTION validate_business_hours TO service_role;
GRANT EXECUTE ON FUNCTION create_referral_benefit TO authenticated;
GRANT EXECUTE ON FUNCTION create_referral_benefit TO service_role;

DO $$
BEGIN
    RAISE NOTICE 'Complete partner system migration completed successfully!';
    RAISE NOTICE 'Enhanced partner_profiles table with all registration form fields';
    RAISE NOTICE 'Created referral system tables and functions';
    RAISE NOTICE 'Set up storage bucket for partner assets';
    RAISE NOTICE 'Applied RLS policies and granted permissions';
END $$;
