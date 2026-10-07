"use client";

import * as React from "react";
import { Icon } from "@iconify/react";
import type { PurchaseOrder, POStatus } from "../types";

interface PurchaseOrdersTableProps {
  orders: PurchaseOrder[];
  onInspect: (poId: string) => void;
  onReceiveGoods: (poId: string) => void;
}

export function PurchaseOrdersTable({
  orders,
  onInspect,
  onReceiveGoods,
}: PurchaseOrdersTableProps) {
  const getStatusBadge = (status: POStatus) => {
    switch (status) {
      case "DRAFT":
        return (
          <span className="bg-paper border-2 border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase">
            Draft
          </span>
        );
      case "ISSUED":
        return (
          <span className="bg-acid border-2 border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase">
            Submitted
          </span>
        );
      case "PARTIALLY_RECEIVED":
        return (
          <span className="bg-orange-400 border-2 border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase">
            Partial
          </span>
        );
      case "RECEIVED":
        return (
          <span className="bg-ink text-paper border-2 border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase">
            Received
          </span>
        );
      case "CANCELLED":
        return (
          <span className="bg-red-500 text-white border-2 border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase">
            Cancelled
          </span>
        );
    }
  };

  const getSupplierInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getSupplierAvatarColor = (name: string) => {
    const charCode = name.charCodeAt(0) || 0;
    const colors = ["bg-acid", "bg-paper", "bg-ink text-acid"];
    return colors[charCode % colors.length];
  };

  return (
    <div className="overflow-x-auto border-t-0">
      <table className="w-full min-w-[900px] text-left">
        <thead className="bg-paper border-b-[3px] border-ink font-mono text-[9px] uppercase tracking-widest">
          <tr>
            <th className="px-5 py-4">
              PO Number <Icon icon="ph:caret-up-down-bold" className="inline ml-1" />
            </th>
            <th className="px-5 py-4">Supplier</th>
            <th className="px-5 py-4">Date</th>
            <th className="px-5 py-4 text-center">Items</th>
            <th className="px-5 py-4">Total Value</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y-[2px] divide-black/10">
          {orders.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <p className="font-display font-bold uppercase text-ink text-lg mt-4">
                    No matching orders
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink/50 max-w-sm">
                    Try adjusting your search or filters
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            orders.map((po) => {
              const totalItems = po.lineItems.length;

              return (
                <tr key={po.id} className="hover:bg-acid/10 cursor-pointer" onClick={() => onInspect(po.id)}>
                  <td className="px-5 py-4 font-display font-bold text-sm">
                    {po.poNumber}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 ${getSupplierAvatarColor(
                          po.supplierName
                        )} border-2 border-ink flex items-center justify-center font-display font-bold text-xs`}
                      >
                        {getSupplierInitials(po.supplierName)}
                      </span>
                      <span className="font-display font-bold text-sm uppercase">
                        {po.supplierName}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-[10px] uppercase">
                    {new Date(po.orderDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4 text-center font-bold">
                    {totalItems}
                  </td>
                  <td className="px-5 py-4 font-display font-bold">
                    ${po.totalCost.toLocaleString()}
                  </td>
                  <td className="px-5 py-4">{getStatusBadge(po.status)}</td>
                  <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onInspect(po.id)}
                        title="View Details"
                        className="press w-8 h-8 border-2 border-ink bg-white flex items-center justify-center"
                      >
                        <Icon icon="ph:eye-bold" className="text-lg" />
                      </button>
                      <button
                        onClick={() => onReceiveGoods(po.id)}
                        disabled={
                          po.status !== "ISSUED" &&
                          po.status !== "PARTIALLY_RECEIVED"
                        }
                        title="Receive Goods"
                        className="press w-8 h-8 border-2 border-ink bg-white flex items-center justify-center disabled:opacity-30 disabled:press-none"
                      >
                        <Icon icon="ph:package-bold" className="text-lg" />
                      </button>
                      <button
                        title="Delete"
                        className="press w-8 h-8 border-2 border-ink bg-white flex items-center justify-center"
                      >
                        <Icon icon="ph:trash-bold" className="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {orders.length > 0 && (
        <div className="p-4 border-t-[3px] border-ink flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-widest opacity-50 text-ink">
            Showing 1-{orders.length} of {orders.length} orders
          </span>
          <div className="flex gap-2">
            <button className="press border-2 border-ink bg-white w-8 h-8 flex items-center justify-center text-ink">
              <Icon icon="ph:caret-left-bold" className="text-lg" />
            </button>
            <button className="press border-2 border-ink bg-acid w-8 h-8 flex items-center justify-center text-ink">
              <Icon icon="ph:caret-right-bold" className="text-lg" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}