"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { processProductPhoto, type PhotoDraft, type PhotoError } from "../product-photo";
import type { ProductPhoto as Photo } from "../schemas/product-rpc.schema";
import { ProductPhoto } from "./product-photo";

export function usePhotoDraft() {
  const [draft, setDraft] = React.useState<PhotoDraft | null>(null);
  const [removed, setRemoved] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const files = React.useRef<FormData | undefined>(undefined);
  React.useEffect(() => () => { if (draft) URL.revokeObjectURL(draft.preview); }, [draft]);
  return {
    draft, removed, processing, setProcessing, files,
    change(value: PhotoDraft | null) { files.current = value?.files; setDraft(value); setRemoved(value === null); },
    reset() { files.current = undefined; setDraft(null); setRemoved(false); },
    patch: draft ? { photo: draft.photo } : removed ? { photo: null } : {},
  };
}

export function ProductPhotoField({ value, photo, disabled }: { value: ReturnType<typeof usePhotoDraft>; photo?: Photo | null; disabled: boolean }) {
  const { t } = useI18n();
  const c = t.products.photo;
  const id = React.useId();
  const cameraRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<PhotoError | null>(null);
  const alive = React.useRef(true);
  React.useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  async function select(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || value.processing) return;
    value.setProcessing(true);
    setError(null);
    try {
      const draft = await processProductPhoto(file);
      if (alive.current) value.change(draft); else URL.revokeObjectURL(draft.preview);
    } catch (failure) {
      if (alive.current) setError(failure instanceof Error && ["unsupported", "tooLarge", "insecure"].includes(failure.message) ? failure.message as PhotoError : "invalid");
    } finally {
      if (alive.current) value.setProcessing(false);
    }
  }
  const current = value.removed ? null : value.draft?.photo ?? photo;
  return <div className="col-span-full space-y-2 min-w-0">
    <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-widest">{c.label}</label>
    <div className="flex flex-wrap items-center gap-3">
      <ProductPhoto photo={current} preview={value.draft?.preview} name={c.label} className="h-20 w-20" />
      <div className="min-w-0 flex-1 space-y-2">
        <input id={id} type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled || value.processing} onChange={select} aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`} className="input-focus w-full min-w-0 text-sm file:mr-2 file:border-[3px] file:border-ink file:bg-paper file:px-2 file:py-1 file:font-bold" />
        <input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={disabled || value.processing} onChange={select} aria-label={c.takePhoto} className="hidden" />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={disabled || value.processing} onClick={() => cameraRef.current?.click()}>{c.takePhoto}</Button>
          {current && <Button type="button" variant="outline" disabled={disabled || value.processing} onClick={() => { value.change(null); setError(null); }}>{c.remove}</Button>}
        </div>
      </div>
    </div>
    <p id={`${id}-help`} className="text-xs text-ink/70">{c.help}</p>
    {value.processing && <p role="status" className="text-xs">{c.processing}</p>}
    {error && <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{c[error]}</p>}
  </div>;
}
