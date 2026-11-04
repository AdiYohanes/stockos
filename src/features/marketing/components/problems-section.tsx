"use client";

import * as React from "react";
import { useI18n } from "@/lib/i18n/context";
import { marketingTranslations } from "../copy";
import { FileX2, Clock, AlertOctagon } from "lucide-react";

export function ProblemsSection() {
  const { language } = useI18n();
  const copy = marketingTranslations[language].problems;

  const items = [
    {
      title: copy.item1Title,
      desc: copy.item1Desc,
      icon: FileX2,
      accent: "bg-[#ff1744]/15 text-[#d50000]",
      border: "border-ink",
    },
    {
      title: copy.item2Title,
      desc: copy.item2Desc,
      icon: Clock,
      accent: "bg-[#ff9100]/15 text-[#c26200]",
      border: "border-ink",
    },
    {
      title: copy.item3Title,
      desc: copy.item3Desc,
      icon: AlertOctagon,
      accent: "bg-[#ff1744]/15 text-[#d50000]",
      border: "border-ink",
    },
  ];

  return (
    <section className="border-b-[3px] border-ink bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header (No eyebrow per craft floor ban) */}
        <div className="max-w-3xl mb-12">
          <h2 className="font-heading text-2xl font-black uppercase tracking-tight text-ink sm:text-3xl lg:text-4xl">
            {copy.title}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-ink/80 leading-relaxed font-sans">
            {copy.subtitle}
          </p>
        </div>

        {/* Varied Problem Panels (RHYTHM 3) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex flex-col justify-between border-[3px] border-ink bg-[#fcfbfa] p-6 shadow-hard transition-transform hover:-translate-y-1"
              >
                <div>
                  <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center border-[2px] border-ink ${item.accent}`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-ink uppercase tracking-tight mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-ink/80 leading-relaxed font-sans">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-ink/20 font-mono text-[11px] font-bold text-ink/60 uppercase tracking-widest">
                  TITIK BOCOR #{idx + 1}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
