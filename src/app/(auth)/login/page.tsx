import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your StockOS account",
};

export default function LoginPage() {
  return <LoginForm />;
}
