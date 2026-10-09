"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export default function ResetPage() {
  const { t } = useI18n();

  return (
    <div className="w-full max-w-[450px] mx-auto">
      <div className="relative border-[3px] border-black bg-white p-7 sm:p-8 shadow-[8px_8px_0_#000] rounded-none">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{t.auth.recoveryUnavailableTitle}</h1>
        <div className="mt-5 flex items-start gap-2.5 border-[3px] border-black bg-white p-3 shadow-[4px_4px_0_#000] rounded-none">
          <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-muted-foreground">{t.auth.recoveryUnavailableDescription}</p>
        </div>
        <div className="mt-6 text-center text-xs">
          <Link href="/login" className="font-semibold text-foreground underline underline-offset-4 hover:text-primary focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-primary">{t.auth.signInButton}</Link>
        </div>
      </div>
    </div>
  );
}
