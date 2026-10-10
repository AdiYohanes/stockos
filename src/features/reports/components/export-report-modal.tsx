"use client";

import * as React from "react";
import { Download, FileText, CheckCircle2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReportTab } from "../types";
import { useI18n } from "@/lib/i18n/context";

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ReportTab;
  onExport: (format: "csv" | "print") => Promise<void> | void;
  isExporting?: boolean;
}

export function ExportReportModal({
  isOpen,
  onClose,
  activeTab,
  onExport,
  isExporting = false,
}: ExportReportModalProps) {
  const { t } = useI18n();
  const [selectedFormat, setSelectedFormat] = React.useState<"csv" | "print">("csv");
  const [isExported, setIsExported] = React.useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (selectedFormat === "print") {
      window.print();
      onClose();
    } else {
      await onExport("csv");
      setIsExported(true);
      setTimeout(() => {
        setIsExported(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-none border-2 border-black bg-white p-6 shadow-neo animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-none border-[3px] border-ink bg-[#543afd] text-white shadow-neo-sm">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-foreground">Export Data Laporan</h2>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Laporan: {activeTab === "valuation" ? "Valuasi Stok" : activeTab === "velocity" ? "Pergerakan Stok" : "Peringatan Stok Menipis"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-none p-1 text-slate-500 hover:bg-slate-100 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Options */}
        <div className="my-5 space-y-4 font-mono text-xs">
          <div>
            <label className="block font-bold text-foreground mb-1.5">Format Berkas</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedFormat("csv")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-none border p-3 font-bold transition-all",
                  selectedFormat === "csv"
                    ? "border-black bg-[#543afd] text-white shadow-neo-sm"
                    : "border-slate-300 bg-[#f8f9fa] text-slate-700 hover:bg-slate-200"
                )}
              >
                <FileText className="h-4 w-4" />
                <span>{t.reports.exportCsv || "CSV Spreadsheet"}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedFormat("print")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-none border p-3 font-bold transition-all",
                  selectedFormat === "print"
                    ? "border-black bg-[#543afd] text-white shadow-neo-sm"
                    : "border-slate-300 bg-[#f8f9fa] text-slate-700 hover:bg-slate-200"
                )}
              >
                <FileText className="h-4 w-4" />
                <span>{t.reports.exportPdf || "Cetak / PDF"}</span>
              </button>
            </div>
          </div>

          <div className="rounded-none border-[3px] border-ink bg-[#f8f9fa] p-3 text-[11px] text-muted-foreground space-y-1">
            <p className="font-bold text-foreground">Informasi Format CSV:</p>
            <p>Berkas CSV diformat sesuai standar RFC 4180 dengan sanitasi formula spreadsheet otomatis untuk keamanan data toko.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-ink pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
            className="border-[3px] border-ink bg-white font-mono text-xs font-bold hover:bg-slate-100"
          >
            {t.common.cancel || "Batal"}
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isExported || isExporting}
            className="border-[3px] border-ink bg-[#543afd] font-mono text-xs font-bold text-white shadow-neo hover:bg-[#462ee0]"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : isExported ? (
              <>
                <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-300" />
                {t.common.success || "Berhasil Diunduh!"}
              </>
            ) : (
              <>
                <Download className="mr-1.5 h-4 w-4" />
                {selectedFormat === "csv" ? (t.reports.exportCsv || "Unduh CSV") : (t.reports.exportPdf || "Cetak Tampilan")}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
