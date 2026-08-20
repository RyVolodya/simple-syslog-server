import { Router } from "express";
import { pool } from "../db";

const router = Router();

const severityLabels = [
  "Emergency",
  "Alert",
  "Critical",
  "Error",
  "Warning",
  "Notice",
  "Informational",
  "Debug",
];

type QueryFilters = {
  deviceId?: unknown;
  type?: unknown;
  from?: unknown;
  to?: unknown;
  search?: unknown;
};

const buildWhere = ({ deviceId, type, from, to, search }: QueryFilters) => {
  const params: unknown[] = [];
  const where: string[] = [];

  if (deviceId) {
    params.push(Number(deviceId));
    where.push(`d.id = $${params.length}`);
  }

  if (type !== undefined && type !== "") {
    params.push(Number(type));
    where.push(`(s.priority & 7) = $${params.length}`);
  }

  if (from) {
    params.push(String(from));
    where.push(`s.receivedat >= $${params.length}`);
  }

  if (to) {
    params.push(String(to));
    where.push(`s.receivedat <= $${params.length}`);
  }

  if (search) {
    params.push(`%${String(search).trim()}%`);
    where.push(`s.message ILIKE $${params.length}`);
  }

  return {
    params,
    whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "",
  };
};

const mapMessage = (row: Record<string, unknown>) => ({
  ...row,
  severity: Number(row.severity),
  severityLabel: severityLabels[Number(row.severity)] ?? "Unknown",
});

router.get("/stats", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT (priority & 7) AS severity, COUNT(*)::int AS count
      FROM systemevents
      WHERE receivedat >= NOW() - INTERVAL '24 hours'
      GROUP BY (priority & 7)
      ORDER BY severity
    `);

    const counts = Array.from({ length: 8 }, (_, severity) => ({
      severity,
      label: severityLabels[severity],
      count: 0,
    }));

    for (const row of rows) {
      const severity = Number(row.severity);
      if (severity >= 0 && severity <= 7) counts[severity].count = Number(row.count);
    }

    res.json(counts);
  } catch (error) {
    next(error);
  }
});

router.get("/export", async (req, res, next) => {
  try {
    const { params, whereSql } = buildWhere(req.query);
    const maxExportRows = 50000;

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM systemevents s
       LEFT JOIN devices d ON d.fromhost = s.fromhost
       ${whereSql}`,
      params,
    );
    const total = Number(countResult.rows[0]?.total ?? 0);

    const dataParams = [...params, maxExportRows];
    const limitParam = dataParams.length;
    const { rows } = await pool.query(
      `SELECT s.id,
              s.receivedat AS time,
              d.id AS "deviceKey",
              syslog_device_display_name(d.name, COALESCE(d.reported_hostname, s.reported_hostname), s.fromhost) AS "deviceId",
              (s.priority & 7) AS severity,
              s.message
       FROM systemevents s
       LEFT JOIN devices d ON d.fromhost = s.fromhost
       ${whereSql}
       ORDER BY s.receivedat DESC
       LIMIT $${limitParam}`,
      dataParams,
    );

    res.json({
      items: rows.map(mapMessage),
      total,
      exported: rows.length,
      truncated: total > maxExportRows,
      maxRows: maxExportRows,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { page = "1", limit = "10" } = req.query;
    const requestedPage = Math.max(1, Number(page) || 1);
    const requestedLimit = Number(limit) || 10;
    const pageSize = [10, 25, 50, 100].includes(requestedLimit) ? requestedLimit : 10;

    const { params, whereSql } = buildWhere(req.query);

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM systemevents s
      LEFT JOIN devices d ON d.fromhost = s.fromhost
      ${whereSql}
    `;

    const countResult = await pool.query(countSql, params);
    const total = Number(countResult.rows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(requestedPage, totalPages);
    const offset = (safePage - 1) * pageSize;

    const dataParams = [...params, pageSize, offset];
    const limitParam = dataParams.length - 1;
    const offsetParam = dataParams.length;

    const sql = `
      SELECT s.id,
             s.receivedat AS time,
             d.id AS "deviceKey",
             syslog_device_display_name(d.name, COALESCE(d.reported_hostname, s.reported_hostname), s.fromhost) AS "deviceId",
             (s.priority & 7) AS severity,
             s.message
      FROM systemevents s
      LEFT JOIN devices d ON d.fromhost = s.fromhost
      ${whereSql}
      ORDER BY s.receivedat DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const { rows } = await pool.query(sql, dataParams);

    res.json({
      items: rows.map(mapMessage),
      pagination: {
        page: safePage,
        limit: pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
