import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSessionClient(writable = false) {
  const store = await cookies();
  return createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookieOptions: { httpOnly: true, secure: new URL(process.env.STOCKOS_APP_URL!).protocol === "https:", sameSite: "lax", path: "/" },
    cookies: {
      getAll: () => store.getAll(),
      ...(writable ? { setAll: (items: { name: string; value: string; options: import("@supabase/ssr").CookieOptions }[]) => {
        items.forEach(({ name, value, options }) => store.set(name, value, options));
      } } : {}),
    },
  });
}
