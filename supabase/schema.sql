-- Create the Events table
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  city TEXT,
  venue_name TEXT NOT NULL DEFAULT 'TBA',

  -- Sale Status Tracking
  status TEXT NOT NULL DEFAULT 'Upcoming',
  presale_start TIMESTAMPTZ,
  public_sale_start TIMESTAMPTZ,

  -- Group Sales / Discounts
  group_discount_available BOOLEAN DEFAULT FALSE,
  group_min_size INTEGER,
  discount_code TEXT,
  discount_note TEXT,

  -- Metadata & Monitoring
  notes_raw TEXT,
  source_url TEXT NOT NULL UNIQUE,
  last_checked TIMESTAMPTZ,
  content_hash TEXT,
  days_until_event INTEGER,
  check_priority INTEGER DEFAULT 1
);

-- Index for quick status lookups
CREATE INDEX idx_events_status ON events(status);

-- Index for source_url uniqueness checks
CREATE UNIQUE INDEX idx_events_source_url ON events(source_url);

-- Create the Subscribers table
CREATE TABLE subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discovery queue table
CREATE TABLE discovery_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  attempted BOOLEAN DEFAULT FALSE,
  last_processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
