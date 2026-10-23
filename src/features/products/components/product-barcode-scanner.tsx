"use client";

import * as React from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogRoot, DialogPortal, DialogBackdrop, DialogPopup, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n/context";
import { barcodeCandidate, loadBarcodeReader, readBarcodePhoto } from "../barcode-scanner";

type StopRef = React.MutableRefObject<() => void>;

function CameraSession({ stopRef, onApply, onClose, blocked }: { stopRef: StopRef; onApply: (value: string) => void; onClose: () => void; blocked: boolean }) {
  const { t } = useI18n();
  const c = t.products.scanner;
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [candidate, setCandidate] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<keyof typeof c>("starting");
  const [error, setError] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);
  const [readingPhoto, setReadingPhoto] = React.useState(false);
  const photoRef = React.useRef<HTMLInputElement>(null);
  const photoRequest = React.useRef(0);
  React.useEffect(() => () => { photoRequest.current += 1; }, []);

  async function selectPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || blocked || readingPhoto) return;
    stopRef.current();
    const request = ++photoRequest.current;
    setCandidate(null);
    setError(false);
    setReadingPhoto(true);
    setMessage("readingPhoto");
    try {
      const read = await loadBarcodeReader();
      if (request !== photoRequest.current) return;
      const value = await readBarcodePhoto(file, read);
      if (request !== photoRequest.current) return;
      setCandidate(value);
      setMessage(value === null ? "notDetected" : "result");
      setError(value === null);
    } catch {
      if (request === photoRequest.current) { setMessage("invalidPhoto"); setError(true); }
    } finally {
      if (request === photoRequest.current) setReadingPhoto(false);
    }
  }

  React.useEffect(() => {
    let disposed = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const video = videoRef.current;
    function stop() {
      disposed = true;
      clearTimeout(timer);
      stream?.getTracks().forEach(track => track.stop());
      if (video) video.srcObject = null;
    }
    stopRef.current = stop;
    function fail(key: keyof typeof c) {
      if (disposed) return;
      stop();
      setMessage(key);
      setError(true);
    }
    function background() {
      if (document.hidden) fail("stopped");
    }
    function pagehide() { fail("stopped"); }
    document.addEventListener("visibilitychange", background);
    window.addEventListener("pagehide", pagehide);
    async function start() {
      if (!window.isSecureContext) { fail("insecure"); return; }
      if (!navigator.mediaDevices?.getUserMedia) { fail("unsupported"); return; }
      let read: Awaited<ReturnType<typeof loadBarcodeReader>>;
      try { read = await loadBarcodeReader(); }
      catch { fail("loadFailed"); return; }
      if (disposed) return;
      try {
        const acquired = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" } } });
        if (disposed) { acquired.getTracks().forEach(track => track.stop()); return; }
        stream = acquired;
        if (!video) { fail("cameraFailed"); return; }
        video.srcObject = acquired;
        acquired.getVideoTracks().forEach(track => track.addEventListener("ended", () => fail("cameraFailed"), { once: true }));
        await video.play();
        if (disposed) return;
        setMessage("aim");
      } catch (cause) {
        const name = cause instanceof DOMException ? cause.name : "";
        fail(name === "NotAllowedError" || name === "SecurityError" ? "denied" : name === "NotFoundError" || name === "OverconstrainedError" ? "notFound" : name === "NotReadableError" || name === "AbortError" ? "busy" : "cameraFailed");
        return;
      }
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context || !video) { fail("cameraFailed"); return; }
      async function decode() {
        if (disposed || !video) return;
        try {
          if (video.readyState >= 2 && video.videoWidth && video.videoHeight) {
            const scale = Math.min(1, 960 / Math.max(video.videoWidth, video.videoHeight));
            canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
            canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
            context!.drawImage(video, 0, 0, canvas.width, canvas.height);
            const results = await read(context!.getImageData(0, 0, canvas.width, canvas.height));
            if (disposed) return;
            if (results.length) {
              const value = barcodeCandidate(results[0]);
              if (value === null) { fail("invalid"); return; }
              stop();
              setCandidate(value);
              setMessage("result");
              return;
            }
          }
          if (!disposed) timer = setTimeout(decode, 250);
        } catch { fail("cameraFailed"); }
      }
      void decode();
    }
    void start();
    return () => {
      stop();
      document.removeEventListener("visibilitychange", background);
      window.removeEventListener("pagehide", pagehide);
    };
  }, [attempt, stopRef]);

  function restart() {
    if (blocked || readingPhoto) return;
    stopRef.current();
    setCandidate(null);
    setError(false);
    setMessage("starting");
    setAttempt(value => value + 1);
  }

  return <>
    <div className="space-y-3 p-5 min-w-0">
      <video ref={videoRef} muted playsInline aria-label={c.title} className={candidate || error || readingPhoto ? "hidden" : "aspect-[4/3] w-full border-[3px] border-ink bg-black object-contain"} />
      <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" aria-label={c.fromPhoto} disabled={blocked || readingPhoto} onChange={selectPhoto} className="hidden" />
      <Button type="button" variant="outline" className="w-full" disabled={blocked || readingPhoto} onClick={() => { stopRef.current(); setCandidate(null); setMessage("stopped"); setError(true); photoRef.current?.click(); }}>{c.fromPhoto}</Button>
      <p role={error ? "alert" : "status"} aria-live="polite" className="text-sm">{c[message]}</p>
      {candidate !== null && <p className="break-all border-[3px] border-ink bg-purple-50 p-3 font-mono text-ink">{candidate}</p>}
    </div>
    <DialogFooter className="flex-wrap border-t-[3px] border-ink">
      <Button type="button" variant="outline" onClick={onClose}>{c.cancel}</Button>
      {(candidate !== null || error) && <Button type="button" variant="outline" disabled={blocked || readingPhoto} onClick={restart}>{candidate !== null ? c.rescan : c.retry}</Button>}
      {candidate !== null && <Button type="button" disabled={blocked} onClick={() => { if (!blocked) onApply(candidate); }}>{c.use}</Button>}
    </DialogFooter>
  </>;
}

