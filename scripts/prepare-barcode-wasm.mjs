import assert from "node:assert/strict";
import { copyFile, mkdir, readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const pkg = JSON.parse(await readFile(new URL("node_modules/zxing-wasm/package.json", root), "utf8"));
assert.equal(pkg.version, "3.1.5", "Review decoder asset path before changing version");
const directory = new URL("public/vendor/zxing-wasm/3.1.5/", root);
await mkdir(directory, { recursive: true });
await copyFile(new URL("node_modules/zxing-wasm/dist/reader/zxing_reader.wasm", root), new URL("zxing_reader.wasm", directory));
console.log("Prepared same-origin barcode reader WASM 3.1.5");
