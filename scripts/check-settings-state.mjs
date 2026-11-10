import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

// Execute actual pure decisions without mounting React or duplicating their implementation.
const file = ts.createSourceFile("settings-container.tsx", fs.readFileSync(new URL("../src/features/settings/components/settings-container.tsx", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const names = ["settingsSnapshotMode", "canReviewSettings"];
const functions = file.statements.filter(node => ts.isFunctionDeclaration(node) && names.includes(node.name?.text));
assert.equal(functions.length, names.length);
const { outputText } = ts.transpileModule(functions.map(node => node.getText(file)).join("\n"), { compilerOptions: { target: ts.ScriptTarget.ES2020 } });
const { settingsSnapshotMode, canReviewSettings } = vm.runInNewContext(`${outputText}; ({ settingsSnapshotMode, canReviewSettings })`);

assert.equal(settingsSnapshotMode("3", "1", false, false, true), "review", "Pristine draft during conflict must not auto-load incoming snapshot");
assert.equal(settingsSnapshotMode("3", "1", false, true, false), "review", "Dirty draft must survive incoming snapshot");
assert.equal(settingsSnapshotMode("3", "1", true, false, false), "review", "Pending/uncertain draft must survive incoming snapshot");
assert.equal(settingsSnapshotMode("3", "1", false, false, false), "load");
for (const version of ["1", "2"]) assert.equal(settingsSnapshotMode(version, "2", false, false, true), "ignore");
assert.equal(settingsSnapshotMode("9007199254740993", "9007199254740992", false, false, true), "review");
assert.equal(canReviewSettings("2", "3", false, false), false, "Stale review cannot lower baseline/expectedVersion");
assert.equal(canReviewSettings("3", "3", false, false), true);
assert.equal(canReviewSettings("3", "3", true, false), false);
assert.equal(canReviewSettings("3", "3", false, true), false);
console.log("PASS: Settings incoming-snapshot preservation and monotonic review decisions");
