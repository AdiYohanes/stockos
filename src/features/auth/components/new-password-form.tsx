"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { completeOwnerPassword } from "@/features/auth/actions";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export function NewPasswordForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const requestInFlight = React.useRef(false);
  const [completed, setCompleted] = React.useState(false);
  const [errorCode, setErrorCode] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<{ password?: string; confirmPassword?: string }>({});

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestInFlight.current || completed || errorCode === "UNAUTHENTICATED") return;
    const nextErrors: typeof errors = {};
    if (password.length < 12 || password.length > 128) nextErrors.password = t.auth.passwordBounds;
    if (confirmPassword.length < 12 || confirmPassword.length > 128) nextErrors.confirmPassword = t.auth.passwordBounds;
    else if (confirmPassword !== password) nextErrors.confirmPassword = t.auth.passwordMismatch;
    setErrors(nextErrors);
    if (nextErrors.password || nextErrors.confirmPassword) {
      event.currentTarget.querySelector<HTMLInputElement>(nextErrors.password ? "#password" : "#confirmPassword")?.focus();
      return;
    }
    requestInFlight.current = true;
    setPending(true);
    setErrorCode(null);
    let destination: string | null = null;
    try {
      const result = await completeOwnerPassword({ password, confirmPassword });
      if (result.ok) {
        setCompleted(true);
        setPassword("");
        setConfirmPassword("");
        destination = "/login";
      } else {
        setErrorCode(result.code);
      }
    } catch {
      setErrorCode("network");
    } finally {
      requestInFlight.current = false;
      setPending(false);
    }
    if (destination) {
      router.replace(destination);
      router.refresh();
    }
  }

  const disabled = pending || completed || errorCode === "UNAUTHENTICATED";
  const fields = [
    { id: "password", label: t.auth.passwordLabel, value: password, setValue: setPassword, visible: showPassword, setVisible: setShowPassword },
    { id: "confirmPassword", label: t.auth.confirmPasswordLabel, value: confirmPassword, setValue: setConfirmPassword, visible: showConfirmPassword, setVisible: setShowConfirmPassword },
  ] as const;

  return (
    <div className="w-full max-w-[450px] mx-auto">
      <div className="relative border-[3px] border-black bg-white p-7 sm:p-8 shadow-[8px_8px_0_#000] rounded-none">
        <div className="mb-6 space-y-1">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{t.auth.newPasswordTitle}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{t.auth.newPasswordSubtitle}</p>
        </div>
        {errorCode && (
          <div role="alert" className="mb-5 flex items-start gap-2.5 border-[3px] border-black bg-[#ff1744] p-3 text-xs font-semibold text-black shadow-[4px_4px_0_#000] rounded-none">
            <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="flex-1 font-mono break-words">{errorCode === "network" ? t.auth.networkError : t.auth.errors[errorCode] ?? t.auth.errors.INTERNAL_ERROR}</p>
          </div>
        )}
        {completed && (
          <div role="status" className="mb-5 flex items-start gap-2.5 border-[3px] border-black bg-[#00e676] p-3 text-xs font-semibold text-black shadow-[4px_4px_0_#000] rounded-none">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="flex-1 font-mono">{t.auth.passwordCompleted}</p>
          </div>
        )}
        <form onSubmit={submit} noValidate aria-busy={pending} className="space-y-4">
          {fields.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <label htmlFor={field.id} className="font-heading text-xs font-semibold text-foreground">{field.label}</label>
              <div className="relative">
                <input
                  id={field.id}
                  name={field.id}
                  type={field.visible ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                  disabled={disabled}
                  value={field.value}
                  aria-invalid={!!errors[field.id]}
                  aria-describedby={errors[field.id] ? `${field.id}-error` : "password-help"}
                  onChange={(event) => {
                    field.setValue(event.target.value);
                    setErrors((current) => ({ ...current, [field.id]: undefined }));
                  }}
                  className={cn(
                    "w-full rounded-none border-[3px] border-black bg-white px-3 py-2 pr-12 text-sm text-foreground transition-all outline-none focus:bg-[#fffef2] focus:shadow-[8px_8px_0_#543AFD,8px_8px_0_3px_#000]",
                    errors[field.id] && "border-[#ff1744]",
                  )}
                />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => field.setVisible((visible) => !visible)}
                  aria-label={`${field.visible ? t.auth.hidePassword : t.auth.showPassword}: ${field.label}`}
                  aria-pressed={field.visible}
                  aria-controls={field.id}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer focus-visible:outline-[3px] focus-visible:outline-primary disabled:cursor-not-allowed"
                >
                  {field.visible ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
                </button>
              </div>
              {errors[field.id] && <p id={`${field.id}-error`} className="font-mono text-[11px] text-destructive">{errors[field.id]}</p>}
            </div>
          ))}
          <p id="password-help" className="text-xs text-muted-foreground">{t.auth.passwordBounds}</p>
          <button type="submit" disabled={disabled} className="w-full flex items-center justify-center gap-2 rounded-none border-[3px] border-black bg-[#543AFD] text-white px-4 py-2.5 text-sm font-black uppercase tracking-wider shadow-[8px_8px_0_#000] transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_#000] hover:bg-[#402AD4] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-primary disabled:opacity-80 disabled:cursor-not-allowed">
            {pending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <ArrowRight aria-hidden="true" className="h-4 w-4" />}
            <span>{pending ? t.auth.requestPending : t.auth.completePasswordButton}</span>
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/login" className="font-semibold text-foreground underline underline-offset-4 hover:text-primary focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-primary">{t.auth.signInButton}</Link>
        </div>
      </div>
    </div>
  );
}
