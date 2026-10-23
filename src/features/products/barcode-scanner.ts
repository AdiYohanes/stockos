import type { ReaderOptions } from "zxing-wasm/reader";

const formats = ["EAN13", "EAN8", "UPCA", "UPCE", "Code128"] as const;
const options: ReaderOptions = { formats: [...formats], maxNumberOfSymbols: 1, textMode: "Plain" };
type BarcodeResult = { isValid: boolean; format: string; text: string };

export function barcodeCandidate(result: BarcodeResult): string | null {
  const text = result.text.trim();
  return result.isValid && formats.some(format => format === result.format) && text.length > 0 && text.length <= 64 ? text : null;
}

export async function loadBarcodeReader(wasmBinary?: Uint8Array) {
  const reader = await import("zxing-wasm/reader");
  await reader.prepareZXingModule({
    overrides: wasmBinary ? { wasmBinary: new Uint8Array(wasmBinary).buffer } : { locateFile: () => "/vendor/zxing-wasm/3.1.5/zxing_reader.wasm" },
    fireImmediately: true,
  });
  return (image: ImageData | Uint8Array) => reader.readBarcodes(image, options);
}