export function ProductBarcodeScanner({ active, blocked, onApply, inputRef }: { active: boolean; blocked: boolean; onApply: (value: string) => void; inputRef: React.RefObject<HTMLInputElement | null> }) {
  const { t } = useI18n();
  const c = t.products.scanner;
  const [open, setOpen] = React.useState(false);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const applied = React.useRef(false);
  const stopRef = React.useRef<() => void>(() => {});
  const visible = open && active && !blocked;
  function close() { stopRef.current(); setOpen(false); }
  return <>
    <Button ref={trigger} type="button" variant="outline" disabled={blocked || !active} className="w-full" onClick={() => { if (!blocked && active) { applied.current = false; setOpen(true); } }}><Camera className="h-4 w-4" />{c.scan}</Button>
    <DialogRoot open={visible} onOpenChange={next => { if (!next) close(); }}>
      <DialogPortal><DialogBackdrop /><DialogPopup finalFocus={() => applied.current ? inputRef.current : trigger.current} className="max-w-lg max-h-[90dvh] overflow-y-auto rounded-none border-[3px] border-ink bg-white shadow-hard-lg">
        <div className="border-b-[3px] border-ink p-5"><DialogTitle className="text-lg font-bold uppercase">{c.title}</DialogTitle><DialogDescription className="mt-2 text-xs">{c.description}</DialogDescription></div>
        {visible && <CameraSession stopRef={stopRef} blocked={blocked} onClose={close} onApply={value => { if (blocked || !active) return; applied.current = true; onApply(value); close(); }} />}
      </DialogPopup></DialogPortal>
    </DialogRoot>
  </>;
}
