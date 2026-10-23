import "server-only";
import { createHash } from "node:crypto";
import { createProvisioningClient } from "@/lib/supabase/admin";
import { ProductPhotoSchema, type ProductPhoto } from "./schemas/product-rpc.schema";

const bucket = "product-photos";
const variants = ["display", "thumb"] as const;
const objectPath = (variant: string, hash: string) => `products/${variant}/${hash}`;

function webpSize(bytes: Buffer): { width: number; height: number } | null {
  if (bytes.length < 20 || bytes.toString("ascii", 0, 4) !== "RIFF" ||
      bytes.toString("ascii", 8, 12) !== "WEBP" || bytes.readUInt32LE(4) + 8 !== bytes.length) return null;
  let size: { width: number; height: number } | null = null;
  let image = false;
  for (let offset = 12; offset < bytes.length;) {
    if (offset + 8 > bytes.length) return null;
    const kind = bytes.toString("ascii", offset, offset + 4);
    const length = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + length;
    if (end > bytes.length || end + (length % 2) > bytes.length) return null;
    if (kind === "VP8X") {
      if (size || image || length !== 10 || (bytes[start] & 2) !== 0) return null; // One canvas header, no animation.
      size = { width: bytes.readUIntLE(start + 4, 3) + 1, height: bytes.readUIntLE(start + 7, 3) + 1 };
    } else if (kind === "VP8 ") {
      if (image || length < 10 || (bytes[start] & 1) !== 0 ||
          bytes.toString("hex", start + 3, start + 6) !== "9d012a") return null;
      const frame = { width: bytes.readUInt16LE(start + 6) & 0x3fff, height: bytes.readUInt16LE(start + 8) & 0x3fff };
      if (size && (size.width !== frame.width || size.height !== frame.height)) return null;
      size = frame;
      image = true;
    } else if (kind === "VP8L") {
      if (image || length < 5 || bytes[start] !== 0x2f) return null;
      const bits = bytes.readUInt32LE(start + 1);
      if (bits >>> 29 !== 0) return null;
      const frame = { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
      if (size && (size.width !== frame.width || size.height !== frame.height)) return null;
      size = frame;
      image = true;
    } else if (!["ALPH", "ICCP"].includes(kind)) {
      return null; // Canvas may retain its color profile; no EXIF, XMP or animation chunks.
    }
    offset = end + (length % 2);
  }
  return image && size && size.width > 0 && size.height > 0 ? size : null;
}

// Validate both variants before any upload. A failure cannot commit product metadata.
export async function uploadProductPhoto(photo: ProductPhoto | null | undefined, files?: FormData): Promise<"validation" | "storage" | null> {
  if (!photo) return files && [...files.keys()].length ? "validation" : null;
  const parsed = ProductPhotoSchema.safeParse(photo);
  if (!parsed.success || !files || [...files.keys()].some((key) => !variants.includes(key as typeof variants[number]))) return "validation";
  const uploads = [];
  for (const variant of variants) {
    const entries = files.getAll(variant);
    const file = entries[0];
    if (entries.length !== 1 || !(file instanceof File) || file.type !== "image/webp" ||
        file.size < 1 || file.size > 131072 || file.size !== photo[variant].bytes) return "validation";
    const bytes = Buffer.from(await file.arrayBuffer());
    const size = webpSize(bytes);
    if (!size || size.width !== photo[variant].width || size.height !== photo[variant].height ||
        createHash("sha256").update(bytes).digest("hex") !== photo[variant].hash) return "validation";
    uploads.push({ path: objectPath(variant, photo[variant].hash), bytes });
  }
  try {
    const storage = createProvisioningClient().storage.from(bucket);
    for (const upload of uploads) {
      const result = await storage.upload(upload.path, upload.bytes, { contentType: "image/webp", upsert: false });
      if (!result.error) continue;
      // A retry or another product may already own these exact bytes. Never overwrite an immutable key.
      const existing = await storage.download(upload.path);
      if (existing.error || !existing.data) return "storage";
      const bytes = Buffer.from(await existing.data.arrayBuffer());
      if (!bytes.equals(upload.bytes)) return "storage";
    }
    return null;
  } catch {
    return "storage";
  }
}

export async function removeUnreferencedPhotos(hashes: string[], client: { rpc: (name: string, input: { p_input: { hashes: string[] } }) => PromiseLike<{ data: unknown; error: unknown }> }) {
  if (!hashes.length) return;
  try {
    const result = await client.rpc("stockos_release_photo", { p_input: { hashes: [...new Set(hashes)] } });
    if (result.error) return;
    const data = result.data as { ok?: boolean; data?: { unreferenced?: unknown } } | null;
    if (!data?.ok || !Array.isArray(data.data?.unreferenced) ||
        !data.data.unreferenced.every((hash) => typeof hash === "string" && hashes.includes(hash))) return;
    const paths = data.data.unreferenced.flatMap((hash: string) => variants.map((variant) => objectPath(variant, hash)));
    if (paths.length) await createProvisioningClient().storage.from(bucket).remove(paths);
    // Database delete trigger protects references attached between the check and Storage delete.
  } catch {
    // Best effort: an orphan is safer than losing a referenced photo.
  }
}
