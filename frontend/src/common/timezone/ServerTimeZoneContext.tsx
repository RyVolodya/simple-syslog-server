import { createContext, useContext } from "react";

export interface ServerTimeZoneInfo {
  timeZone: string | null;
  offsetMinutes: number;
}

export const ServerTimeZoneContext = createContext<ServerTimeZoneInfo>({
  timeZone: null,
  offsetMinutes: 0,
});

export const useServerTimeZone = () => useContext(ServerTimeZoneContext);

const formatterTimeZone = (info: ServerTimeZoneInfo) => info.timeZone || "UTC";
const shiftedForOffset = (date: Date, info: ServerTimeZoneInfo) =>
  info.timeZone ? date : new Date(date.getTime() + info.offsetMinutes * 60_000);

export const formatServerDateTime = (value: string | Date, info: ServerTimeZoneInfo) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("uk-UA", {
    timeZone: formatterTimeZone(info),
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(shiftedForOffset(date, info));
};

export const formatServerHour = (value: string | Date, info: ServerTimeZoneInfo) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: formatterTimeZone(info),
    hour: "2-digit",
    hour12: false,
  }).format(shiftedForOffset(date, info)) + ":00";
};

export const serverLocalDateTimeToIso = (value: string, info: ServerTimeZoneInfo) => {
  if (!value) return undefined;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return new Date(value).toISOString();

  const [, y, mo, d, h, mi, sec = "00"] = match;
  const desiredUtc = Date.UTC(+y, +mo - 1, +d, +h, +mi, +sec);

  if (!info.timeZone) {
    return new Date(desiredUtc - info.offsetMinutes * 60_000).toISOString();
  }

  let guess = desiredUtc;
  const wallClockAsUtc = (ms: number) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: info.timeZone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(ms));
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value || 0);
    return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  };

  for (let pass = 0; pass < 2; pass += 1) guess += desiredUtc - wallClockAsUtc(guess);
  return new Date(guess).toISOString();
};


export const formatServerTimeZoneLabel = (info: ServerTimeZoneInfo) => {
  if (info.timeZone) return info.timeZone;
  const sign = info.offsetMinutes >= 0 ? "+" : "-";
  const absolute = Math.abs(info.offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
  const minutes = String(absolute % 60).padStart(2, "0");
  return `UTC${sign}${hours}:${minutes}`;
};
