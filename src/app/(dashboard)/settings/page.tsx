import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOwnerSession } from "@/features/auth/server";
import { getShopSettings } from "@/features/settings/server";
import { SettingsContainer } from "@/features/settings";

export const metadata: Metadata = {
  title: "Pengaturan | StockOS",
  description: "Konfigurasi profil toko dan standar persediaan warung.",
};

export default async function SettingsPage() {
  const user = await getOwnerSession();
  if (!user) redirect("/login");

  const settingsResult = await getShopSettings();
  if (!settingsResult.ok) {
    if (settingsResult.code === "UNAUTHENTICATED" || settingsResult.code === "FORBIDDEN") {
      redirect("/login");
    }
    throw new Error(settingsResult.message || "Gagal memuat pengaturan toko.");
  }

  return (
    <SettingsContainer
      initialSettings={settingsResult.data}
      ownerEmail={user.email}
    />
  );
}
