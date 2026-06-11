-- brandpilot-ai/supabase/schema.sql

-- 1. customers
CREATE TABLE customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  city text,
  gender text,
  age int,
  total_spent numeric default 0,
  last_purchase_date date,
  preferred_category text,
  created_at timestamp default now()
);

-- 2. orders
CREATE TABLE orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  product_name text,
  category text,
  order_value numeric,
  order_date date,
  created_at timestamp default now()
);

-- 3. segments
CREATE TABLE segments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  rules_json jsonb,
  created_by_ai boolean default true,
  customer_count int default 0,
  created_at timestamp default now()
);

-- 4. segment_customers
CREATE TABLE segment_customers (
  id uuid primary key default gen_random_uuid(),
  segment_id uuid references segments(id) on delete cascade,
  customer_id uuid references customers(id) on delete cascade,
  UNIQUE(segment_id, customer_id)
);

-- 5. campaigns
CREATE TABLE campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  goal text,
  segment_id uuid references segments(id) on delete set null,
  channel text,
  message_template text,
  status text default 'draft',
  sent_at timestamp,
  created_at timestamp default now()
);

-- 6. campaign_recipients
CREATE TABLE campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  customer_id uuid references customers(id) on delete cascade,
  personalized_message text,
  status text default 'pending', -- pending, sent, delivered, opened, clicked, converted, failed
  last_event_at timestamp,
  created_at timestamp default now(),
  UNIQUE(campaign_id, customer_id)
);

-- 7. communication_events
CREATE TABLE communication_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  customer_id uuid references customers(id) on delete cascade,
  event_type text,
  event_time timestamp default now(),
  metadata jsonb
);

-- Enable RLS and setup policies (for demo purposes we can allow all, but let's be careful or just use service role)
-- For this simple Next.js CRM, we will primarily use the service role key on the backend APIs
-- to bypass RLS, or anon key with public policies.
-- Let's just create public read/write policies for ease of development in this demo.
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON customers FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON customers FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON customers FOR DELETE USING (true);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON orders FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON orders FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON orders FOR DELETE USING (true);

ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON segments FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON segments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON segments FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON segments FOR DELETE USING (true);

ALTER TABLE segment_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON segment_customers FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON segment_customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON segment_customers FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON segment_customers FOR DELETE USING (true);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON campaigns FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON campaigns FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON campaigns FOR DELETE USING (true);

ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON campaign_recipients FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON campaign_recipients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON campaign_recipients FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON campaign_recipients FOR DELETE USING (true);

ALTER TABLE communication_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON communication_events FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON communication_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON communication_events FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON communication_events FOR DELETE USING (true);
