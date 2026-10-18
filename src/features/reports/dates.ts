import type { ReportTimeframe } from "./types";

export type ShopTimezone = "Asia/Jakarta" | "Asia/Makassar" | "Asia/Jayapura";

export function getReportDates(timeframe: ReportTimeframe, timezone: ShopTimezone, now = new Date()) {
  if (!["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"].includes(timezone)) throw new Error("VALIDATION_ERROR");
  const parts = new Intl.DateTimeFormat("en", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = (kind: Intl.DateTimeFormatPartTypes) => Number(parts.find(part => part.type === kind)?.value);
  const end = Date.UTC(value("year"), value("month") - 1, value("day") + 1);
  const days = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 }[timeframe];
  return { startDate: new Date(end - days * 86_400_000).toISOString().slice(0, 10), endDate: new Date(end).toISOString().slice(0, 10), expectedTimezone: timezone };
}
