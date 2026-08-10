import { redirect } from "next/navigation";
import { getMockAuthState } from "@/features/auth/mock-auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user } = await getMockAuthState();

  if (!isAuthenticated) {
    redirect("/login");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
