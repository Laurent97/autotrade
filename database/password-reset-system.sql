-- Password Reset System Database Schema
-- This file creates the necessary tables for secure password reset functionality

-- Create password reset requests table
CREATE TABLE IF NOT EXISTS password_reset_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    reset_token TEXT NOT NULL UNIQUE,
    temporary_password TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired')),
    
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_token CHECK (length(reset_token) >= 32),
    CONSTRAINT valid_temp_password CHECK (temporary_password IS NULL OR length(temporary_password) >= 8)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_user_id ON password_reset_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_email ON password_reset_requests(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_token ON password_reset_requests(reset_token);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_status ON password_reset_requests(status);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_expires_at ON password_reset_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_created_at ON password_reset_requests(created_at);

-- Create password reset activities table for audit trail
CREATE TABLE IF NOT EXISTS password_reset_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reset_request_id UUID REFERENCES password_reset_requests(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('created', 'sent', 'used', 'expired')),
    details TEXT,
    ip_address INET,
    user_agent TEXT,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_action CHECK (action IN ('created', 'sent', 'used', 'expired'))
);

-- Create indexes for activities
CREATE INDEX IF NOT EXISTS idx_password_reset_activities_user_id ON password_reset_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_activities_reset_request_id ON password_reset_activities(reset_request_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_activities_action ON password_reset_activities(action);
CREATE INDEX IF NOT EXISTS idx_password_reset_activities_created_at ON password_reset_activities(created_at);

-- Create function to clean up expired reset requests
CREATE OR REPLACE FUNCTION cleanup_expired_password_resets()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE password_reset_requests 
    SET status = 'expired'
    WHERE status = 'pending' 
    AND expires_at < NOW();
    
    -- Log the expiration activity
    INSERT INTO password_reset_activities (user_id, reset_request_id, action, details, created_at)
    SELECT 
        user_id, 
        id, 
        'expired', 
        'Reset request expired automatically',
        NOW()
    FROM password_reset_requests 
    WHERE status = 'expired' 
    AND expires_at < NOW()
    AND id NOT IN (
        SELECT reset_request_id 
        FROM password_reset_activities 
        WHERE action = 'expired'
    );
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically clean up expired requests
CREATE TRIGGER cleanup_expired_password_resets_trigger
    AFTER INSERT ON password_reset_activities
    FOR EACH STATEMENT
    EXECUTE FUNCTION cleanup_expired_password_resets();

-- Create function to generate secure reset tokens
CREATE OR REPLACE FUNCTION generate_secure_reset_token()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    token TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..32 LOOP
        token := token || SUBSTRING(chars, FLOOR(RANDOM() * LENGTH(chars) + 1), 1);
    END LOOP;
    RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate secure temporary passwords
CREATE OR REPLACE FUNCTION generate_secure_temp_password()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    password TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..16 LOOP
        password := password || SUBSTRING(chars, FLOOR(RANDOM() * LENGTH(chars) + 1), 1);
    END LOOP;
    RETURN password;
END;
$$ LANGUAGE plpgsql;

-- Create function to create password reset request
CREATE OR REPLACE FUNCTION create_password_reset_request(
    p_user_id UUID,
    p_email TEXT,
    p_reset_type TEXT DEFAULT 'email',
    p_expiry_hours INTEGER DEFAULT 24,
    p_created_by UUID,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_reset_token TEXT;
    v_temp_password TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_request_id UUID;
BEGIN
    -- Generate secure token
    v_reset_token := generate_secure_reset_token();
    
    -- Generate temporary password if needed
    IF p_reset_type = 'temporary' THEN
        v_temp_password := generate_secure_temp_password();
    END IF;
    
    -- Calculate expiry time
    v_expires_at := NOW() + (p_expiry_hours || 24) * INTERVAL '1 hour';
    
    -- Create the reset request
    INSERT INTO password_reset_requests (
        user_id,
        email,
        reset_token,
        temporary_password,
        expires_at,
        created_by,
        status
    ) VALUES (
        p_user_id,
        p_email,
        v_reset_token,
        v_temp_password,
        v_expires_at,
        p_created_by,
        'pending'
    ) RETURNING id INTO v_request_id;
    
    -- Log the creation activity
    INSERT INTO password_reset_activities (
        user_id,
        reset_request_id,
        action,
        details,
        admin_id
    ) VALUES (
        p_user_id,
        v_request_id,
        'created',
        COALESCE('Password reset ' || p_reset_type || ' created by admin' || COALESCE(': ' || p_admin_notes, ''), 'Password reset created'),
        p_created_by
    );
    
    RETURN v_request_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark reset request as used
CREATE OR REPLACE FUNCTION mark_password_reset_used(
    p_reset_token TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN := FALSE;
BEGIN
    UPDATE password_reset_requests 
    SET 
        status = 'used',
        used_at = NOW()
    WHERE reset_token = p_reset_token
    AND status = 'pending'
    AND (p_user_id IS NULL OR user_id = p_user_id)
    AND expires_at > NOW();
    
    v_updated := FOUND;
    
    IF v_updated THEN
        -- Log the usage activity
        INSERT INTO password_reset_activities (
            user_id,
            reset_request_id,
            action,
            details
        ) SELECT 
            user_id,
            id,
            'used',
            'Password reset used successfully'
        FROM password_reset_requests 
        WHERE reset_token = p_reset_token;
    END IF;
    
    RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- Create view for active reset requests
CREATE OR REPLACE VIEW active_password_resets AS
SELECT 
    prr.*,
    u.full_name as user_name,
    u.email as user_email,
    u.user_type,
    u.last_sign_in,
    c.full_name as created_by_name,
    c.email as created_by_email
FROM password_reset_requests prr
JOIN users u ON prr.user_id = u.id
JOIN users c ON prr.created_by = c.id
WHERE prr.status = 'pending'
AND prr.expires_at > NOW();

-- Create view for reset statistics
CREATE OR REPLACE VIEW password_reset_stats AS
SELECT 
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
    COUNT(*) FILTER (WHERE status = 'used') as used_requests,
    COUNT(*) FILTER (WHERE status = 'expired') as expired_requests,
    COUNT(*) FILTER (WHERE temporary_password IS NOT NULL) as temporary_passwords,
    COUNT(*) FILTER (WHERE temporary_password IS NULL) as email_resets,
    DATE_TRUNC('day', created_at) as date
FROM password_reset_requests
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL ON password_reset_requests TO authenticated_users;
-- GRANT ALL ON password_reset_activities TO authenticated_users;
-- GRANT SELECT ON active_password_resets TO authenticated_users;
-- GRANT SELECT ON password_reset_stats TO authenticated_users;

-- Enable Row Level Security (RLS)
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own reset requests" ON password_reset_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reset requests" ON password_reset_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can insert reset requests" ON password_reset_requests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can update reset requests" ON password_reset_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

CREATE POLICY "Users can view their own activities" ON password_reset_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activities" ON password_reset_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can insert activities" ON password_reset_activities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Comments for documentation
COMMENT ON TABLE password_reset_requests IS 'Stores password reset requests with secure tokens and temporary passwords';
COMMENT ON TABLE password_reset_activities IS 'Audit trail for all password reset activities';
COMMENT ON COLUMN password_reset_requests.reset_token IS 'Secure token for password reset (32 characters)';
COMMENT ON COLUMN password_reset_requests.temporary_password IS 'Temporary password for users (16 characters, if used)';
COMMENT ON COLUMN password_reset_requests.expires_at IS 'When the reset token expires';
COMMENT ON COLUMN password_reset_requests.status IS 'Current status: pending, used, or expired';
COMMENT ON COLUMN password_reset_activities.action IS 'Type of activity: created, sent, used, or expired';

-- Sample data for testing (remove in production)
-- INSERT INTO password_reset_requests (user_id, email, reset_token, temporary_password, expires_at, created_by, status)
-- VALUES 
--     ('550e8400-e29b-41d4-a716-446655440000', 'admin@example.com', 'abc123def456ghi789jkl012mno345pq', 'TempPass123!', NOW() + INTERVAL '24 hours', '550e8400-e29b-41d4-a716-446655440000', 'pending');

-- INSERT INTO password_reset_activities (user_id, reset_request_id, action, details, admin_id)
-- VALUES 
--     ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'created', 'Password reset created by admin', '550e8400-e29b-41d4-a716-446655440000');
