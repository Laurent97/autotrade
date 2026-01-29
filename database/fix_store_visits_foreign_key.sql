-- Fix store_visits foreign key constraint
-- Change partner_id reference from partner_profiles to users table

-- First, drop the existing foreign key constraint
ALTER TABLE store_visits DROP CONSTRAINT IF EXISTS store_visits_partner_id_fkey;

-- Then add the correct foreign key constraint pointing to users table
ALTER TABLE store_visits 
ADD CONSTRAINT store_visits_partner_id_fkey 
FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE;
