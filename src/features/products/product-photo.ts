import type { ProductPhoto } from "./schemas/product-rpc.schema";

export type PhotoDraft = { photo: ProductPhoto; files: FormData; preview: string };
export type PhotoError = "unsupported" | "tooLarge" | "invalid" | "insecure";

export async function processProductPhoto(file: File): Promise<PhotoDraft> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("unsupported" satisfies PhotoError);
  if (!file.size || file.size > 10 * 1024 * 1024) throw new Error("tooLarge" satisfies PhotoError);
  if (!globalThis.crypto?.subtle) throw new Error("insecure" satisfies PhotoError);
  const image = await createImageBitmap(file).catch(() => { throw new Error("invalid" satisfies PhotoError); });
  try {
    if (!image.width || !image.height || image.width * image.height > 40_000_000) throw new Error("tooLarge" satisfies PhotoError);
    const files = new FormData();
    const photo = {} as ProductPhoto;
    let display: Blob | null = null;
    for (const [variant, edge] of [["display", 512], ["thumb", 96]] as const) {
      const scale = Math.min(1, edge / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("invalid" satisfies PhotoError);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", 0.75));
      if (!blob || blob.type !== "image/webp") throw new Error("unsupported" satisfies PhotoError);
      if (!blob.size || blob.size > 131072) throw new Error("tooLarge" satisfies PhotoError);
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer())), byte => byte.toString(16).padStart(2, "0")).join("");
      photo[variant] = { hash, bytes: blob.size, width: canvas.width, height: canvas.height };
      files.set(variant, blob, `${variant}.webp`);
      if (variant === "display") display = blob;
    }
    return { photo, files, preview: URL.createObjectURL(display!) };
  } finally {
    image.close();
  }
}
