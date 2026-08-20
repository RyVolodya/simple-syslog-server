// Last 24 fixed hourly buckets: current hour + previous 23 hours.
// Using hour-aligned boundaries prevents the oldest bucket from shrinking
// minute-by-minute as a sliding NOW() - 24 hours cutoff moves forward.
import { pool } from "../db/pool";

export async function getLast24Stats() {
  const query = `
    WITH hours AS (
      SELECT generate_series(
        date_trunc('hour', NOW()) - INTERVAL '23 hours',
        date_trunc('hour', NOW()),
        INTERVAL '1 hour'
      ) AS hour
    ), counts AS (
      SELECT
        date_trunc('hour', receivedat) AS hour,
        COUNT(*)::int AS total
      FROM systemevents
      WHERE receivedat >= date_trunc('hour', NOW()) - INTERVAL '23 hours'
        AND receivedat <  date_trunc('hour', NOW()) + INTERVAL '1 hour'
      GROUP BY 1
    )
    SELECT
      h.hour,
      COALESCE(c.total, 0)::int AS total
    FROM hours h
    LEFT JOIN counts c USING (hour)
    ORDER BY h.hour
  `;

  const { rows } = await pool.query(query);
  return rows;
}
