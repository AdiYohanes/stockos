import type { Metadata } from "next";
import { NewPasswordForm } from "@/features/auth/components/new-password-form";

export const metadata: Metadata = {
  title: "Set new password",
  description: "Set a new password for your StockOS account",
};

export default function NewPasswordPage() {
  return <NewPasswordForm />;
}
