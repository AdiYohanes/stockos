"use client";

import * as React from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogRoot, DialogPortal, DialogBackdrop, DialogPopup, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ReportTab } from "../types";
import { useI18n } from "@/lib/i18n/context";

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ReportTab;
  onExport: (format: "csv" | "print") => Promise<boolean>;
  isExporting?: boolean;
  error?: string | null;
}

export function ExportReportModal({ isOpen, onClose, activeTab, onExport, isExporting = false, error = null }: ExportReportModalProps) {
  const { t } = useI18n();
  const [selectedFormat, setSelectedFormat] = React.useState<"csv" | "print">("csv");
  const [started, setStarted] = React.useState(false);
  const pending = React.useRef(false);
  const handleDownload = async () => {
    if (pending.current) return;
    pending.current = true;
    setStarted(false);
    try {
      if (await onExport(selectedFormat)) {
        if (selectedFormat === "print") onClose();
        else setStarted(true);
      }
    } finally {
      pending.current = false;
    }
  };

  return <DialogRoot open={isOpen} onOpenChange={(open) => { if (!open && !isExporting) onClose(); }}>
    <DialogPortal>
      <DialogBackdrop className="print:hidden" />
      <DialogPopup className="print:hidden max-w-md rounded-none border-[3px] border-ink bg-white p-6 shadow-hard">
        <div className="border-b border-ink pb-3">
          <DialogTitle className="font-heading text-base font-bold">{t.reports.exportTitle}</DialogTitle>
          <DialogDescription className="mt-1 font-mono text-xs text-muted-foreground">
            {activeTab === "valuation" ? t.reports.tabValuation : activeTab === "velocity" ? t.reports.tabMovement : t.reports.tabLowStock}
          </DialogDescription>
        </div>
        <fieldset disabled={isExporting} className="my-5 space-y-4 font-mono text-xs">
          <legend className="mb-2 font-bold">{t.reports.fileFormat}</legend>
          <div className="grid grid-cols-2 gap-3">
            {(["csv", "print"] as const).map((format) => <button key={format} type="button" aria-pressed={selectedFormat === format} onClick={() => { setSelectedFormat(format); setStarted(false); }}
              className={cn("press flex items-center justify-center gap-2 border-[3px] p-3 font-bold focus-visible:outline-2 focus-visible:outline-offset-4", selectedFormat === format ? "border-ink bg-[#543afd] text-white shadow-hard-sm" : "border-ink bg-white")}>
              <FileText className="h-4 w-4" />{format === "csv" ? t.reports.exportCsv : t.reports.exportPdf}
            </button>)}
          </div>
          <p className="border-[3px] border-ink bg-muted p-3">{t.reports.exportLimits}</p>
        </fieldset>
        {error && <p role="alert" className="mb-4 font-mono text-xs text-red-800">{error}</p>}
        {started && <p role="status" className="mb-4 font-mono text-xs">{t.reports.downloadStarted}</p>}
        <div className="flex justify-end gap-2 border-t border-ink pt-4">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>{t.common.close}</Button>
          <Button onClick={handleDownload} disabled={isExporting || started}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {isExporting ? t.reports.processing : selectedFormat === "csv" ? t.reports.downloadCsv : t.reports.printPage}
          </Button>
        </div>
      </DialogPopup>
    </DialogPortal>
  </DialogRoot>;
}
