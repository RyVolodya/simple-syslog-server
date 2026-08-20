import { pool } from "../db";

export async function getStatsDevices() {
  const { rows } = await pool.query(`
    SELECT
      syslog_device_display_name(d.name, d.reported_hostname, s.fromhost) AS device_id,
      COUNT(*)::int AS messages,
      SUM(COUNT(*)) OVER ()::int AS total_messages,
      ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0), 2)::float AS percent,
      MAX(s.receivedat) AS updated_at
    FROM systemevents s
    LEFT JOIN devices d ON d.fromhost = s.fromhost
    WHERE s.receivedat >= NOW() - INTERVAL '24 hours'
    GROUP BY s.fromhost, d.name, d.reported_hostname
    ORDER BY messages DESC
    LIMIT 10
  `);
  return rows;
}
