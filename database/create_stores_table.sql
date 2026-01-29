-- Create stores table for partner dashboard
-- This table will store store information for partners

CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website VARCHAR(500),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_products INTEGER DEFAULT 0,
    active_products INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0.00,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON stores(is_active);
CREATE INDEX IF NOT EXISTS idx_stores_rating ON stores(rating);

-- Create index for full-text search on store name
CREATE INDEX IF NOT EXISTS idx_stores_name_search ON stores USING gin(to_tsvector('english', name));

-- Enable Row Level Security
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Create policy for reading stores
CREATE POLICY "Stores are viewable by everyone" ON stores
    FOR SELECT USING (true);

-- Create policy for inserting stores (only authenticated users)
CREATE POLICY "Users can insert their own stores" ON stores
    FOR INSERT WITH CHECK (
        auth.uid() = owner_id
    );

-- Create policy for updating stores (only store owners)
CREATE POLICY "Store owners can update their stores" ON stores
    FOR UPDATE USING (
        auth.uid() = owner_id
    );

-- Create policy for deleting stores (only store owners)
CREATE POLICY "Store owners can delete their stores" ON stores
    FOR DELETE USING (
        auth.uid() = owner_id
    );

-- Add comments for documentation
COMMENT ON TABLE stores IS 'Store information for partner dashboard';
COMMENT ON COLUMN stores.id IS 'Unique identifier for the store';
COMMENT ON COLUMN stores.name IS 'Store name';
COMMENT ON COLUMN stores.slug IS 'URL-friendly store identifier';
COMMENT ON COLUMN stores.description IS 'Store description';
COMMENT ON COLUMN stores.logo_url IS 'URL to store logo image';
COMMENT ON COLUMN stores.banner_url IS 'URL to store banner image';
COMMENT ON COLUMN stores.contact_email IS 'Store contact email';
COMMENT ON COLUMN stores.contact_phone IS 'Store contact phone';
COMMENT ON COLUMN stores.website IS 'Store website URL';
COMMENT ON COLUMN stores.address IS 'Store physical address';
COMMENT ON COLUMN stores.city IS 'Store city';
COMMENT ON COLUMN stores.country IS 'Store country';
COMMENT ON COLUMN stores.is_active IS 'Whether the store is currently active';
COMMENT ON COLUMN stores.rating IS 'Store rating (0.00 - 5.00)';
COMMENT ON COLUMN stores.total_products IS 'Total number of products in store';
COMMENT ON COLUMN stores.active_products IS 'Number of active products';
COMMENT ON COLUMN stores.total_orders IS 'Total number of orders';
COMMENT ON COLUMN stores.total_revenue IS 'Total revenue generated';
COMMENT ON COLUMN stores.owner_id IS 'Reference to the store owner (user)';
COMMENT ON COLUMN stores.created_at IS 'Timestamp when store was created';
COMMENT ON COLUMN stores.updated_at IS 'Timestamp when store was last updated';

-- Create trigger function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_stores_updated_at 
    BEFORE UPDATE ON stores 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional - remove in production)
INSERT INTO stores (name, slug, description, contact_email, is_active, rating, total_products, active_products, owner_id) VALUES
('Auto Parts Store', 'auto-parts-store', 'Your one-stop shop for quality auto parts and accessories', 'contact@autoparts.com', true, 4.5, 150, 120, '33235e84-d175-4d35-a260-1037ca5cfd0c'),
('Electronics Hub', 'electronics-hub', 'Latest electronics and gadgets at competitive prices', 'info@electronicshub.com', true, 4.2, 200, 180, '33235e84-d175-4d35-a260-1037ca5cfd0c'),
('Performance Motors', 'performance-motors', 'High-performance automotive parts and accessories', 'sales@performancemotors.com', true, 4.8, 100, 85, '33235e84-d175-4d35-a260-1037ca5cfd0c');
