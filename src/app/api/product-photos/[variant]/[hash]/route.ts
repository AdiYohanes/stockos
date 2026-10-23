import { createHash } from "node:crypto";
import { authorizeProducts } from "@/features/products/server";
import { createProvisioningClient } from "@/lib/supabase/admin";

export async function GET(request: Request, { params }: { params: Promise<{ variant: string; hash: string }> }) {
  const authorization = await authorizeProducts(true);
  const noStore = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", Vary: "Cookie" };
  if (!authorization.ok) return new Response(null, {
    status: authorization.code === "INTERNAL_ERROR" ? 503 : authorization.code === "UNAUTHENTICATED" ? 401 : 403,
    headers: noStore,
  });
  const { variant, hash } = await params;
  if (!["display", "thumb"].includes(variant) || !/^[0-9a-f]{64}$/.test(hash)) return new Response(null, { status: 404, headers: noStore });
  const headers = {
    "Content-Type": "image/webp", "X-Content-Type-Options": "nosniff", Vary: "Cookie",
    "Cache-Control": "private, max-age=31536000, immutable", ETag: `"${hash}"`,
  };
  try {
    const result = await createProvisioningClient().storage.from("product-photos").download(`products/${variant}/${hash}`);
    if (result.error || !result.data) return new Response(null, { status: 404, headers: noStore });
    if (result.data.size > 131072) return new Response(null, { status: 502, headers: noStore });
    const bytes = Buffer.from(await result.data.arrayBuffer());
    if (createHash("sha256").update(bytes).digest("hex") !== hash) return new Response(null, { status: 502, headers: noStore });
    // A conditional hit still requires a live owner and an existing, intact object.
    if (request.headers.get("if-none-match")?.split(",").some((tag) => tag.trim().replace(/^W\//, "") === headers.ETag)) {
      return new Response(null, { status: 304, headers });
    }
    return new Response(bytes, { headers: { ...headers, "Content-Length": String(bytes.length) } });
  } catch {
    return new Response(null, { status: 503, headers: noStore });
  }
}
