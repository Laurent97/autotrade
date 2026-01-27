-- Create password reset requests table (Safe Version)
-- This script handles existing tables properly

-- Drop existing table if it exists with wrong structure
DROP TABLE IF EXISTS password_reset_requests CASCADE;

-- Drop existing view if it exists
DROP VIEW IF EXISTS v_password_reset_requests_with_users CASCADE;

-- Create password_reset_requests table
CREATE TABLE password_reset_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    reset_type VARCHAR(20) NOT NULL DEFAULT 'email' 
        CHECK (reset_type IN ('email', 'temporary')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'used', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id), -- Admin who created the request
    used_by UUID REFERENCES public.users(id) -- User who used the reset
);

-- Create indexes for performance
CREATE INDEX idx_password_reset_requests_user_id ON password_reset_requests(user_id);
CREATE INDEX idx_password_reset_requests_token ON password_reset_requests(token);
CREATE INDEX idx_password_reset_requests_status ON password_reset_requests(status);
CREATE INDEX idx_password_reset_requests_email ON password_reset_requests(email);
CREATE INDEX idx_password_reset_requests_expires_at ON password_reset_requests(expires_at);

-- Create trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_password_reset_requests_updated_at
    BEFORE UPDATE ON password_reset_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own password reset requests" ON password_reset_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all password reset requests" ON password_reset_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can create password reset requests" ON password_reset_requests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can update password reset requests" ON password_reset_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY "Users can update own password reset requests" ON password_reset_requests
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON password_reset_requests TO authenticated;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS cleanup_expired_password_resets() CASCADE;

-- Create function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_password_resets()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired password reset requests
    DELETE FROM password_reset_requests 
    WHERE expires_at < NOW() 
    AND status IN ('pending', 'expired');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Mark expired tokens as expired
    UPDATE password_reset_requests 
    SET status = 'expired', updated_at = NOW()
    WHERE expires_at < NOW() 
    AND status = 'pending';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on cleanup function
GRANT EXECUTE ON FUNCTION cleanup_expired_password_resets TO authenticated;

-- Create view for admin dashboard with user information
CREATE VIEW v_password_reset_requests_with_users AS
SELECT 
    prr.*,
    u.full_name,
    u.email as user_email,
    u.user_type,
    creator.full_name as created_by_name,
    creator.email as created_by_email,
    user_used.full_name as used_by_name,
    user_used.email as used_by_email
FROM password_reset_requests prr
LEFT JOIN users u ON prr.user_id = u.id
LEFT JOIN users creator ON prr.created_by = creator.id
LEFT JOIN users user_used ON prr.used_by = user_used.id;

-- Grant access to the view
GRANT SELECT ON v_password_reset_requests_with_users TO authenticated;

-- Insert some sample data for testing using REAL existing users
-- First, let's create password reset requests for existing users
INSERT INTO password_reset_requests (user_id, email, token, reset_type, status, expires_at, created_by)
SELECT 
    id,
    email,
    'sample_token_' || substr(md5(id::text), 1, 20),
    'email',
    'pending',
    NOW() + INTERVAL '24 hours',
    id
FROM users 
WHERE user_type = 'user'
LIMIT 2
ON CONFLICT (token) DO NOTHING;

-- Insert some expired sample data using real users
INSERT INTO password_reset_requests (user_id, email, token, reset_type, status, expires_at, created_by)
SELECT 
    id,
    email,
    'expired_token_' || substr(md5(id::text), 1, 20),
    'email',
    'expired',
    NOW() - INTERVAL '1 hour',
    id
FROM users 
WHERE user_type = 'partner'
LIMIT 1
ON CONFLICT (token) DO NOTHING;

-- Insert some used sample data using real users
INSERT INTO password_reset_requests (user_id, email, token, reset_type, status, expires_at, used_at, used_by, created_by)
SELECT 
    id,
    email,
    'used_token_' || substr(md5(id::text), 1, 20),
    'email',
    'used',
    NOW() + INTERVAL '24 hours',
    NOW() - INTERVAL '30 minutes',
    id,
    id
FROM users 
WHERE user_type = 'admin'
LIMIT 1
ON CONFLICT (token) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE password_reset_requests IS 'Table for managing password reset tokens and requests';
COMMENT ON COLUMN password_reset_requests.reset_type IS 'Type of reset: email (link) or temporary password';
COMMENT ON COLUMN password_reset_requests.status IS 'Status: pending, used, expired, or cancelled';
COMMENT ON COLUMN password_reset_requests.expires_at IS 'When the reset token expires';
COMMENT ON COLUMN password_reset_requests.created_by IS 'Admin who created the reset request';
COMMENT ON COLUMN password_reset_requests.used_by IS 'User who used the reset token';
COMMENT ON VIEW v_password_reset_requests_with_users IS 'Password reset requests with user details';
COMMENT ON FUNCTION cleanup_expired_password_resets IS 'Cleans up expired password reset tokens';

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'password_reset_requests' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Password reset requests table created successfully!';
    RAISE NOTICE 'Sample data inserted for testing';
    RAISE NOTICE 'View created with user information';
    RAISE NOTICE 'Table structure verified above';
END $$;
