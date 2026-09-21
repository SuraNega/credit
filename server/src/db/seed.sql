-- =============================================
-- Dagi's Credit Tracker — Seed Data
-- =============================================
-- Default admin password: admin123
-- Hash generated with bcrypt (10 rounds)

-- Insert default admin user
INSERT INTO users (name, username, password_hash, language)
VALUES (
  'Dagi',
  'admin',
  '$2a$10$X1a2FLk/pbs2DLjFwvz2m.2Ms8Yc8B./AxRkr2LoVAW574ssFjsni',
  'en'
) ON CONFLICT (username) DO NOTHING;

-- Insert sample customers
INSERT INTO customers (name, phone, block, house_number, language, status, notes)
VALUES
  ('Abebe Kebede',   '0911223344', 'Block A', '12',  'am', 'active', 'Regular customer'),
  ('Fatima Hassan',  '0922334455', 'Block B', '7',   'am', 'active', 'Pays on time'),
  ('Yonas Tesfaye',  '0933445566', 'Block A', '22',  'am', 'active', NULL);

-- Insert sample credit transactions (created by admin, user id = 1)
INSERT INTO credit_transactions (customer_id, item, amount, credit_date, due_date, status, created_by)
VALUES
  (1, 'Sugar 1kg',        45.00,  NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', 'unpaid',  1),
  (1, 'Cooking Oil 1L',   120.00, NOW() - INTERVAL '5 days',  NOW() + INTERVAL '25 days', 'unpaid',  1),
  (2, 'Rice 2kg',         90.00,  NOW() - INTERVAL '7 days',  NOW() + INTERVAL '23 days', 'partial', 1),
  (3, 'Flour 2kg',        65.00,  NOW() - INTERVAL '3 days',  NULL,                       'unpaid',  1);

-- Insert sample payments
INSERT INTO payments (customer_id, credit_transaction_id, amount_paid, payment_date, recorded_by)
VALUES
  (2, 3, 50.00, NOW() - INTERVAL '2 days', 1);

-- Insert sample activity log entries
INSERT INTO activity_log (user_id, action, customer_id, transaction_id, details)
VALUES
  (1, 'CREATE_CUSTOMER',     1, NULL, 'Created customer Abebe Kebede'),
  (1, 'CREATE_CUSTOMER',     2, NULL, 'Created customer Fatima Hassan'),
  (1, 'CREATE_CUSTOMER',     3, NULL, 'Created customer Yonas Tesfaye'),
  (1, 'CREATE_CREDIT',       1, 1,    'Credit: Sugar 1kg — 45.00 ETB'),
  (1, 'CREATE_CREDIT',       1, 2,    'Credit: Cooking Oil 1L — 120.00 ETB'),
  (1, 'CREATE_CREDIT',       2, 3,    'Credit: Rice 2kg — 90.00 ETB'),
  (1, 'CREATE_CREDIT',       3, 4,    'Credit: Flour 2kg — 65.00 ETB'),
  (1, 'RECORD_PAYMENT',      2, 3,    'Payment of 50.00 ETB for Rice 2kg');
