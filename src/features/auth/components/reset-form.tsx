"use client";

import * as React from "react";
import Link from "next/link";
import { AuthForm } from "@/features/auth/components/auth-form";
import { FormField } from "@/features/auth/components/form-field";
import type { AuthFormState } from "@/features/auth/types";

function ResetForm() {
  const [state, setState] = React.useState<AuthFormState>({ status: "idle" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function validate(form: FormData): Record<string, string> {
    const fieldErrors: Record<string, string> = {};
    const email = form.get("email") as string;

    if (!email) {
      fieldErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fieldErrors.email = "Enter a valid email address";
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
      message:
        "Check your email for a reset link. If you don\u2019t see it, check your spam folder.",
    });
  }

  return (
    <AuthForm
      title="Reset your password"
      description="Enter your email and we'll send you a reset link"
      submitLabel="Send reset link"
      state={state}
      onSubmit={handleSubmit}
      footer={
        <>
          Remember your password?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Log in
          </Link>
        </>
      }
    >
      <FormField
        label="Email"
        name="email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        required
        error={errors.email}
      />
    </AuthForm>
  );
}

export { ResetForm };
