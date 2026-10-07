"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared";
import { useI18n } from "@/lib/i18n/context";

interface PurchaseOrdersHeaderProps {
  onOpenCreateModal: () => void;
}

export function PurchaseOrdersHeader({ onOpenCreateModal }: PurchaseOrdersHeaderProps) {
  const { language, t } = useI18n();

  const actionButtons = (
    <Button
      onClick={onOpenCreateModal}
      className="border border-black bg-[#543afd] font-medium text-white shadow-neo hover:bg-[#462ee0] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
    >
      <Plus className="mr-2 h-4 w-4" />
      {language === "id" ? "Buat Purchase Order" : "Create Purchase Order"}
    </Button>
  );

  return (
    <PageHeader
      title={t.nav.purchaseOrders}
      badgeText="PO-HUB"
      description={language === "id" ? "Kelola pengadaan supplier, pantau pengiriman masuk, dan proses penerimaan stok." : "Manage vendor procurements, track incoming shipments, and process stock receipts."}
      actions={actionButtons}
    />
  );
}
