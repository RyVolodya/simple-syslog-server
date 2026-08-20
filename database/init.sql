CREATE TABLE IF NOT EXISTS devices (
  id BIGSERIAL PRIMARY KEY,
  fromhost TEXT NOT NULL UNIQUE,
  reported_hostname TEXT,
  name TEXT,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_devices_reported_hostname ON devices (reported_hostname);

CREATE TABLE IF NOT EXISTS systemevents (
  id BIGSERIAL PRIMARY KEY,
  priority INT NOT NULL DEFAULT 6 CHECK (priority BETWEEN 0 AND 191),
  receivedat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fromhost TEXT NOT NULL,
  reported_hostname TEXT,
  message TEXT NOT NULL,
  device_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_systemevents_receivedat ON systemevents (receivedat DESC);
CREATE INDEX IF NOT EXISTS idx_systemevents_fromhost ON systemevents (fromhost);
CREATE INDEX IF NOT EXISTS idx_systemevents_priority ON systemevents (priority);
CREATE INDEX IF NOT EXISTS idx_systemevents_host_receivedat ON systemevents (fromhost, receivedat DESC);

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
  SELECT COALESCE(
    NULLIF(BTRIM(alias_name), ''),
    CASE WHEN syslog_hostname_is_valid(reported) THEN BTRIM(reported) ELSE NULL END,
    NULLIF(BTRIM(source_address), ''),
    'Unknown'
  );
$$ LANGUAGE SQL IMMUTABLE;

CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY,
  retention_days INT NOT NULL DEFAULT 365 CHECK (retention_days >= 1)
);
INSERT INTO settings (id, retention_days)
VALUES (1, 365)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  login TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('administrator', 'operator')),
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE OR REPLACE FUNCTION process_new_event()
RETURNS trigger AS $$
BEGIN
  -- v1.6.3: fromhost is the actual UDP/TCP source IP. reported_hostname is kept separately.
  INSERT INTO devices (fromhost, reported_hostname, name, first_seen, last_seen)
  VALUES (NEW.fromhost, NULLIF(BTRIM(NEW.reported_hostname), ''), NULL, NEW.receivedat, NEW.receivedat)
  ON CONFLICT (fromhost) DO UPDATE
    SET last_seen = EXCLUDED.last_seen,
        reported_hostname = COALESCE(NULLIF(BTRIM(EXCLUDED.reported_hostname), ''), devices.reported_hostname);

  PERFORM pg_notify('systemevents_insert', row_to_json(NEW)::text);
  PERFORM pg_notify('table_size_updates', '');
  PERFORM pg_notify('stats_channel', '');
  PERFORM pg_notify('log_updates', '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS systemevents_notify ON systemevents;
CREATE TRIGGER systemevents_notify
AFTER INSERT ON systemevents
FOR EACH ROW EXECUTE FUNCTION process_new_event();
