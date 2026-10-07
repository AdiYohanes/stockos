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
      <div className="relative border-[3px] border-black bg-white p-7 sm:p-8 shadow-[8px_8px_0_#000] rounded-none">
        
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
            className="mb-5 flex items-start gap-2.5 border-[3px] border-black bg-[#ff1744] p-3 text-xs font-semibold text-white shadow-[4px_4px_0_#000] rounded-none"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-mono">{state.message}</div>
          </div>
        )}

        {state.status === "success" && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 border-[3px] border-black bg-[#00e676] p-3 text-xs font-semibold text-black shadow-[4px_4px_0_#000] rounded-none"
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
                "w-full rounded-none border-[3px] border-black bg-white px-3 py-2 text-sm text-foreground transition-all outline-none placeholder:text-muted-foreground focus:bg-[#fffef2] focus:shadow-[8px_8px_0_#543AFD,8px_8px_0_3px_#000]",
                errors.email && "border-[#ff1744] focus:shadow-[8px_8px_0_#ff1744,8px_8px_0_3px_#ff1744]"
              )}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isSuccess}
            className={cn(
              "w-full flex items-center justify-center gap-2 border-[3px] border-black bg-[#543AFD] text-white px-4 py-2.5 text-sm font-black uppercase tracking-wider shadow-[8px_8px_0_#000] transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_#000] hover:bg-[#402AD4] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none cursor-pointer mt-2 rounded-none",
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
