import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { prepareZXingModule, writeBarcode } from "zxing-wasm/writer";
import { loadBarcodeReader, barcodeCandidate } from "../src/features/products/barcode-scanner.ts";

prepareZXingModule({ overrides: { wasmBinary: await readFile(new URL("../node_modules/zxing-wasm/dist/writer/zxing_writer.wasm", import.meta.url)) } });
const read = await loadBarcodeReader(await readFile(new URL("../node_modules/zxing-wasm/dist/reader/zxing_reader.wasm", import.meta.url)));
for (const [format, input, expected] of [
  ["EAN13", "0123456789012", "0123456789012"],
  ["EAN8", "01234565", "01234565"],
  // ZXing returns EAN-13 text for UPC-A and expanded UPC-E; no app normalization.
  ["UPCA", "012345678905", "0012345678905"],
  ["UPCE", "01234565", "0012345000065"],
  ["Code128", "00SHOP-A12", "00SHOP-A12"],
]) {
  const image = await writeBarcode(input, { format, scale: 3 });
  assert.equal(image.error, "", `${format} fixture`);
  assert.ok(image.image, `${format} PNG`);
  const results = await read(new Uint8Array(await image.image.arrayBuffer()));
  assert.equal(results.length, 1, `${format} result count`);
  assert.equal(barcodeCandidate(results[0]), expected, `${format} text`);
  console.log(`${format}: ${JSON.stringify(results[0].text)} (${results[0].format})`);
}
const qr = await writeBarcode("0123456789012", { format: "QRCode", scale: 3 });
assert.equal((await read(new Uint8Array(await qr.image.arrayBuffer()))).length, 0, "QR excluded");
for (const result of [
  { isValid: true, format: "QRCode", text: "123" },
  { isValid: false, format: "Code128", text: "123" },
  { isValid: true, format: "Code128", text: " " },
  { isValid: true, format: "Code128", text: "A".repeat(65) },
]) assert.equal(barcodeCandidate(result), null);
assert.equal(barcodeCandidate({ isValid: true, format: "Code128", text: " 001-A " }), "001-A");
console.log("Barcode decoder contract passed; physical camera compatibility not tested.");
