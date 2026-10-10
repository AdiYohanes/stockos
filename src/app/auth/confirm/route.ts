import { NextResponse, type NextRequest } from "next/server";
import { verifyPasswordPurpose } from "@/features/auth/server";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const type = params.get("type");
  const destination = new URL(type === "recovery" ? "/login?auth=invalid-recovery" : "/login?auth=invalid-invitation", process.env.STOCKOS_APP_URL!);
  const token = params.get("token_hash");
  if ((type === "invite" || type === "recovery") && token && /^(?:pkce_)?[a-f0-9]{56,64}$/.test(token)
    && params.getAll("type").length === 1 && params.getAll("token_hash").length === 1
    && [...params.keys()].every((key) => key === "type" || key === "token_hash")
    && await verifyPasswordPurpose(token, type)) {
    destination.pathname = "/newpassword";
    destination.search = "";
  }
  const response = NextResponse.redirect(destination);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
