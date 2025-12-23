-- Migration: Add user_id column to leads table for client authentication
-- This links Supabase auth users to their lead records

-- Add user_id column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);

-- Create index for email lookups (used in auth flow)
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Allow authenticated users to read their own lead data
CREATE POLICY IF NOT EXISTS "Users can read own lead" ON leads
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    auth.email() = email
  );

-- Allow authenticated users to update their own lead
CREATE POLICY IF NOT EXISTS "Users can update own lead" ON leads
  FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    auth.email() = email
  );
