"use client";

import * as React from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductPhoto as Photo } from "../schemas/product-rpc.schema";

export function ProductPhoto({ photo, display = false, preview, className }: { photo?: Photo | null; name?: string; display?: boolean; preview?: string; className?: string }) {
  const image = photo?.[display ? "display" : "thumb"];
  const src = preview ?? (image ? `/api/product-photos/${display ? "display" : "thumb"}/${image.hash}` : undefined);
  const [failed, setFailed] = React.useState<string | null>(null);
  return <span className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden border-[3px] border-ink bg-paper", display ? "h-64 w-full" : "h-12 w-12", className)}>
    {src && failed !== src ?
      // Private owner-checked route already serves fixed, compressed variants; no public image optimizer.
      // Decorative: adjacent text/heading always conveys the product name; a non-empty alt
      // would duplicate it inside buttons' accessible name.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" width={image?.width} height={image?.height} loading={display ? "eager" : "lazy"} decoding="async" className="h-full w-full object-contain" onError={() => setFailed(src)} /> :
      <span aria-hidden="true"><ImageOff className="h-5 w-5 opacity-50" /></span>}
  </span>;
}
