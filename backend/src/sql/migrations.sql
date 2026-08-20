CREATE TABLE IF NOT EXISTS systemevents (
  id BIGSERIAL PRIMARY KEY,
  priority INT,
  receivedat TIMESTAMPTZ DEFAULT NOW(),
  fromhost TEXT,
  reported_hostname TEXT,
  message TEXT,
  device_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_systemevents_receivedat ON systemevents (receivedat DESC);
CREATE INDEX IF NOT EXISTS idx_systemevents_fromhost ON systemevents (fromhost);
CREATE INDEX IF NOT EXISTS idx_systemevents_priority ON systemevents (priority);

CREATE TABLE IF NOT EXISTS devices (
  id BIGSERIAL PRIMARY KEY,
  fromhost TEXT NOT NULL UNIQUE,
  reported_hostname TEXT,
  name TEXT,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_devices_reported_hostname ON devices(reported_hostname);

CREATE OR REPLACE FUNCTION syslog_hostname_is_valid(value TEXT)
RETURNS BOOLEAN AS $$
  SELECT CASE
    WHEN value IS NULL OR BTRIM(value) = '' THEN FALSE
    WHEN LOWER(BTRIM(value)) IN ('-', 'localhost', 'unknown', 'none', 'null') THEN FALSE
    WHEN LOWER(BTRIM(value)) ~ '^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)$' THEN FALSE
    WHEN LOWER(BTRIM(value)) ~ '^(january|february|march|april|may|june|july|august|september|october|november|december)$' THEN FALSE
    WHEN LOWER(BTRIM(value)) ~ '^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[[:space:]]+[0-9]{1,2}$' THEN FALSE
    WHEN BTRIM(value) ~ '^[0-9]{4}[-/.][0-9]{1,2}[-/.][0-9]{1,2}$' THEN FALSE
    WHEN BTRIM(value) ~ '^[0-9]{1,2}[-/.][0-9]{1,2}([-/.][0-9]{2,4})?$' THEN FALSE
    WHEN BTRIM(value) ~ '^[0-9]+$' THEN FALSE
    WHEN BTRIM(value) ~ '^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?$' THEN FALSE
    ELSE TRUE
  END;
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION syslog_device_display_name(alias_name TEXT, reported TEXT, source_address TEXT)
RETURNS TEXT AS $$
  SELECT COALESCE(NULLIF(BTRIM(alias_name), ''), CASE WHEN syslog_hostname_is_valid(reported) THEN BTRIM(reported) ELSE NULL END, NULLIF(BTRIM(source_address), ''), 'Unknown');
$$ LANGUAGE SQL IMMUTABLE;
