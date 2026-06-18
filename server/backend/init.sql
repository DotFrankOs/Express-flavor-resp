-- Agregar a init.sql
CREATE INDEX IF NOT EXISTS idx_reservations_overlap ON reservations(restaurant_id, table_number, status, start_time, end_time);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(50);