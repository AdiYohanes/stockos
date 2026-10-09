import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NewPasswordForm } from "@/features/auth/components/new-password-form";
import { getOwnerInvitation } from "@/features/auth/server";

export const metadata: Metadata = {
  title: "Set new password",
  description: "Set a new password for your StockOS account",
};

export default async function NewPasswordPage() {
  const invitation = await getOwnerInvitation();
  if (!invitation) redirect("/login?auth=invalid-invitation");
  return <NewPasswordForm />;
}
