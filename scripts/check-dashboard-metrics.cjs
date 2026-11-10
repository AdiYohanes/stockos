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

const { DashboardMetricDtoSchema } = require("../src/features/dashboard/schemas/dashboard-rpc.schema.ts");
const { formatProductMoney } = require("../src/features/products/format.ts");

// Glossary stock potentials: 15 units at Rp10,000, modal Rp52,500 after selling 5.
const metrics = DashboardMetricDtoSchema.parse({
  totalProducts: 1, inStockCount: 1, lowStockCount: 0, outOfStockCount: 0,
  potentialSellingValue: "150000", potentialGrossProfit: "97500.000000", totalCostValue: "52500.000000",
});
assert.equal(formatProductMoney(metrics.potentialSellingValue), "Rp 150.000");
assert.equal(formatProductMoney(metrics.potentialGrossProfit), "Rp 97.500");
assert.equal(formatProductMoney(metrics.totalCostValue), "Rp 52.500");

const negative = DashboardMetricDtoSchema.parse({ ...metrics, potentialGrossProfit: "-0.000001" });
assert.equal(formatProductMoney(negative.potentialGrossProfit), "Rp -0,000001");
const large = DashboardMetricDtoSchema.parse({ ...metrics, potentialSellingValue: "1000000000000000000000" });
assert.equal(formatProductMoney(large.potentialSellingValue), "Rp 1.000.000.000.000.000.000.000");
for (const invalid of [150000, "1e21", "NaN", "0.0000001"]) {
  assert.equal(DashboardMetricDtoSchema.safeParse({ ...metrics, potentialSellingValue: invalid }).success, false);
}
assert.equal(DashboardMetricDtoSchema.safeParse({ ...metrics, revenue: "150000" }).success, false);
assert.equal(DashboardMetricDtoSchema.safeParse({ ...metrics, net_profit: "97500" }).success, false);
console.log("Dashboard stock-potential DTO and exact-money checks passed.");
