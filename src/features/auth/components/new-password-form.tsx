"use client";

import * as React from "react";
import Link from "next/link";
import { AuthForm } from "@/features/auth/components/auth-form";
import { PasswordField } from "@/features/auth/components/password-field";
import type { AuthFormState } from "@/features/auth/types";

function NewPasswordForm() {
  const [state, setState] = React.useState<AuthFormState>({ status: "idle" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function validate(form: FormData): Record<string, string> {
    const fieldErrors: Record<string, string> = {};
    const password = form.get("password") as string;
    const confirmPassword = form.get("confirmPassword") as string;

    if (!password) {
      fieldErrors.password = "Password is required";
    } else if (password.length < 8) {
      fieldErrors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      fieldErrors.confirmPassword = "Please confirm your password";
    } else if (password && confirmPassword !== password) {
      fieldErrors.confirmPassword = "Passwords do not match";
    }

    return fieldErrors;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const fieldErrors = validate(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setState({ status: "loading" });

    // Mock: simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setState({
      status: "success",
      message: "Your password has been updated. You can now log in.",
    });
  }

  return (
    <AuthForm
      title="Set a new password"
      description="Choose a new password for your account"
      submitLabel="Update password"
      state={state}
      onSubmit={handleSubmit}
      footer={
        <Link
          href="/auth/login"
          className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Back to log in
        </Link>
      }
    >
      <PasswordField
        label="New password"
        name="password"
        placeholder="Create a new password"
        autoComplete="new-password"
        required
        error={errors.password}
      />
      <PasswordField
        label="Confirm password"
        name="confirmPassword"
        placeholder="Confirm your new password"
        autoComplete="new-password"
        required
        error={errors.confirmPassword}
      />
    </AuthForm>
  );
}

export { NewPasswordForm };
