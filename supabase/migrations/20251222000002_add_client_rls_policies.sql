-- Migration: Add RLS policies for client dashboard access

-- 1. Policies for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = payments.lead_id
      AND (leads.user_id = auth.uid() OR leads.email = auth.email())
    )
  );

-- 2. Policies for term_acceptance
ALTER TABLE term_acceptance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own term acceptances" ON term_acceptance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = term_acceptance.lead_id
      AND (leads.user_id = auth.uid() OR leads.email = auth.email())
    )
  );

CREATE POLICY "Users can create own term acceptances" ON term_acceptance
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = term_acceptance.lead_id
      AND (leads.user_id = auth.uid() OR leads.email = auth.email())
    )
  );

-- 3. Policies for consultation_forms
ALTER TABLE consultation_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consultation forms" ON consultation_forms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = consultation_forms.lead_id
      AND (leads.user_id = auth.uid() OR leads.email = auth.email())
    )
  );

CREATE POLICY "Users can create/update own consultation forms" ON consultation_forms
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = consultation_forms.lead_id
      AND (leads.user_id = auth.uid() OR leads.email = auth.email())
    )
  );

-- 4. Policies for meetings
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meetings" ON meetings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = meetings.lead_id
      AND (leads.user_id = auth.uid() OR leads.email = auth.email())
    )
  );

-- 5. Policies for client_plans
ALTER TABLE client_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plans" ON client_plans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = client_plans.lead_id
      AND (leads.user_id = auth.uid() OR leads.email = auth.email())
    )
  );

-- Ensure admin access remains (if not already handled by service role bypass or admin specific policies)
-- Adding generic admin policies just in case. 
-- Assuming admins are identified by email domain or specific role metadata, but for RLS usually admins use service_role key which bypasses RLS.
-- If admins use authenticated client, we'd need policies like:
-- CREATE POLICY "Admins can view all" ON table_name FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
