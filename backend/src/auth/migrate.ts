import { pool } from "../db";
import { hashPassword } from "./security";

export async function migrateAuthAndSettings() {
  await pool.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS retention_days INT`);
  await pool.query(`UPDATE settings SET retention_days = 365 WHERE retention_days IS NULL`);
  await pool.query(`ALTER TABLE settings ALTER COLUMN retention_days SET DEFAULT 365`);
  await pool.query(`ALTER TABLE settings ALTER COLUMN retention_days SET NOT NULL`);
  await pool.query(`INSERT INTO settings(id,retention_days) VALUES(1,365) ON CONFLICT (id) DO NOTHING`);

  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE`);
  await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
  await pool.query(`UPDATE users SET role='administrator' WHERE role='admin'`);
  await pool.query(`UPDATE users SET role='operator' WHERE role='viewer'`);
  await pool.query(`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('administrator','operator'))`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`);

  // v1.6.3 device identity migration. Keep old rows intact, but all new events use source IP.
  await pool.query(`ALTER TABLE systemevents ADD COLUMN IF NOT EXISTS reported_hostname TEXT`);
  await pool.query(`ALTER TABLE devices ADD COLUMN IF NOT EXISTS reported_hostname TEXT`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_devices_reported_hostname ON devices(reported_hostname)`);
  // Old versions stored the fallback address in name. Turn those values back into "no alias".
  await pool.query(`UPDATE devices SET name = NULL WHERE name = fromhost`);
  // Preserve the legacy host value as reported hostname where possible.
  await pool.query(`UPDATE devices SET reported_hostname = fromhost WHERE reported_hostname IS NULL`);

  await pool.query(`
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
    $$ LANGUAGE SQL IMMUTABLE
  `);

  await pool.query(`
    CREATE OR REPLACE FUNCTION syslog_device_display_name(alias_name TEXT, reported TEXT, source_address TEXT)
    RETURNS TEXT AS $$
      SELECT COALESCE(
        NULLIF(BTRIM(alias_name), ''),
        CASE WHEN syslog_hostname_is_valid(reported) THEN BTRIM(reported) ELSE NULL END,
        NULLIF(BTRIM(source_address), ''),
        'Unknown'
      );
    $$ LANGUAGE SQL IMMUTABLE
  `);

  await pool.query(`
    CREATE OR REPLACE FUNCTION process_new_event()
    RETURNS trigger AS $$
    BEGIN
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
    $$ LANGUAGE plpgsql
  `);
  await pool.query(`DROP TRIGGER IF EXISTS systemevents_notify ON systemevents`);
  await pool.query(`
    CREATE TRIGGER systemevents_notify
    AFTER INSERT ON systemevents
    FOR EACH ROW EXECUTE FUNCTION process_new_event()
  `);

  const count = await pool.query(`SELECT COUNT(*)::int AS count FROM users`);
  if (Number(count.rows[0]?.count ?? 0) === 0) {
    await pool.query(
      `INSERT INTO users(login,password_hash,role,must_change_password) VALUES($1,$2,'administrator',TRUE)`,
      ["admin", hashPassword("syslog")],
    );
    console.log("Default administrator created: admin / syslog (password change required)");
  }
}
