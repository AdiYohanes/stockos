"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared";

interface PurchaseOrdersHeaderProps {
  onOpenCreateModal: () => void;
}

export function PurchaseOrdersHeader({ onOpenCreateModal }: PurchaseOrdersHeaderProps) {
  const actionButtons = (
    <Button
      onClick={onOpenCreateModal}
      className="border border-black bg-[#543afd] font-medium text-white shadow-neo hover:bg-[#462ee0] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
    >
      <Plus className="mr-2 h-4 w-4" />
      Create Purchase Order
    </Button>
  );

  return (
    <PageHeader
      title="Purchase Orders"
      badgeText="PO-HUB"
      description="Manage vendor procurements, track incoming shipments, and process stock receipts."
      actions={actionButtons}
    />
  );
}
