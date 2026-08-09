"use client";

import * as React from "react";
import Link from "next/link";
import { AuthForm } from "@/features/auth/components/auth-form";
import { FormField } from "@/features/auth/components/form-field";
import { PasswordField } from "@/features/auth/components/password-field";
import type { AuthFormState } from "@/features/auth/types";

function SignupForm() {
  const [state, setState] = React.useState<AuthFormState>({ status: "idle" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function validate(form: FormData): Record<string, string> {
    const fieldErrors: Record<string, string> = {};
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const confirmPassword = form.get("confirmPassword") as string;

    if (!email) {
      fieldErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fieldErrors.email = "Enter a valid email address";
    }

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

    setState({ status: "success", message: "Account created successfully" });
  }

  return (
    <AuthForm
      title="Create an account"
      description="Enter your details to get started"
      submitLabel="Sign up"
      state={state}
      onSubmit={handleSubmit}
      footer={
        <>
          Already have an account?{" "}
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
      <PasswordField
        label="Password"
        name="password"
        placeholder="Create a password"
        autoComplete="new-password"
        required
        error={errors.password}
      />
      <PasswordField
        label="Confirm password"
        name="confirmPassword"
        placeholder="Confirm your password"
        autoComplete="new-password"
        required
        error={errors.confirmPassword}
      />
    </AuthForm>
  );
}

export { SignupForm };
