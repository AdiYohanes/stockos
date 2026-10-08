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
  Warehouse,
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
  const isDisabled = isLoading || isSuccess;

  return (
    <div className="w-full border-[3px] border-border bg-card text-card-foreground shadow-hard-lg selection:bg-primary selection:text-primary-foreground">
      {/* Card Header */}
      <div className="space-y-4 p-4 sm:p-6 [@media(max-height:700px)]:space-y-2 [@media(max-height:700px)]:p-2.5">
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            Sign in to StockOS
          </h1>
          <p className="text-sm leading-relaxed [@media(max-height:700px)]:hidden">
            Enter your workspace credentials to access inventory.
          </p>
        </div>

        {/* Demo Fast Fill Banner */}
        <div className="border-[3px] border-border bg-background p-2.5 sm:p-3 [@media(max-height:700px)]:border-0 [@media(max-height:700px)]:bg-transparent [@media(max-height:700px)]:p-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 [@media(max-height:700px)]:hidden">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-border bg-primary text-primary-foreground">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="text-sm font-bold">Demo Sandbox</span>
            </div>
            <button
              type="button"
              onClick={handleAutoFillDemo}
              disabled={isDisabled}
              className={cn(
                "min-h-11 border-2 border-border px-3 text-xs font-bold [@media(max-height:700px)]:w-full outline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60",
                demoFilled
                  ? "bg-[#dcfce7] text-[#166534]"
                  : "bg-card text-card-foreground hover:bg-background"
              )}
            >
              {demoFilled ? (
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" /> Filled
                </span>
              ) : (
                "Auto Fill Demo"
              )}
            </button>
          </div>
          <p className="mt-2 break-words font-mono text-xs leading-relaxed [@media(max-height:700px)]:hidden">
            {MOCK_CREDENTIALS.email} / {MOCK_CREDENTIALS.password}
          </p>
        </div>

        {/* Status Alerts */}
        {state.status === "error" && (
          <div role="alert" className="flex items-start gap-3 border-[3px] border-black bg-[#fff1f2] p-4 text-sm font-medium text-[#9f1239]">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>{state.message}</p>
          </div>
        )}
        {state.status === "success" && (
          <div role="status" className="flex items-start gap-3 border-[3px] border-black bg-[#dcfce7] p-4 text-sm font-medium text-[#166534]">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>{state.message}</p>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} noValidate aria-busy={isLoading} className="space-y-3 [@media(max-height:700px)]:space-y-2">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-semibold">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              disabled={isDisabled}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: "" }));
                }
              }}
              placeholder="demo@stockos.com"
              className={cn(
                "min-h-11 w-full border-[3px] border-border bg-card px-3 py-2 text-base text-card-foreground caret-primary outline-offset-2 placeholder:text-card-foreground/70 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60 sm:text-sm",
                errors.email && "border-[#be123c]"
              )}
            />
            {errors.email && (
              <p id="email-error" role="alert" className="text-xs font-medium text-[#9f1239] dark:text-[#fda4af]">{errors.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <label htmlFor="password" className="text-sm font-semibold">Password</label>
              <Link href="/reset" className="inline-flex min-h-8 items-center text-xs underline underline-offset-4 outline-offset-2 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-primary">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                disabled={isDisabled}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-error" : undefined}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: "" }));
                  }
                }}
                placeholder="••••••••"
                className={cn(
                  "min-h-11 w-full border-[3px] border-border bg-card px-3 py-2 pr-14 text-base text-card-foreground caret-primary outline-offset-2 placeholder:text-card-foreground/70 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60 sm:text-sm",
                  errors.password && "border-[#be123c]"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isDisabled}
                className="absolute inset-y-[3px] right-[3px] flex w-11 items-center justify-center outline-offset-[-4px] hover:bg-background focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" role="alert" className="text-xs font-medium text-[#9f1239] dark:text-[#fda4af]">{errors.password}</p>
            )}
          </div>

          {/* Remember Me */}
          <label className="flex min-h-11 w-fit cursor-pointer select-none items-center gap-3 text-sm">
            <span className="relative h-6 w-6 shrink-0">
              <input
                type="checkbox"
                className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                checked={rememberMe}
                disabled={isDisabled}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className={cn(
                "flex h-6 w-6 items-center justify-center border-2 border-border shadow-hard-sm outline-offset-4 peer-focus-visible:outline-2 peer-focus-visible:outline-primary peer-disabled:opacity-60",
                rememberMe ? "bg-primary text-primary-foreground" : "bg-card"
              )}>
                {rememberMe && <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />}
              </span>
            </span>
            Keep me signed in
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isDisabled}
            className="flex min-h-12 w-full items-center justify-center gap-3 border-[3px] border-border bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-hard outline-offset-4 transition-[transform,box-shadow,background-color] hover:bg-[var(--primary-hover)] focus-visible:outline-2 focus-visible:outline-primary active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-70 disabled:active:translate-x-0 disabled:active:translate-y-0 sm:text-base"
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /><span>Verifying...</span></>
            ) : isSuccess ? (
              <><CheckCircle2 className="h-4 w-4" aria-hidden="true" /><span>Success</span></>
            ) : (
              <><span>Sign in to Dashboard</span><ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="space-y-3 [@media(max-height:700px)]:space-y-2">
          <div className="flex items-center gap-4 [@media(max-height:700px)]:hidden">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {["Google", "GitHub"].map((provider) => (
              <button key={provider} type="button" disabled={isDisabled} className="min-h-11 border-2 border-border bg-card px-3 py-2 text-sm font-bold shadow-hard-sm outline-offset-4 hover:bg-background focus-visible:outline-2 focus-visible:outline-primary active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60">
                {provider}
              </button>
            ))}
          </div>
          <p className="text-center text-sm leading-relaxed">
            No account yet?{" "}<Link href="/signup" className="inline-flex min-h-8 items-center font-bold underline underline-offset-4 outline-offset-2 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-primary">Create one</Link>
          </p>
        </div>
      </div>

      {/* Brutalist Graphical Footer */}
      <div className="grid grid-cols-[1fr_auto_auto] border-t-[3px] border-border [@media(max-height:700px)]:hidden">
        <div className="flex items-center justify-start border-r-[3px] border-border bg-primary px-4 py-3 text-primary-foreground sm:px-6">
          <div aria-hidden="true" className="flex items-center gap-4">
            <Warehouse className="h-6 w-6" strokeWidth={2.5} />
            <div className="flex items-center gap-1.5">
              <span className="block h-4 w-4 border-2 border-current bg-[#00e676] shadow-[2px_2px_0_0_#000]" />
              <span className="block h-4 w-4 rounded-full border-2 border-current bg-[#ff9100] shadow-[2px_2px_0_0_#000]" />
              <span className="block h-4 w-4 rotate-45 border-2 border-current bg-white shadow-[2px_2px_0_0_#000]" />
            </div>
          </div>
        </div>
        <div className="flex items-center border-r-[3px] border-border bg-[#ff1744] px-4 font-mono text-sm font-black tracking-widest text-white">
          SECURE
        </div>
        <div className="flex items-center bg-black px-4 py-3 font-mono text-xs font-bold tracking-widest text-white">
          / LOGIN
        </div>
      </div>
    </div>
  );
}
