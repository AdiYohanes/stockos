"use client";

import * as React from "react";
import { ReceiptText, RotateCcw, ArrowRight, AlertOctagon } from "lucide-react";
import type { TallyItem, TallyTotals } from "../types";
import { TallyLineItem } from "./tally-line-item";

interface TallySheetProps {
  tally: TallyItem[];
  totals: TallyTotals;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onSetQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onReset: () => void;
  onOpenClosing: () => void;
}

export function TallySheet({
  tally,
  totals,
  onIncrement,
  onDecrement,
  onSetQuantity,
  onRemove,
  onReset,
  onOpenClosing,
}: TallySheetProps) {
  const [confirmReset, setConfirmReset] = React.useState(false);
  const revenueFmt = new Intl.NumberFormat("id-ID").format(totals.expectedRevenue);

  return (
    <div className="flex flex-col h-full bg-card border-[3px] border-border shadow-hard">
      {/* Slip Header */}
      <div className="p-4 border-b-[3px] border-border bg-paper flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary text-primary-foreground border-[2px] border-border shadow-hard-sm">
            <ReceiptText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-heading font-black text-sm uppercase text-foreground leading-none">
              Nota Sementara
            </h3>
            <span className="font-mono text-[10px] text-muted-foreground uppercase">
              Tally Penjualan Hari Ini
            </span>
          </div>
        </div>

        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-muted border border-border">
          {totals.totalQuantity} Item
        </span>
      </div>

      {/* Slip Items List (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[calc(100vh-320px)] min-h-[220px]">
        {tally.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <ReceiptText className="h-8 w-8 mb-2 opacity-30" />
            <p className="font-heading font-bold text-xs uppercase text-foreground mb-1">
              Nota Masih Kosong
            </p>
            <p className="text-[11px] max-w-[200px]">
              Klik produk di katalog untuk mulai menghitung penjualan hari ini.
            </p>
          </div>
        ) : (
          tally.map((item) => (
            <TallyLineItem
              key={item.productId}
              item={item}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              onSetQuantity={onSetQuantity}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      {/* Slip Footer: Totals & Closing Actions */}
      <div className="p-4 border-t-[3px] border-border bg-paper flex flex-col gap-3">
        {/* Overflow Stock Error Alert */}
        {totals.hasOverflow && (
          <div className="p-2.5 bg-destructive/10 border-[2px] border-destructive text-destructive flex items-start gap-2">
            <AlertOctagon className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="font-bold block uppercase font-mono">
                Jumlah Melebihi Stok
              </strong>
              <span>
                Ada {totals.overflowItems.length} produk di nota yang melebihi stok sistem. Kurangi
                angka atau catat Stok Masuk sebelum tutup hari.
              </span>
            </div>
          </div>
        )}

        {/* Revenue Summary */}
        <div className="space-y-1 py-1 border-y border-border/20">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-muted-foreground uppercase">Total Terjual:</span>
            <span className="font-bold text-foreground">{totals.totalQuantity} pcs</span>
          </div>
          <div className="flex justify-between items-center font-mono">
            <span className="text-xs uppercase text-foreground font-bold">Ekspektasi Uang:</span>
            <span className="text-base font-black text-primary">Rp{revenueFmt}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          {confirmReset ? (
            <div className="flex items-center gap-1.5 w-full">
              <button
                type="button"
                onClick={() => {
                  onReset();
                  setConfirmReset(false);
                }}
                className="flex-1 h-10 px-2 bg-destructive text-destructive-foreground border-[2px] border-border font-mono text-xs font-bold uppercase shadow-hard-sm active:translate-x-[1px] active:translate-y-[1px]"
              >
                Yakin Hapus?
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-3 h-10 bg-muted text-foreground border-[2px] border-border font-mono text-xs font-bold uppercase hover:bg-muted/80"
              >
                Batal
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                disabled={tally.length === 0}
                onClick={() => setConfirmReset(true)}
                title="Reset seluruh nota hari ini"
                className="h-11 px-3 border-[2px] border-border bg-card text-muted-foreground hover:text-destructive hover:border-destructive font-mono text-xs font-bold uppercase disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                type="button"
                disabled={tally.length === 0 || totals.hasOverflow}
                onClick={onOpenClosing}
                className="flex-1 h-11 px-4 bg-primary text-primary-foreground border-[3px] border-border shadow-hard-sm font-heading font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-primary-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                <span>Tutup Hari & Rekonsiliasi</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
