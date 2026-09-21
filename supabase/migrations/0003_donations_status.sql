-- Migration 0003: Enforce pending/completed status on donations

-- Set default for new rows
ALTER TABLE donations ALTER COLUMN status SET DEFAULT 'pending';

-- Update any existing rows that might not conform, just in case
UPDATE donations SET status = 'completed' WHERE status IS NULL OR status NOT IN ('pending', 'completed');

-- Add check constraint to enforce the values
ALTER TABLE donations ADD CONSTRAINT donations_status_check CHECK (status IN ('pending', 'completed'));
