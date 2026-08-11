"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import type { AuthFormState } from "@/features/auth/types";
import { cn } from "@/lib/utils";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [agreeTerms, setAgreeTerms] = React.useState(true);

  const [state, setState] = React.useState<AuthFormState>({ status: "idle" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) {
      nextErrors.name = "Full name is required";
    }

    if (!email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Invalid email format";
    }

    if (!password) {
      nextErrors.password = "Password is required";
    } else if (password.length < 8) {
      nextErrors.password = "Minimum 8 characters required";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirmation is required";
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    if (!agreeTerms) {
      nextErrors.terms = "Terms agreement is required";
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
      message: "Account registered successfully. Redirecting to sign in...",
    });

    setTimeout(() => {
      router.push("/login");
    }, 1200);
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
            Create an Account
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Get started with your StockOS inventory management.
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
          {/* Full Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="name"
              className="font-heading text-xs font-semibold text-foreground flex items-center justify-between"
            >
              <span>Full Name</span>
              {errors.name && (
                <span className="font-mono text-[11px] text-destructive">
                  {errors.name}
                </span>
              )}
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              disabled={isLoading || isSuccess}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
              }}
              placeholder="Jane Doe"
              className={cn(
                "w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground transition-all outline-none placeholder:text-muted-foreground focus:border-black focus:shadow-[2px_2px_0px_#543afd]",
                errors.name && "border-destructive shadow-[2px_2px_0px_#ef4444]"
              )}
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="font-heading text-xs font-semibold text-foreground flex items-center justify-between"
            >
              <span>Work Email</span>
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
              placeholder="jane@company.com"
              className={cn(
                "w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground transition-all outline-none placeholder:text-muted-foreground focus:border-black focus:shadow-[2px_2px_0px_#543afd]",
                errors.email && "border-destructive shadow-[2px_2px_0px_#ef4444]"
              )}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="font-heading text-xs font-semibold text-foreground flex items-center justify-between"
            >
              <span>Password</span>
              {errors.password && (
                <span className="font-mono text-[11px] text-destructive">
                  {errors.password}
                </span>
              )}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                disabled={isLoading || isSuccess}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                }}
                placeholder="••••••••"
                className={cn(
                  "w-full rounded-md border border-input bg-white px-3 py-2 pr-10 text-sm text-foreground transition-all outline-none placeholder:text-muted-foreground focus:border-black focus:shadow-[2px_2px_0px_#543afd]",
                  errors.password && "border-destructive shadow-[2px_2px_0px_#ef4444]"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="font-heading text-xs font-semibold text-foreground flex items-center justify-between"
            >
              <span>Confirm Password</span>
              {errors.confirmPassword && (
                <span className="font-mono text-[11px] text-destructive">
                  {errors.confirmPassword}
                </span>
              )}
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                disabled={isLoading || isSuccess}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }}
                placeholder="••••••••"
                className={cn(
                  "w-full rounded-md border border-input bg-white px-3 py-2 pr-10 text-sm text-foreground transition-all outline-none placeholder:text-muted-foreground focus:border-black focus:shadow-[2px_2px_0px_#543afd]",
                  errors.confirmPassword && "border-destructive shadow-[2px_2px_0px_#ef4444]"
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="flex items-start gap-2 pt-1">
            <input
              id="agreeTerms"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                if (errors.terms) setErrors((prev) => ({ ...prev, terms: "" }));
              }}
              className="mt-0.5 h-4 w-4 rounded-xs border border-black text-primary focus:ring-primary"
            />
            <label htmlFor="agreeTerms" className="text-xs text-muted-foreground cursor-pointer leading-tight select-none">
              I agree to the{" "}
              <Link href="/terms" className="text-foreground underline hover:text-primary">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-foreground underline hover:text-primary">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.terms && (
            <p className="font-mono text-[11px] text-destructive">
              {errors.terms}
            </p>
          )}

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
                <span className="font-mono">Registering...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-mono">Created</span>
              </>
            ) : (
              <>
                <span>Create Free Account</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
          >
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
}
