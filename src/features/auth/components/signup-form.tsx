"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { registerOwner, resendOwnerConfirmation } from "@/features/auth/actions";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export function SignupForm() {
  const { t } = useI18n();
  const [draft, setDraft] = React.useState({
    setupCode: "", name: "", email: "", shopName: "", timezone: "Asia/Jakarta",
  });
  const [phase, setPhase] = React.useState<"setup" | "verification" | "closed">("setup");
  const [pending, setPending] = React.useState<"register" | "resend" | null>(null);
  const requestInFlight = React.useRef(false);
  const [notice, setNotice] = React.useState<{ success: boolean; code: string } | null>(null);
  const [errors, setErrors] = React.useState<Partial<Record<keyof typeof draft, string>>>({});

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestInFlight.current || phase === "closed") return;
    const resending = phase === "verification";
    const nextErrors: typeof errors = {};
    if (!draft.setupCode || draft.setupCode.length > 256) nextErrors.setupCode = t.auth.setupCodeInvalid;
    if (!draft.email.trim() || draft.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      nextErrors.email = t.auth.emailInvalid;
    }
    if (!resending) {
      if (!draft.name.trim() || draft.name.trim().length > 120) nextErrors.name = t.auth.nameInvalid;
      if (!draft.shopName.trim() || draft.shopName.trim().length > 120) nextErrors.shopName = t.auth.shopNameInvalid;
      if (!["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"].includes(draft.timezone)) nextErrors.timezone = t.auth.timezoneInvalid;
    }
    setErrors(nextErrors);
    const invalidField = Object.keys(nextErrors)[0];
    if (invalidField) {
      event.currentTarget.querySelector<HTMLInputElement | HTMLSelectElement>(`#${invalidField}`)?.focus();
      return;
    }
    requestInFlight.current = true;
    setPending(resending ? "resend" : "register");
    setNotice(null);
    try {
      const input = { email: draft.email.trim().toLowerCase(), setupCode: draft.setupCode };
      const result = resending
        ? await resendOwnerConfirmation(input)
        : await registerOwner({ ...draft, ...input, name: draft.name.trim(), shopName: draft.shopName.trim() });
      if (result.ok) {
        setPhase("verification");
        setDraft((current) => ({ ...current, setupCode: "" }));
        setNotice({ success: true, code: "verification" });
      } else {
        if (result.code === "SETUP_CLOSED") setPhase("closed");
        setNotice({ success: false, code: result.code });
      }
    } catch {
      setNotice({ success: false, code: "network" });
    } finally {
      requestInFlight.current = false;
      setPending(null);
    }
  }

  const disabled = pending !== null || phase === "closed";
  const fields = [
    { key: "setupCode", label: t.auth.setupCodeLabel, type: "password", autoComplete: "off", maxLength: 256 },
    { key: "name", label: t.auth.nameLabel, type: "text", autoComplete: "name", maxLength: 120 },
    { key: "email", label: t.auth.emailLabel, type: "email", autoComplete: "email", maxLength: 254 },
    { key: "shopName", label: t.settings.storeName, type: "text", autoComplete: "organization", maxLength: 120 },
  ] as const;

  return (
    <div className="w-full max-w-[450px] mx-auto">
      <div className="relative border-[3px] border-black bg-white p-7 sm:p-8 shadow-[8px_8px_0_#000] rounded-none">
        <div className="mb-6 space-y-1">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{t.auth.setupTitle}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{t.auth.setupSubtitle}</p>
        </div>
        {notice && (
          <div role={notice.success ? "status" : "alert"} className={cn(
            "mb-5 flex items-start gap-2.5 border-[3px] border-black p-3 text-xs font-semibold shadow-[4px_4px_0_#000] rounded-none",
            notice.success ? "bg-[#00e676] text-black" : "bg-[#ff1744] text-black",
          )}>
            {notice.success ? <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0 mt-0.5" />}
            <p className="flex-1 font-mono break-words">
              {notice.code === "verification" ? t.auth.verificationRequired : notice.code === "network" ? t.auth.networkError : t.auth.errors[notice.code] ?? t.auth.errors.INTERNAL_ERROR}
            </p>
          </div>
        )}
        {phase === "verification" && <p className="mb-5 text-xs text-muted-foreground">{t.auth.setupSecretCleared}</p>}
        {phase !== "closed" && (
          <form onSubmit={submit} noValidate aria-busy={pending !== null} className="space-y-4">
            {fields.filter((field) => phase !== "verification" || field.key === "setupCode" || field.key === "email").map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label htmlFor={field.key} className="font-heading text-xs font-semibold text-foreground">{field.label}</label>
                <input
                  id={field.key}
                  name={field.key}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  required
                  maxLength={field.maxLength}
                  disabled={disabled}
                  value={draft[field.key]}
                  aria-invalid={!!errors[field.key]}
                  aria-describedby={errors[field.key] ? `${field.key}-error` : undefined}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, [field.key]: event.target.value }));
                    setErrors((current) => ({ ...current, [field.key]: undefined }));
                  }}
                  className={cn(
                    "w-full rounded-none border-[3px] border-black bg-white px-3 py-2 text-sm text-foreground transition-all outline-none focus:bg-[#fffef2] focus:shadow-[8px_8px_0_#543AFD,8px_8px_0_3px_#000]",
                    errors[field.key] && "border-[#ff1744]",
                  )}
                />
                {errors[field.key] && <p id={`${field.key}-error`} className="font-mono text-[11px] text-destructive">{errors[field.key]}</p>}
              </div>
            ))}
            {phase === "setup" && (
              <div className="space-y-1.5">
                <label htmlFor="timezone" className="font-heading text-xs font-semibold text-foreground">{t.settings.timezone}</label>
                <select id="timezone" name="timezone" disabled={disabled} value={draft.timezone} aria-invalid={!!errors.timezone} aria-describedby={errors.timezone ? "timezone-error" : undefined} onChange={(event) => {
                  setDraft((current) => ({ ...current, timezone: event.target.value }));
                  setErrors((current) => ({ ...current, timezone: undefined }));
                }} className="w-full rounded-none border-[3px] border-black bg-white px-3 py-2 text-sm outline-none focus:shadow-[8px_8px_0_#543AFD,8px_8px_0_3px_#000]">
                  <option value="Asia/Jakarta">Asia/Jakarta (UTC+07:00)</option>
                  <option value="Asia/Makassar">Asia/Makassar (UTC+08:00)</option>
                  <option value="Asia/Jayapura">Asia/Jayapura (UTC+09:00)</option>
                </select>
                {errors.timezone && <p id="timezone-error" className="font-mono text-[11px] text-destructive">{errors.timezone}</p>}
              </div>
            )}
            <button type="submit" disabled={disabled} className="w-full flex items-center justify-center gap-2 rounded-none border-[3px] border-black bg-[#543AFD] text-white px-4 py-2.5 text-sm font-black uppercase tracking-wider shadow-[8px_8px_0_#000] transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_#000] hover:bg-[#402AD4] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-primary disabled:opacity-80 disabled:cursor-not-allowed">
              {pending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <ArrowRight aria-hidden="true" className="h-4 w-4" />}
              <span>{pending ? t.auth.requestPending : phase === "verification" ? t.auth.resendConfirmationButton : t.auth.setupButton}</span>
            </button>
          </form>
        )}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/login" className="font-semibold text-foreground underline underline-offset-4 hover:text-primary focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-primary">{t.auth.signInButton}</Link>
        </div>
      </div>
    </div>
  );
}
