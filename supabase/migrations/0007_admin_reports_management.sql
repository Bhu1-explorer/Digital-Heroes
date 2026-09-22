-- Add admin override audit fields to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN admin_override_by UUID REFERENCES profiles(id),
ADD COLUMN admin_override_at TIMESTAMPTZ;
