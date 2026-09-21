-- =============================================
-- Dagi's Credit Tracker — Database Schema
-- =============================================

-- Drop tables in reverse dependency order (for re-runs)
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS credit_transactions CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================
-- 1. USERS — Shop owner/admin accounts
-- =============================================
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  username      VARCHAR(50)  UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  language      VARCHAR(10)  DEFAULT 'en',
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  last_login    TIMESTAMPTZ
);

CREATE INDEX idx_users_username ON users(username);

-- =============================================
-- 2. CUSTOMERS — People who receive credit
-- =============================================
CREATE TABLE customers (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  phone            VARCHAR(20),
  block            VARCHAR(50),
  house_number     VARCHAR(20),
  language         VARCHAR(10)  DEFAULT 'am',
  status           VARCHAR(20)  DEFAULT 'active'
                     CHECK (status IN ('active', 'blacklisted')),
  blacklist_reason TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_customers_name   ON customers(name);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_phone  ON customers(phone);

-- =============================================
-- 3. CREDIT_TRANSACTIONS — Items given on credit
-- =============================================
CREATE TABLE credit_transactions (
  id          SERIAL PRIMARY KEY,
  customer_id INT            NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  item        VARCHAR(200)   NOT NULL,
  amount      DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  credit_date TIMESTAMPTZ    DEFAULT NOW(),
  due_date    TIMESTAMPTZ,
  status      VARCHAR(20)    DEFAULT 'unpaid'
                CHECK (status IN ('unpaid', 'partial', 'paid')),
  notes       TEXT,
  created_by  INT            NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ    DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    DEFAULT NOW()
);

CREATE INDEX idx_credits_customer ON credit_transactions(customer_id);
CREATE INDEX idx_credits_status   ON credit_transactions(status);
CREATE INDEX idx_credits_date     ON credit_transactions(credit_date);

-- =============================================
-- 4. PAYMENTS — Cash payments from customers
-- =============================================
CREATE TABLE payments (
  id                    SERIAL PRIMARY KEY,
  customer_id           INT            NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  credit_transaction_id INT            REFERENCES credit_transactions(id) ON DELETE SET NULL,
  amount_paid           DECIMAL(12, 2) NOT NULL CHECK (amount_paid > 0),
  payment_date          TIMESTAMPTZ    DEFAULT NOW(),
  notes                 TEXT,
  recorded_by           INT            NOT NULL REFERENCES users(id),
  created_at            TIMESTAMPTZ    DEFAULT NOW()
);

CREATE INDEX idx_payments_customer    ON payments(customer_id);
CREATE INDEX idx_payments_transaction ON payments(credit_transaction_id);
CREATE INDEX idx_payments_date        ON payments(payment_date);

-- =============================================
-- 5. ACTIVITY_LOG — Audit trail for all changes
-- =============================================
CREATE TABLE activity_log (
  id             SERIAL PRIMARY KEY,
  user_id        INT          NOT NULL REFERENCES users(id),
  action         VARCHAR(100) NOT NULL,
  customer_id    INT          REFERENCES customers(id) ON DELETE SET NULL,
  transaction_id INT          REFERENCES credit_transactions(id) ON DELETE SET NULL,
  details        TEXT,
  created_at     TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_activity_user     ON activity_log(user_id);
CREATE INDEX idx_activity_customer ON activity_log(customer_id);
CREATE INDEX idx_activity_date     ON activity_log(created_at);
