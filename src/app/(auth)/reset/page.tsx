import type { Metadata } from "next";
import { ResetForm } from "@/features/auth/components/reset-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Reset your StockOS account password",
};

export default function ResetPage() {
  return <ResetForm />;
}
