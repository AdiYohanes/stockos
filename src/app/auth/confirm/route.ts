import { NextResponse, type NextRequest } from "next/server";
import { createSessionClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const destination = new URL("/login?auth=invalid-invitation", process.env.STOCKOS_APP_URL!);
  const params = request.nextUrl.searchParams;
  const token = params.get("token_hash");
  if (params.get("type") === "invite" && token && /^[a-f0-9]{56,64}$/.test(token)
    && [...params.keys()].every((key) => key === "type" || key === "token_hash")) {
    const client = await createSessionClient(true);
    const verified = await client.auth.verifyOtp({ token_hash: token, type: "invite" });
    if (!verified.error) {
      const owner = await client.rpc("stockos_owner_invitation");
      if (!owner.error) {
        destination.pathname = "/newpassword";
        destination.search = "";
      } else {
        await client.auth.signOut({ scope: "local" });
      }
    }
  }
  const response = NextResponse.redirect(destination);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
