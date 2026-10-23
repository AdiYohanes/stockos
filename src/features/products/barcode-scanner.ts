import type { ReaderOptions } from "zxing-wasm/reader";

const formats = ["EAN13", "EAN8", "UPCA", "UPCE", "Code128"] as const;
const options: ReaderOptions = { formats: [...formats], maxNumberOfSymbols: 1, textMode: "Plain" };
type BarcodeResult = { isValid: boolean; format: string; text: string };

export function barcodeCandidate(result: BarcodeResult): string | null {
  const text = result.text.trim();
  return result.isValid && formats.some(format => format === result.format) && text.length > 0 && text.length <= 64 ? text : null;
}

export async function readBarcodePhoto(file: File, read: Awaited<ReturnType<typeof loadBarcodeReader>>) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || !file.size || file.size > 10 * 1024 * 1024) throw new Error("invalidPhoto");
  const image = await createImageBitmap(file);
  try {
    if (!image.width || !image.height || image.width * image.height > 40_000_000) throw new Error("invalidPhoto");
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("invalidPhoto");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const results = await read(context.getImageData(0, 0, canvas.width, canvas.height));
    return results.length ? barcodeCandidate(results[0]) : null;
  } finally {
    image.close();
  }
}

export async function loadBarcodeReader(wasmBinary?: Uint8Array) {
  const reader = await import("zxing-wasm/reader");
  await reader.prepareZXingModule({
    overrides: wasmBinary ? { wasmBinary: new Uint8Array(wasmBinary).buffer } : { locateFile: () => "/vendor/zxing-wasm/3.1.5/zxing_reader.wasm" },
    fireImmediately: true,
  });
  return (image: ImageData | Uint8Array) => reader.readBarcodes(image, options);
}
