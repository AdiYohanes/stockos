"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import type { AuthFormState } from "@/features/auth/types";
import { cn } from "@/lib/utils";

export function ResetForm() {
  const [email, setEmail] = React.useState("");
  const [state, setState] = React.useState<AuthFormState>({ status: "idle" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};

    if (!email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Invalid email format";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validate()) return;

    setState({ status: "loading" });

    await new Promise((resolve) => setTimeout(resolve, 800));

    setState({
      status: "success",
      message: "Reset link sent! Please check your inbox for instructions.",
    });
  }

  const isLoading = state.status === "loading";
  const isSuccess = state.status === "success";

  return (
    <div className="w-full max-w-[450px] mx-auto">
      {/* Clean SaaS Card with Neo Accent */}
      <div className="relative rounded-xl border border-border bg-white p-7 sm:p-8 shadow-neo">
        
        {/* Card Header */}
        <div className="mb-6 space-y-1">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Reset Password
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Enter your registered email to receive a password reset link.
          </p>
        </div>

        {/* Status Alerts */}
        {state.status === "error" && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-md border border-black bg-[#fee2e2] p-3 text-xs font-semibold text-[#b91c1c] shadow-neo-sm"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-mono">{state.message}</div>
          </div>
        )}

        {state.status === "success" && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-md border border-black bg-[#dcfce7] p-3 text-xs font-semibold text-[#15803d] shadow-neo-sm"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-mono">{state.message}</div>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="font-heading text-xs font-semibold text-foreground flex items-center justify-between"
            >
              <span>Email Address</span>
              {errors.email && (
                <span className="font-mono text-[11px] text-destructive">
                  {errors.email}
                </span>
              )}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isLoading || isSuccess}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
              }}
              placeholder="demo@stockos.com"
              className={cn(
                "w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground transition-all outline-none placeholder:text-muted-foreground focus:border-black focus:shadow-[2px_2px_0px_#543afd]",
                errors.email && "border-destructive shadow-[2px_2px_0px_#ef4444]"
              )}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isSuccess}
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded-md border-[1.5px] border-black bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-neo-sm transition-all duration-100 hover:-translate-x-px hover:-translate-y-px hover:shadow-neo hover:bg-[#462ee0] active:translate-x-px active:translate-y-px active:shadow-none cursor-pointer mt-2",
              (isLoading || isSuccess) && "opacity-80 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-mono">Sending link...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-mono">Sent</span>
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Sign in</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
