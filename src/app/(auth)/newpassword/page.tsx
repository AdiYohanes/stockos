import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NewPasswordForm } from "@/features/auth/components/new-password-form";
import { getOwnerInvitation, getOwnerRecovery } from "@/features/auth/server";

export const metadata: Metadata = {
  title: "Set new password",
  description: "Set a new password for your StockOS account",
};

export default async function NewPasswordPage() {
  const recovery = await getOwnerRecovery();
  if (recovery) return <NewPasswordForm mode="recovery" />;
  const invitation = await getOwnerInvitation();
  if (!invitation) redirect("/login?auth=invalid-recovery");
  return <NewPasswordForm mode="invite" />;
}
