"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  usePurchaseOrders,
  PurchaseOrdersHeader,
  PurchaseOrdersMetricCards,
  PurchaseOrdersToolbar,
  PurchaseOrdersTable,
  PurchaseOrdersActivity,
  CreatePOModal,
  ReceiveGoodsModal,
} from "@/features/purchase-orders";

const PODetailSheet = dynamic(
  () => import("@/features/purchase-orders").then((m) => m.PODetailSheet),
  { ssr: false }
);

export default function PurchaseOrdersPage() {
  const {
    orders,
    rawOrders,
    metrics,
    activeTab,
    setActiveTab,
    selectedPoId,
    setSelectedPoId,
    isCreateModalOpen,
    setIsCreateModalOpen,
    receivingPoId,
    setReceivingPoId,
    handleCreatePo,
    handleReceiveGoods,
  } = usePurchaseOrders();

  const selectedPo = React.useMemo(() => {
    return rawOrders.find((o) => o.id === selectedPoId) || null;
  }, [rawOrders, selectedPoId]);

  const receivingPo = React.useMemo(() => {
    return rawOrders.find((o) => o.id === receivingPoId) || null;
  }, [rawOrders, receivingPoId]);

  return (
    <div className="flex flex-col gap-0 pb-12">
      <PurchaseOrdersHeader onOpenCreateModal={() => setIsCreateModalOpen(true)} />

      <PurchaseOrdersMetricCards
        metrics={metrics}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <section className="bg-white border-[3px] border-ink shadow-hard-lg overflow-hidden">
        <PurchaseOrdersToolbar
          totalOrders={rawOrders.length}
        />

        <PurchaseOrdersTable
          orders={orders}
          onInspect={(poId) => setSelectedPoId(poId)}
          onReceiveGoods={(poId) => setReceivingPoId(poId)}
        />
      </section>

      <PurchaseOrdersActivity />

      <CreatePOModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreatePo}
      />

      <ReceiveGoodsModal
        key={receivingPoId || "new-rec"}
        po={receivingPo}
        isOpen={!!receivingPoId}
        onClose={() => setReceivingPoId(null)}
        onConfirmReceive={handleReceiveGoods}
      />

      {selectedPoId && (
        <PODetailSheet
          po={selectedPo}
          isOpen={!!selectedPoId}
          onClose={() => setSelectedPoId(null)}
        />
      )}
    </div>
  );
}
