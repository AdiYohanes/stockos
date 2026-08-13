"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PurchaseOrdersHeaderProps {
  onOpenCreateModal: () => void;
}

export function PurchaseOrdersHeader({ onOpenCreateModal }: PurchaseOrdersHeaderProps) {
  return (
    <header className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Purchase Orders
          </h1>
          <Badge className="border-black bg-purple-100 font-mono text-[13px] uppercase tracking-wider text-purple-900 shadow-neo-sm">
            PO-HUB
          </Badge>
        </div>
        <span className="hidden text-base text-muted-foreground/30 sm:inline">•</span>
        <p className="text-sm text-muted-foreground sm:text-base">
          Manage vendor procurements, track incoming shipments, and process stock receipts.
        </p>
      </div>

      <div className="flex items-center gap-2 self-start max-w-full overflow-x-auto pb-0.5 sm:self-auto sm:pb-0">
        <Button
          onClick={onOpenCreateModal}
          className="border border-black bg-[#543afd] font-medium text-white shadow-neo hover:bg-[#462ee0] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Purchase Order
        </Button>
      </div>
    </header>
  );
}
