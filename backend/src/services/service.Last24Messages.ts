// 144 fixed ten-minute buckets: current bucket and previous 143 buckets.
// Filter by indexed receivedat before grouping to avoid a full-table scan.
import { pool } from "../db/pool";

export async function getLast24Stats() {
  const query = `
    WITH bounds AS (
      SELECT date_trunc('hour', NOW())
        + (floor(extract(minute from NOW()) / 10)::int * INTERVAL '10 minutes') AS current_bucket
    ), buckets AS (
      SELECT generate_series(
        current_bucket - INTERVAL '1430 minutes',
        current_bucket,
        INTERVAL '10 minutes'
      ) AS hour FROM bounds
    ), counts AS (
      SELECT
        date_trunc('hour', receivedat)
          + (floor(extract(minute from receivedat) / 10)::int * INTERVAL '10 minutes') AS hour,
        COUNT(*)::int AS total
      FROM systemevents, bounds
      WHERE receivedat >= current_bucket - INTERVAL '1430 minutes'
        AND receivedat < current_bucket + INTERVAL '10 minutes'
      GROUP BY 1
    )
    SELECT b.hour, COALESCE(c.total, 0)::int AS total
    FROM buckets b LEFT JOIN counts c USING (hour)
    ORDER BY b.hour
  `;
  const { rows } = await pool.query(query);
  return rows;
}
