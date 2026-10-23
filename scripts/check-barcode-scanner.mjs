import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { prepareZXingModule, writeBarcode } from "zxing-wasm/writer";
import { loadBarcodeReader, barcodeCandidate, readBarcodePhoto } from "../src/features/products/barcode-scanner.ts";
import { processProductPhoto } from "../src/features/products/product-photo.ts";

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
for (const file of [
  new File(["bad"], "wrong.txt", { type: "text/plain" }),
  new File([], "empty.jpg", { type: "image/jpeg" }),
  new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" }),
]) await assert.rejects(readBarcodePhoto(file, read), /invalidPhoto/);
const cryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
try {
  Object.defineProperty(globalThis, "crypto", { configurable: true, value: undefined });
  await assert.rejects(processProductPhoto(new File(["photo"], "photo.jpg", { type: "image/jpeg" })), /insecure/);
} finally {
  if (cryptoDescriptor) Object.defineProperty(globalThis, "crypto", cryptoDescriptor);
  else delete globalThis.crypto;
}
console.log("Barcode decoder, photo input limits and insecure photo processing guards passed; physical camera compatibility not tested.");
