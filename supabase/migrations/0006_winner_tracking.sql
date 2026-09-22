-- Migration 0006: Winner verification and tracking

-- Rename proof_url to proof_path for clarity
ALTER TABLE winners RENAME COLUMN proof_url TO proof_path;

-- Add tracking columns for verification and payout
ALTER TABLE winners ADD COLUMN proof_uploaded_at TIMESTAMPTZ;
ALTER TABLE winners ADD COLUMN reviewed_by UUID REFERENCES profiles(id);
ALTER TABLE winners ADD COLUMN reviewed_at TIMESTAMPTZ;
ALTER TABLE winners ADD COLUMN paid_at TIMESTAMPTZ;

-- Ensure that a winner cannot be marked paid unless they are verified
ALTER TABLE winners ADD CONSTRAINT winners_payment_status_check
CHECK (payment_status <> 'paid' OR verification_status = 'approved');

-- Remove UPDATE policy for users on winners table to strictly enforce state transitions via server actions
DROP POLICY IF EXISTS "Winners can update their proof_url" ON winners;

-- The admin management policy remains:
-- CREATE POLICY "Admins can manage winners" ON winners USING (is_admin());
-- Users can still read their own winners:
-- CREATE POLICY "Winners viewable by everyone" ON winners FOR SELECT USING (true);
