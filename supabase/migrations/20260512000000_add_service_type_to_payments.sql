-- Add service_type column to payments for ride type tracking
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS service_type TEXT
  CHECK (service_type IN ('MORNING', 'AFTERNOON', 'BOTH'));
