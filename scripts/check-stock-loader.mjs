import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const modules = new Map();

// Render real TSX and its provider without Next.js, auth, or environment files.
function load(relative) {
  const filename = path.resolve(root, relative);
  if (modules.has(filename)) return modules.get(filename).exports;
  const source = fs.readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const loadedModule = { exports: {} };
  modules.set(filename, loadedModule);
  const localRequire = (specifier) => {
    if (!specifier.startsWith("@/") && !specifier.startsWith(".")) return require(specifier);
    const base = specifier.startsWith("@/") ? path.join(root, "src", specifier.slice(2)) : path.resolve(path.dirname(filename), specifier);
    const resolved = [base, `${base}.tsx`, `${base}.ts`].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    assert.ok(resolved, `Cannot resolve ${specifier}`);
    return load(resolved);
  };
  vm.runInThisContext(`(function(require, module, exports) { ${outputText}\n})`, { filename })(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

const { StockLoader } = load("src/components/shared/stock-loader.tsx");
const { I18nProvider } = load("src/lib/i18n/context.tsx");
const render = (component, props) => renderToStaticMarkup(React.createElement(I18nProvider, null, React.createElement(component, props)));
const markup = render(StockLoader);
assert.equal((markup.match(/role="status"/g) ?? []).length, 1);
assert.match(markup, /Memuat\.\.\./);
assert.match(markup, /<svg[^>]*aria-hidden="true"[^>]*focusable="false"/);
assert.equal((markup.match(/class="stock-loader-box"/g) ?? []).length, 3);
assert.doesNotMatch(markup, /role="progressbar"|aria-valuenow/);
const customMarkup = render(StockLoader, { label: "Loading products...", className: "custom-loader" });
assert.match(customMarkup, /custom-loader/);
assert.match(customMarkup, /Loading products\.\.\./);
assert.match(render(StockLoader, { label: "<unsafe>" }), /&lt;unsafe&gt;/);

const renderedRoute = render(load("src/app/loading.tsx").default);
assert.ok(renderedRoute.includes(markup), "Root route boundary must reuse StockLoader");
assert.ok(!fs.existsSync(path.join(root, "src/app/(dashboard)/loading.tsx")), "Dashboard menu navigation must not show the loader");
const css = fs.readFileSync(path.join(root, "src/app/globals.css"), "utf8");
assert.match(css, /@keyframes stock-loader-conveyor/);
assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{\s*\.stock-loader-box\s*\{\s*animation:\s*none;/);
console.log("PASS: loader SSR, translated default, custom label, safe markup, root boundary only, reduced motion");

const previewIndex = process.argv.indexOf("--preview-dir");
if (previewIndex !== -1) {
  const directory = process.argv[previewIndex + 1];
  assert.ok(directory, "--preview-dir requires a temporary output directory");
  const { default: postcss } = await import("postcss");
  const { default: tailwind } = await import("@tailwindcss/postcss");
  const result = await postcss([tailwind({ base: root })]).process(css, { from: path.join(root, "src/app/globals.css") });
  fs.mkdirSync(directory, { recursive: true });
  for (const name of ["root"]) {
    fs.writeFileSync(path.join(directory, `${name}.html`), `<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>StockOS loading preview</title><style>${result.css}</style><body>${renderedRoute}</body></html>`);
  }
  console.log(`Preview written: ${directory}`);
}
