"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { requestPasswordReset } from "@/features/auth/actions";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

const subscribe = () => () => {};

export function ResetForm() {
  const hydrated = React.useSyncExternalStore(subscribe, () => true, () => false);
  const { t } = useI18n();
  const [email, setEmail] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const requestInFlight = React.useRef(false);
  const [sent, setSent] = React.useState(false);
  const [errorCode, setErrorCode] = React.useState<string | null>(null);
  const [emailError, setEmailError] = React.useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestInFlight.current || sent) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError(t.auth.emailInvalid);
      event.currentTarget.querySelector<HTMLInputElement>("#email")?.focus();
      return;
    }
    setEmailError("");
    requestInFlight.current = true;
    setPending(true);
    setErrorCode(null);
    try {
      const result = await requestPasswordReset({ email: normalizedEmail });
      if (result.ok) setSent(true);
      else setErrorCode(result.code);
    } catch {
      setErrorCode("network");
    } finally {
      requestInFlight.current = false;
      setPending(false);
    }
  }

  const disabled = !hydrated || pending || sent;

  return (
    <div className="w-full max-w-[450px] mx-auto">
      <div className="relative border-[3px] border-black bg-white p-7 sm:p-8 shadow-[8px_8px_0_#000] rounded-none">
        <div className="mb-6 space-y-1">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{t.auth.resetRequestTitle}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{t.auth.resetRequestSubtitle}</p>
        </div>
        {errorCode && (
          <div role="alert" className="mb-5 flex items-start gap-2.5 border-[3px] border-black bg-[#ff1744] p-3 text-xs font-semibold text-black shadow-[4px_4px_0_#000] rounded-none">
            <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="flex-1 font-mono break-words">{errorCode === "network" ? t.auth.networkError : t.auth.errors[errorCode] ?? t.auth.errors.INTERNAL_ERROR}</p>
          </div>
        )}
        {sent && (
          <div role="status" className="mb-5 flex items-start gap-2.5 border-[3px] border-black bg-[#00e676] p-3 text-xs font-semibold text-black shadow-[4px_4px_0_#000] rounded-none">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="flex-1 font-mono break-words">{t.auth.resetRequestAcknowledgement}</p>
          </div>
        )}
        <form method="post" onSubmit={handleSubmit} noValidate aria-busy={pending} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="font-heading text-xs font-semibold text-foreground">{t.auth.emailLabel}</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              disabled={disabled}
              value={email}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "email-error" : undefined}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError("");
              }}
              className={cn(
                "w-full rounded-none border-[3px] border-black bg-white px-3 py-2 text-sm text-foreground transition-all outline-none focus:bg-[#fffef2] focus:shadow-[8px_8px_0_#543AFD,8px_8px_0_3px_#000]",
                emailError && "border-[#ff1744]",
              )}
            />
            {emailError && <p id="email-error" className="font-mono text-[11px] text-destructive">{emailError}</p>}
          </div>
          <button type="submit" disabled={disabled} className="w-full flex items-center justify-center gap-2 rounded-none border-[3px] border-black bg-[#543AFD] text-white px-4 py-2.5 text-sm font-black uppercase tracking-wider shadow-[8px_8px_0_#000] transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_#000] hover:bg-[#402AD4] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-primary disabled:opacity-80 disabled:cursor-not-allowed">
            {pending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : sent ? <CheckCircle2 aria-hidden="true" className="h-4 w-4" /> : <ArrowRight aria-hidden="true" className="h-4 w-4" />}
            <span>{pending ? t.auth.resetRequestPending : sent ? t.auth.resetRequestSent : t.auth.resetRequestButton}</span>
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/login" className="inline-flex items-center gap-1.5 font-semibold text-foreground underline underline-offset-4 hover:text-primary focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-primary">
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            <span>{t.auth.signInButton}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
