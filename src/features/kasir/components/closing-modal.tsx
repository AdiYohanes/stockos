"use client";

import * as React from "react";
import {
  DialogRoot,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2, DollarSign, Loader2 } from "lucide-react";
import type { TallyItem, TallyTotals, CloseDailyRegisterResult } from "../types";
import { calculateCashDiscrepancy } from "../tally";
import { closeDailyRegisterAction, type CloseDailyRegisterServerInput } from "../actions";

interface ClosingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tally: TallyItem[];
  totals: TallyTotals;
  onSuccess: (summary: { totalUnits: number; expectedRevenue: number; reference: string }) => void;
  onCloseRegister?: (input: CloseDailyRegisterServerInput) => Promise<CloseDailyRegisterResult>;
}

export function ClosingModal({
  open,
  onOpenChange,
  tally,
  totals,
  onSuccess,
  onCloseRegister,
}: ClosingModalProps) {
  const [actualCashStr, setActualCashStr] = React.useState("");
  const [note, setNote] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Parse actual cash
  const actualCash = React.useMemo(() => {
    if (!actualCashStr.trim()) return null;
    const clean = actualCashStr.replace(/[^0-9]/g, "");
    if (!clean) return null;
    const parsed = parseInt(clean, 10);
    return isNaN(parsed) ? null : parsed;
  }, [actualCashStr]);

  const discrepancy = React.useMemo(() => {
    return calculateCashDiscrepancy(totals.expectedRevenue, actualCash);
  }, [totals.expectedRevenue, actualCash]);

  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    if (!raw) {
      setActualCashStr("");
    } else {
      const num = parseInt(raw, 10);
      setActualCashStr(new Intl.NumberFormat("id-ID").format(num));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const executeClose = onCloseRegister ?? closeDailyRegisterAction;
      const res = await executeClose({
        items: tally.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
        })),
        expectedRevenue: totals.expectedRevenue,
        actualCash,
        note: note.trim() || null,
      });

      if (!res.ok) {
        setErrorMessage(res.error || "Terjadi kesalahan saat memotong stok.");
        setIsSubmitting(false);
        return;
      }

      onSuccess({
        totalUnits: res.totalUnitsDeducted,
        expectedRevenue: res.expectedRevenue,
        reference: res.reference,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Gagal menutup sesi kasir.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="max-w-md border-[3px] border-border shadow-hard rounded-none">
          <DialogHeader className="bg-paper border-b-[3px] border-border">
            <div>
              <DialogTitle className="font-heading font-black text-base uppercase text-foreground">
                Tutup Kasir & Rekonsiliasi
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Konfirmasi penjualan hari ini dan potong stok sistem secara bersamaan.
              </DialogDescription>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <DialogBody className="space-y-4">
              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-destructive/10 border-[3px] border-destructive text-destructive flex items-start gap-2 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 gap-2 bg-muted/40 p-3 border-[3px] border-border font-mono">
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground block">
                    Jumlah Produk
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {tally.length} Produk
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground block">
                    Total Unit Fisik
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {totals.totalQuantity} pcs
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t-[3px] border-border">
                  <span className="text-[10px] uppercase text-muted-foreground block">
                    Ekspektasi Total Uang Masuk
                  </span>
                  <span className="text-lg font-black text-primary">
                    Rp{new Intl.NumberFormat("id-ID").format(totals.expectedRevenue)}
                  </span>
                </div>
              </div>

              {/* Physical Cash Input (Optional) */}
              <div className="space-y-1.5">
                <label className="block font-heading font-bold text-xs uppercase text-foreground">
                  Uang Tunai Fisik di Laci (Opsional)
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-muted-foreground">
                    Rp
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Masukkan jumlah uang fisik di laci..."
                    value={actualCashStr}
                    onChange={handleCashChange}
                    className="w-full h-11 pl-10 pr-3 border-[3px] border-border bg-background font-mono text-sm font-bold focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <span className="text-[11px] text-muted-foreground block">
                  Bantu pemilik mencocokkan uang di laci dengan hasil penjualan sistem.
                </span>
              </div>

              {/* Cash Discrepancy Status */}
              {discrepancy.status !== "unrecorded" && (
                <div
                  className={`p-2.5 border-[3px] font-mono text-xs flex items-center justify-between ${
                    discrepancy.status === "balanced"
                      ? "bg-emerald-500/10 border-border text-emerald-700 dark:text-emerald-400"
                      : discrepancy.status === "shortage"
                      ? "bg-destructive/10 border-destructive text-destructive"
                      : "bg-blue-500/10 border-border text-blue-700 dark:text-blue-400"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {discrepancy.status === "balanced" ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>UANG KAS COCOK</span>
                      </>
                    ) : discrepancy.status === "shortage" ? (
                      <>
                        <AlertCircle className="h-4 w-4" />
                        <span>KAS KURANG (TEKOR)</span>
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4" />
                        <span>KAS LEBIH</span>
                      </>
                    )}
                  </div>
                  <span className="font-black text-sm">
                    {discrepancy.discrepancy !== null && discrepancy.discrepancy !== 0
                      ? `Rp${new Intl.NumberFormat("id-ID").format(
                          Math.abs(discrepancy.discrepancy)
                        )}`
                      : "Rp0"}
                  </span>
                </div>
              )}

              {/* Note Input */}
              <div className="space-y-1">
                <label className="block font-heading font-bold text-xs uppercase text-foreground">
                  Catatan Audit (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Shift sore anak-anak ramai"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full h-10 px-3 border-[3px] border-border bg-background text-xs focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </DialogBody>

            <DialogFooter className="border-t-[3px] border-border bg-paper">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
                className="h-10 px-4 bg-muted text-foreground border-[3px] border-border font-mono text-xs font-bold uppercase hover:bg-muted/80 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || tally.length === 0}
                className="h-10 px-5 bg-primary text-primary-foreground border-[3px] border-border shadow-hard-sm font-heading font-black text-xs uppercase flex items-center gap-2 hover:bg-primary-hover active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Konfirmasi & Potong Stok</span>
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
