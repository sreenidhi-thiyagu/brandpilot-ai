-- ============================================================
-- BrandPilot AI — Supabase PostgreSQL Schema
-- ============================================================
-- Run this in Supabase SQL editor to set up all required tables.
-- For local dev, SQLite is used via Prisma (see prisma/schema.prisma).
-- This file documents the equivalent Supabase/PostgreSQL schema.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- customers
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT        NOT NULL,
  email              TEXT,
  phone              TEXT,
  city               TEXT,
  gender             TEXT,
  age                INTEGER,
  total_spent        NUMERIC     DEFAULT 0,
  last_purchase_date TIMESTAMPTZ,
  preferred_category TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_name TEXT,
  category     TEXT,
  order_value  NUMERIC,
  order_date   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- ============================================================
-- segments
-- ============================================================
CREATE TABLE IF NOT EXISTS segments (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  description    TEXT,
  rules_json     JSONB,
  created_by_ai  BOOLEAN     DEFAULT TRUE,
  customer_count INTEGER     DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- segment_customers (junction table)
-- ============================================================
CREATE TABLE IF NOT EXISTS segment_customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id  UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  UNIQUE(segment_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_seg_cust_segment_id  ON segment_customers(segment_id);
CREATE INDEX IF NOT EXISTS idx_seg_cust_customer_id ON segment_customers(customer_id);

-- ============================================================
-- campaigns
-- ============================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL,
  goal             TEXT,
  segment_id       UUID        REFERENCES segments(id) ON DELETE SET NULL,
  channel          TEXT,
  message_template TEXT,
  status           TEXT        DEFAULT 'draft',  -- draft | sent
  sent_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_segment_id ON campaigns(segment_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status      ON campaigns(status);

-- ============================================================
-- campaign_recipients
-- ============================================================
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id          UUID        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  customer_id          UUID        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  personalized_message TEXT,
  status               TEXT        DEFAULT 'pending', -- pending | sent | delivered | failed | opened | clicked | converted
  last_event_at        TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_recipients_customer_id ON campaign_recipients(customer_id);
CREATE INDEX IF NOT EXISTS idx_recipients_status       ON campaign_recipients(status);

-- ============================================================
-- communication_events (full audit log)
-- ============================================================
CREATE TABLE IF NOT EXISTS communication_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  customer_id UUID        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  event_type  TEXT,       -- sent | delivered | failed | opened | clicked | converted
  event_time  TIMESTAMPTZ DEFAULT NOW(),
  metadata    JSONB
);

CREATE INDEX IF NOT EXISTS idx_events_campaign_id ON communication_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_events_customer_id ON communication_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type   ON communication_events(event_type);

-- ============================================================
-- Row Level Security (RLS) — Optional for Supabase
-- Enable if using Supabase Auth
-- ============================================================
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
-- etc.
