-- Create visit_distribution table for automatic store visit distribution
-- This table stores the configuration for automatic visit distribution to partner stores

CREATE TABLE IF NOT EXISTS visit_distribution (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_visits INTEGER NOT NULL DEFAULT 0,
  time_period VARCHAR(10) NOT NULL CHECK (time_period IN ('hour', 'minute', 'second')),
  visits_per_unit INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT false,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP WITH TIME ZONE,
  total_distributed INTEGER NOT NULL DEFAULT 0,
  last_distribution TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT visit_distribution_check_total_visits CHECK (total_visits >= 0),
  CONSTRAINT visit_distribution_check_visits_per_unit CHECK (visits_per_unit >= 0),
  CONSTRAINT visit_distribution_check_time_period CHECK (time_period IN ('hour', 'minute', 'second'))
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_visit_distribution_partner_id ON visit_distribution(partner_id);
CREATE INDEX IF NOT EXISTS idx_visit_distribution_is_active ON visit_distribution(is_active);
CREATE INDEX IF NOT EXISTS idx_visit_distribution_created_at ON visit_distribution(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE visit_distribution ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage all visit distributions
CREATE POLICY "Admins can manage all visit distributions" ON visit_distribution
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type IN ('admin', 'partner')
    )
  );

-- Policy for partners to view their own visit distributions
CREATE POLICY "Partners can view own visit distributions" ON visit_distribution
  FOR SELECT USING (
    partner_id = auth.uid()
  );

-- Policy for inserting visit records (for the distribution system)
CREATE POLICY "Service role can insert visit distribution" ON visit_distribution
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type IN ('admin', 'partner')
    )
  );

-- Policy for updating visit distributions
CREATE POLICY "Service role can update visit distribution" ON visit_distribution
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type IN ('admin', 'partner')
    )
  );

-- Add comments for documentation
COMMENT ON TABLE visit_distribution IS 'Stores automatic visit distribution configuration for partner stores';
COMMENT ON COLUMN visit_distribution.partner_id IS 'Reference to the partner user';
COMMENT ON COLUMN visit_distribution.total_visits IS 'Total visits to distribute over the time period';
COMMENT ON COLUMN visit_distribution.time_period IS 'Time period for distribution (hour, minute, second)';
COMMENT ON COLUMN visit_distribution.visits_per_unit IS 'Number of visits to add per time unit';
COMMENT ON COLUMN visit_distribution.is_active IS 'Whether the distribution is currently active';
COMMENT ON COLUMN visit_distribution.start_time IS 'When the distribution started';
COMMENT ON COLUMN visit_distribution.end_time IS 'When the distribution should end';
COMMENT ON COLUMN visit_distribution.total_distributed IS 'Total visits that have been distributed so far';
COMMENT ON COLUMN visit_distribution.last_distribution IS 'Timestamp of the last distribution';
