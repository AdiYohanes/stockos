/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

// ponytail: compile TS in this check process only; use project's runner when one exists.
require.extensions[".ts"] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

const { MOCK_FINANCIAL_SUMMARY: financials, MOCK_OVERVIEW_METRICS: metrics } = require("../src/features/dashboard/mock-data.ts");
const { formatCurrency } = require("../src/lib/format.ts");
const { idTranslations: id } = require("../src/lib/i18n/translations/id.ts");
const { enTranslations: en } = require("../src/lib/i18n/translations/en.ts");

assert.deepEqual(metrics.map((metric) => metric.id), ["products", "revenue", "net_profit", "out_of_stock"]);
const revenue = metrics.find((metric) => metric.id === "revenue");
const profit = metrics.find((metric) => metric.id === "net_profit");
assert.equal(revenue.rawValue, financials.revenue);
assert.equal(profit.rawValue, financials.revenue - financials.costOfGoodsSold - financials.operatingExpenses);
assert.equal(profit.rawValue, 1825000);
for (const metric of [revenue, profit]) {
  assert.equal(metric.value, formatCurrency(metric.rawValue));
  assert.equal(metric.change, undefined, "No financial trend without comparison data");
}
for (const translation of [id, en]) {
  for (const key of ["revenue", "estimatedNetProfit", "demoData", "financialPeriod", "revenueSupportingText", "netProfitSupportingText"]) {
    assert.ok(translation.dashboard[key], `Missing dashboard translation: ${key}`);
  }
}
console.log("Dashboard metric checks passed.");
