"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { MOCK_CREDENTIALS, loginMockUser } from "@/features/auth/mock-auth";
import type { AuthFormState } from "@/features/auth/types";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(true);
  const [state, setState] = React.useState<AuthFormState>({ status: "idle" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [demoFilled, setDemoFilled] = React.useState(false);

  function handleAutoFillDemo() {
    setEmail(MOCK_CREDENTIALS.email);
    setPassword(MOCK_CREDENTIALS.password);
    setErrors({});
    setState({ status: "idle" });
    setDemoFilled(true);
    setTimeout(() => setDemoFilled(false), 1500);
  }

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};

    if (!email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Invalid email format";
    }

    if (!password) {
      nextErrors.password = "Password is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validate()) return;

    setState({ status: "loading" });

    await new Promise((resolve) => setTimeout(resolve, 600));

    const result = loginMockUser({ email, password });

    if (!result.success) {
      setState({
        status: "error",
        message: result.message || "Invalid email or password",
      });
      return;
    }

    setState({
      status: "success",
      message: "Access granted. Initializing workspace...",
    });

    router.push("/");
    router.refresh();
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
            Sign in to StockOS
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Enter your workspace credentials to access inventory.
          </p>
        </div>

        {/* Demo Fast Fill Banner */}
        <div className="mb-5 rounded-md border border-black bg-[#ede9fe] p-3 text-foreground shadow-neo-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#543afd] text-white">
                <Sparkles className="h-3 w-3" />
              </span>
              <span className="font-mono text-xs font-bold text-[#543afd]">
                Demo Sandbox
              </span>
            </div>
            <button
              type="button"
              onClick={handleAutoFillDemo}
              className={cn(
                "rounded-sm border border-black px-2 py-1 font-mono text-[11px] font-bold transition-all cursor-pointer",
                demoFilled
                  ? "bg-[#dcfce7] text-[#15803d]"
                  : "bg-white text-foreground hover:bg-slate-100 active:translate-y-px"
              )}
            >
              {demoFilled ? (
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3" /> Filled
                </span>
              ) : (
                "Auto Fill Demo"
              )}
            </button>
          </div>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            demo@stockos.com / demo123
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
          {/* Email Field */}
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
              name="email"
              type="email"
              autoComplete="email"
              disabled={isLoading || isSuccess}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: "" }));
                }
              }}
              placeholder="demo@stockos.com"
              className={cn(
                "w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground transition-all outline-none placeholder:text-muted-foreground focus:border-black focus:shadow-[2px_2px_0px_#543afd]",
                errors.email && "border-destructive shadow-[2px_2px_0px_#ef4444]"
              )}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="font-heading text-xs font-semibold text-foreground"
              >
                Password
              </label>
              <Link
                href="/reset"
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                disabled={isLoading || isSuccess}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: "" }));
                  }
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
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="font-mono text-[11px] text-destructive">
                {errors.password}
              </p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-muted-foreground select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded-xs border border-black text-primary focus:ring-primary"
              />
              <span>Remember this browser</span>
            </label>
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
                <span className="font-mono">Verifying...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-mono">Success</span>
              </>
            ) : (
              <>
                <span>Sign in to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
          >
            Create account
          </Link>
        </div>

      </div>
    </div>
  );
}
