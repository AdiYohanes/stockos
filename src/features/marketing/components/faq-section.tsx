"use client";

import * as React from "react";
import { useI18n } from "@/lib/i18n/context";
import { marketingTranslations } from "../copy";
import { Plus, Minus } from "lucide-react";

export function FaqSection() {
  const { language } = useI18n();
  const copy = marketingTranslations[language].faq;
  const [openIdx, setOpenIdx] = React.useState<number | null>(0);

  const faqs = [
    { q: copy.q1, a: copy.a1 },
    { q: copy.q2, a: copy.a2 },
    { q: copy.q3, a: copy.a3 },
    { q: copy.q4, a: copy.a4 },
  ];

  return (
    <section id="faq" className="border-b-[3px] border-ink bg-paper px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Section Header (No eyebrow per craft floor ban) */}
        <div className="max-w-2xl mb-12">
          <h2 className="font-heading text-2xl font-black uppercase tracking-tight text-ink sm:text-3xl lg:text-4xl">
            {copy.title}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-ink/80 leading-relaxed font-sans">
            {copy.subtitle}
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            const contentId = `faq-content-${idx}`;
            const buttonId = `faq-btn-${idx}`;

            return (
              <div
                key={idx}
                className="border-[3px] border-ink bg-white shadow-hard"
              >
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-5 text-left font-heading text-base sm:text-lg font-bold text-ink uppercase tracking-tight cursor-pointer hover:bg-neutral-50 transition-colors"
                >
                  <span className="pr-4">{faq.q}</span>
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center border-[2px] border-ink bg-primary text-white"
                  >
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>

                {isOpen && (
                  <div
                    id={contentId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="border-t-[2px] border-ink/20 bg-[#fdfcfb] p-5 font-sans text-sm sm:text-base text-ink/85 leading-relaxed"
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
