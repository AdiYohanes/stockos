"use client";

import * as React from "react";
import Link from "next/link";
import { AuthForm } from "@/features/auth/components/auth-form";
import { FormField } from "@/features/auth/components/form-field";
import { PasswordField } from "@/features/auth/components/password-field";
import type { AuthFormState } from "@/features/auth/types";

function LoginForm() {
  const [state, setState] = React.useState<AuthFormState>({ status: "idle" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function validate(form: FormData): Record<string, string> {
    const fieldErrors: Record<string, string> = {};
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    if (!email) {
      fieldErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fieldErrors.email = "Enter a valid email address";
    }

    if (!password) {
      fieldErrors.password = "Password is required";
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

    setState({ status: "success", message: "Logged in successfully" });
  }

  return (
    <AuthForm
      title="Log in to your account"
      description="Enter your credentials to continue"
      submitLabel="Log in"
      state={state}
      onSubmit={handleSubmit}
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Sign up
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
        placeholder="Enter your password"
        autoComplete="current-password"
        required
        error={errors.password}
      />
      <div className="flex justify-end">
        <Link
          href="/auth/reset"
          className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Forgot password?
        </Link>
      </div>
    </AuthForm>
  );
}

export { LoginForm };
