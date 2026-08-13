"use client";

import * as React from "react";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function IndonesiaFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-3.5 w-5 rounded-[2px] border border-black/90 overflow-hidden shrink-0 shadow-xs", className)}
    >
      <rect width="20" height="7" fill="#E11D48" />
      <rect y="7" width="20" height="7" fill="#FFFFFF" />
    </svg>
  );
}

function UKFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 30"
      className={cn("h-3.5 w-5 rounded-[2px] border border-black/90 overflow-hidden shrink-0 shadow-xs", className)}
    >
      <clipPath id="s">
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <clipPath id="t">
        <path d="M30,15 h30 v15 z m0,0 v-15 h-30 z m0,0 h-30 v15 z m0,0 v-15 h30 z" />
      </clipPath>
      <g clipPath="url(#s)">
        <path d="M0,0 h60 v30 h-60 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

export function LanguageToggle() {
  const { language, setLanguage } = useI18n();

  const toggleLanguage = () => {
    setLanguage(language === "id" ? "en" : "id");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="h-8 gap-2 border-[1.5px] border-black bg-white px-2.5 font-mono text-xs font-bold uppercase tracking-wider text-foreground shadow-neo-sm transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:bg-slate-100 hover:shadow-neo active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
      title={language === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
      aria-label="Toggle language"
    >
      {language === "id" ? <IndonesiaFlag /> : <UKFlag />}
      <span>{language === "id" ? "ID" : "EN"}</span>
    </Button>
  );
}
