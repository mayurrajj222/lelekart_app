-- Add new columns for co-admin functionality
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_co_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;