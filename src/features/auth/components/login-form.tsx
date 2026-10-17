"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn } from "@/features/auth/actions";
import { useI18n } from "@/lib/i18n/context";

function AuthLinkHint() {
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const auth = searchParams.get("auth");
  const hint = auth === "invalid-recovery" ? t.auth.invalidRecovery : auth === "invalid-invitation" ? t.auth.invitationExpired : null;
  return hint ? <p role="alert" className="border-[3px] border-ink p-3 text-sm text-destructive">{hint}</p> : null;
}

export function LoginForm() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage("");
    try {
      const result = await signIn({ email, password });
      if (!result.ok) {
        setMessage(t.auth.errors[result.code] ?? t.auth.errors.INTERNAL_ERROR);
        return;
      }
      setPassword("");
      router.replace("/");
      router.refresh();
    } catch {
      setMessage(t.auth.errors.INTERNAL_ERROR);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full border-[3px] border-ink bg-card text-card-foreground shadow-hard-lg">
      <div className="space-y-4 p-4 sm:p-6">
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{t.auth.loginTitle}</h1>
          <p className="text-sm leading-relaxed">{t.auth.loginSubtitle}</p>
        </div>
        <React.Suspense fallback={null}><AuthLinkHint /></React.Suspense>
        {message && <p role="alert" className="border-[3px] border-ink p-3 text-sm text-destructive">{message}</p>}
        <form onSubmit={handleSubmit} aria-busy={pending} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-semibold">{t.auth.emailLabel}</label>
            <input id="email" name="email" type="email" autoComplete="email" required maxLength={254}
              value={email} onChange={(e) => setEmail(e.target.value)} disabled={pending}
              className="min-h-11 w-full border-[3px] border-ink bg-card px-3 py-2 text-base outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60 sm:text-sm" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-semibold">{t.auth.passwordLabel}</label>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required maxLength={128}
                value={password} onChange={(e) => setPassword(e.target.value)} disabled={pending}
                className="min-h-11 w-full border-[3px] border-ink bg-card px-3 py-2 pr-14 text-base outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60 sm:text-sm" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={pending}
                aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword} aria-pressed={showPassword}
                className="absolute inset-y-[3px] right-[3px] flex w-11 items-center justify-center outline-offset-[-4px] hover:bg-background focus-visible:outline-2 focus-visible:outline-primary">
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={pending}
            className="flex min-h-12 w-full items-center justify-center gap-3 border-[3px] border-ink bg-primary px-4 py-2 font-bold text-primary-foreground shadow-hard outline-offset-4 hover:bg-[var(--primary-hover)] focus-visible:outline-2 focus-visible:outline-primary active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-60">
            {pending ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{t.common.loading}</> : <>{t.auth.signInButton}<ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
          </button>
        </form>
        <div className="flex flex-wrap items-center justify-between gap-x-4">
          <Link href="/reset" className="inline-flex min-h-11 items-center text-sm font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary">{t.auth.forgotPassword}</Link>
          <Link href="/signup" className="inline-flex min-h-11 items-center text-sm font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary">{t.auth.setupTitle}</Link>
        </div>
      </div>
      <div aria-hidden="true" className="border-t-[3px] border-ink bg-primary px-6 py-3 font-mono text-xs font-bold text-primary-foreground">/ LOGIN</div>
    </div>
  );
}
