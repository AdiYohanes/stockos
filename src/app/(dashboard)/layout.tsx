import { redirect } from "next/navigation";
import { getOwnerSession } from "@/features/auth/server";
import { AppShell } from "@/components/layout/app-shell";
import { FeatureStoresProvider } from "@/components/providers/feature-stores-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOwnerSession();

  if (!user) {
    redirect("/login");
  }

  return (
    <FeatureStoresProvider>
      <AppShell user={user}>{children}</AppShell>
    </FeatureStoresProvider>
  );
}
