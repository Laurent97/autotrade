-- Fix visit_distribution RLS policies and table structure
-- Run this if you get "policy already exists" errors

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all visit distributions" ON visit_distribution;
DROP POLICY IF EXISTS "Partners can view own visit distributions" ON visit_distribution;
DROP POLICY IF EXISTS "Service role can insert visit distribution" ON visit_distribution;
DROP POLICY IF EXISTS "Service role can update visit distribution" ON visit_distribution;

-- Update table structure if needed (using NUMERIC instead of DECIMAL)
ALTER TABLE visit_distribution 
ALTER COLUMN visits_per_unit TYPE NUMERIC(10,2) USING visits_per_unit::NUMERIC(10,2);

-- Recreate RLS policies
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
