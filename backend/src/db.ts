import { Pool } from "pg";

export const pool = new Pool({
  host: process.env.PG_HOST || "postgres",
  port: Number(process.env.PG_PORT || 5432),
  user: process.env.PG_USER || "syslog",
  password: process.env.PG_PASSWORD || "change-me",
  database: process.env.PG_DATABASE || "rsyslog",
  max: 20,
  idleTimeoutMillis: 30_000,
});
