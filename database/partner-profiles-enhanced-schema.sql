-- Enhanced Partner Profiles Schema
-- This adds all the additional columns needed for the comprehensive registration form

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
        ALTER TABLE partner_profiles ADD COLUMN referral_code VARCHAR(10) UNIQUE;
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
        ALTER TABLE partner_profiles ADD COLUMN invitation_code_used VARCHAR(10);
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

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_partner_profiles_business_type ON partner_profiles(business_type);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_store_category ON partner_profiles(store_category);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_referral_code ON partner_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_is_active ON partner_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_commission_rate ON partner_profiles(commission_rate);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_rating ON partner_profiles(rating);

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

-- Create policies for storage bucket
CREATE POLICY "Partner assets are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'partner-assets');

CREATE POLICY "Partners can upload their own assets" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'partner-assets' AND 
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = 'logos' OR 
        (storage.foldername(name))[1] = 'banners'
    );

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

-- Create trigger for automatic slug generation
DROP TRIGGER IF EXISTS trigger_update_store_slug ON partner_profiles;
CREATE TRIGGER trigger_update_store_slug
    BEFORE INSERT OR UPDATE ON partner_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_store_slug();

-- Function to validate business hours
CREATE OR REPLACE FUNCTION validate_business_hours(hours JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if required days exist
    IF NOT (hours ? 'monday' AND hours ? 'tuesday' AND hours ? 'wednesday' AND 
            hours ? 'thursday' AND hours ? 'friday') THEN
        RETURN FALSE;
    END IF;
    
    -- Check time format for each day (HH:MM format)
    FOR day IN ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    LOOP
        IF hours ? day THEN
            DECLARE
                day_hours JSONB := hours -> day;
                open_time TEXT := (day_hours ->> 'open');
                close_time TEXT := (day_hours ->> 'close');
            BEGIN
                -- Validate time format (HH:MM)
                IF open_time IS NOT NULL AND open_time != '' THEN
                    IF open_time !~ '^[0-2][0-9]:[0-5][0-9]$' THEN
                        RETURN FALSE;
                    END IF;
                END IF;
                
                IF close_time IS NOT NULL AND close_time != '' THEN
                    IF close_time !~ '^[0-2][0-9]:[0-5][0-9]$' THEN
                        RETURN FALSE;
                    END IF;
                END IF;
            END;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add check constraint for business hours
ALTER TABLE partner_profiles 
ADD CONSTRAINT valid_business_hours 
CHECK (validate_business_hours(business_hours));

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

DO $$
BEGIN
    RAISE NOTICE 'Enhanced partner profiles schema completed successfully!';
    RAISE NOTICE 'Added all columns needed for comprehensive registration form';
END $$;
