import { Router } from "express";
import devices from "./devices";
import listDevices from "./getDevices";
import messageFilter from "./getMessageFilter";
import messageLimit from "./getMessagesLimit";
import settings from "./settings";
import stats from "./stats";
import admin from "./admin";
import auth from "./auth";
import { pool } from "../db";
import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { blockOperatorWrites, requireAdministrator, requireAuth, requireCompletedPasswordChange } from "../auth/session";

const router = Router();
router.get("/health", async (_req, res) => {
  try { await pool.query("SELECT 1"); res.json({ status: "ok" }); }
  catch { res.status(503).json({ status: "database unavailable" }); }
});
const execFileAsync = promisify(execFile);

const parseOffset = (value: string) => {
  const match = value.trim().match(/^([+-])(\d{2})(\d{2})$/);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === "-" ? -minutes : minutes;
};

const offsetForZone = (timeZone: string, date: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value || 0);
  const zonedAsUtc = Date.UTC(
    get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"),
  );
  return Math.round((zonedAsUtc - date.getTime()) / 60000);
};

router.get("/timezone", async (_req, res) => {
  const now = new Date();

  // Linux /etc/localtime is authoritative. `date +%z` uses exactly the
  // timezone that `docker compose exec backend date` reports.
  let offsetMinutes = 0;
  let abbreviation = "UTC";
  try {
    const [{ stdout: rawOffset }, { stdout: rawAbbreviation }] = await Promise.all([
      execFileAsync("date", ["+%z"]),
      execFileAsync("date", ["+%Z"]),
    ]);
    offsetMinutes = parseOffset(rawOffset);
    abbreviation = rawAbbreviation.trim() || "UTC";
  } catch {
    offsetMinutes = -now.getTimezoneOffset();
  }

  // Use an IANA name only if it actually represents the same current offset
  // as Linux /etc/localtime. A stale /etc/timezone file is ignored.
  let timeZone: string | null = null;
  try {
    const configured = (await readFile("/etc/timezone", "utf8")).trim();
    if (configured && offsetForZone(configured, now) === offsetMinutes) {
      timeZone = configured;
    }
  } catch {
    // Optional file.
  }

  res.setHeader("Cache-Control", "no-store");
  res.json({
    timeZone,
    offsetMinutes,
    abbreviation,
    serverNow: now.toISOString(),
  });
});

router.use("/auth", auth);
router.use(requireAuth);
router.use(requireCompletedPasswordChange);
router.use(blockOperatorWrites);
router.use("/devices", devices);
router.use("/list-devices", listDevices);
router.use("/messages-filter", messageFilter);
router.use("/messages", messageLimit);
router.use("/stats", stats);
router.use("/settings", requireAdministrator, settings);
router.use("/admin", requireAdministrator, admin);
export default router;
