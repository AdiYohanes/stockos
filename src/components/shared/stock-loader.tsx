"use client";

import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

interface StockLoaderProps {
  label?: string;
  className?: string;
}

export function StockLoader({ label, className }: StockLoaderProps) {
  const { t } = useI18n();

  return (
    <div
      role="status"
      className={cn(
        "stock-loader w-full max-w-sm border-[3px] border-border bg-card p-5 text-card-foreground shadow-hard sm:p-7",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b-[3px] border-border pb-3">
        <span className="font-heading text-2xl font-black tracking-tight">
          Stock<span className="text-primary">OS</span>
        </span>
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="h-2.5 w-2.5 bg-primary" />
          <span className="h-2.5 w-2.5 bg-primary" />
          <span className="h-2.5 w-2.5 bg-primary" />
        </span>
      </div>

      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 320 196"
        className="my-5 block w-full overflow-hidden"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="miter"
      >
        <g opacity="0.25">
          <path d="M24 122V16h272v106M24 62h272M24 114h272M160 16v98" />
          {[[38, 30], [91, 30], [178, 30], [242, 30], [49, 82], [111, 82], [187, 82], [240, 82]].map(([x, y]) => (
            <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
              <rect width="28" height="32" className="stock-loader-surface" />
              <path d="M14 0v11M7 25h10" />
            </g>
          ))}
        </g>

        {[0, 1, 2].map((box) => (
          <g key={box} className="stock-loader-box">
            <rect y="119" width="52" height="44" className="stock-loader-parcel" />
            <path d="M20 119h12v16H20z" className="stock-loader-tape" />
            <path d="M9 151h12M9 144h5" />
          </g>
        ))}

        <rect x="9" y="164" width="302" height="19" className="stock-loader-surface" />
        {[23, 61, 99, 137, 175, 213, 251, 289].map((x) => (
          <path key={x} d={`M${x} 170h8v7h-8z`} className="stock-loader-parcel" />
        ))}
        <path d="M30 184v9M290 184v9M16 194h288" />
      </svg>

      <p className="border-t-[3px] border-border pt-4 text-center font-mono text-sm font-bold uppercase tracking-wider break-words">
        {label ?? t.common.loading}
      </p>
    </div>
  );
}
