import assert from "node:assert/strict";
import { getReportDates } from "../src/features/reports/dates.ts";

const boundary = new Date("2026-10-10T16:30:00.000Z");
assert.deepEqual(getReportDates("7d", "Asia/Jakarta", boundary), { startDate: "2026-10-04", endDate: "2026-10-11", expectedTimezone: "Asia/Jakarta" });
assert.deepEqual(getReportDates("7d", "Asia/Makassar", boundary), { startDate: "2026-10-05", endDate: "2026-10-12", expectedTimezone: "Asia/Makassar" });
assert.deepEqual(getReportDates("7d", "Asia/Jayapura", boundary), { startDate: "2026-10-05", endDate: "2026-10-12", expectedTimezone: "Asia/Jayapura" });
for (const [timeframe, startDate] of [["30d", "2026-09-11"], ["90d", "2026-07-13"], ["12m", "2025-10-11"]]) {
  assert.equal(getReportDates(timeframe, "Asia/Jakarta", boundary).startDate, startDate);
}
assert.deepEqual(getReportDates("7d", "Asia/Jakarta", new Date("2024-02-29T18:00:00Z")), { startDate: "2024-02-24", endDate: "2024-03-02", expectedTimezone: "Asia/Jakarta" });
assert.throws(() => getReportDates("7d", "UTC", boundary));
console.log("PASS: shop-local report dates, midnight boundary, 7/30/90/365 days and leap day");
const { buildCsv, csvText } = await import("../src/features/reports/csv.ts");
assert.equal(buildCsv(["Amount", "Name"], [["-0.000001", csvText(" -1")], ["999999999999999999999", csvText('=SUM(1,2)')]]), `Amount,Name\r\n-0.000001,"' -1"\r\n999999999999999999999,"'=SUM(1,2)"`);
assert.equal(buildCsv(["H"], [[csvText('a,"b\n')]]), `H\r\n"a,""b\n"`);
assert.equal(buildCsv(["H"], [["é"]], 5), "H\r\né");
assert.throws(() => buildCsv(["H"], [["é"]], 4), /LIMIT_EXCEEDED/);
let visited = 0;
function* huge() { for (let i = 0; i < 10000; i++) { visited++; yield ["xx"]; } }
assert.throws(() => buildCsv(["H"], huge(), 6), /LIMIT_EXCEEDED/);
assert.equal(visited, 2, "CSV must stop consuming rows immediately on overflow");
console.log("PASS: CSV exact negative/large numbers, text formula defense, escaping, UTF-8 bounded incremental output");

const { moneyChartShare } = await import("../src/features/reports/chart.ts");
assert.equal(moneyChartShare("500000000000000000000.000000", ["1000000000000000000000", "1"]), 50);
assert.equal(moneyChartShare("0.000001", ["0.000003", "0"]), 33.33);
assert.equal(moneyChartShare("0", ["0", "0"]), 0);
assert.equal(moneyChartShare("200", ["100"]), 100);
console.log("PASS: chart geometry uses exact BigInt normalization and bounded ratios");
