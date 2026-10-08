"use client";

import * as React from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import type { POSummaryMetrics } from "../types";

interface PurchaseOrdersMetricCardsProps {
  metrics: POSummaryMetrics;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function PurchaseOrdersMetricCards({
  metrics,
  activeTab,
  onTabChange,
}: PurchaseOrdersMetricCardsProps) {
  return (
    <>
      <div className="flex overflow-x-auto border-[3px] border-ink bg-white shadow-hard-sm w-fit max-w-full mb-6">
        <button
          onClick={() => onTabChange("all")}
          className={cn(
            "shrink-0 px-5 py-3 border-r-[3px] border-ink font-mono text-[10px] font-bold uppercase hover:bg-paper",
            activeTab === "all" ? "bg-acid" : ""
          )}
        >
          All ({metrics.totalOrders})
        </button>
        <button
          onClick={() => onTabChange("draft")}
          className={cn(
            "shrink-0 px-5 py-3 border-r-[2px] border-ink font-mono text-[10px] font-bold uppercase hover:bg-paper",
            activeTab === "draft" ? "bg-acid" : ""
          )}
        >
          Draft (12)
        </button>
        <button
          onClick={() => onTabChange("pending")}
          className={cn(
            "shrink-0 px-5 py-3 border-r-[2px] border-ink font-mono text-[10px] font-bold uppercase hover:bg-paper",
            activeTab === "pending" ? "bg-acid" : ""
          )}
        >
          Pending ({metrics.pendingCount})
        </button>
        <button
          onClick={() => onTabChange("partial")}
          className={cn(
            "shrink-0 px-5 py-3 border-r-[2px] border-ink font-mono text-[10px] font-bold uppercase hover:bg-paper",
            activeTab === "partial" ? "bg-acid" : ""
          )}
        >
          Partial ({metrics.partialCount})
        </button>
        <button
          onClick={() => onTabChange("received")}
          className={cn(
            "shrink-0 px-5 py-3 font-mono text-[10px] font-bold uppercase hover:bg-paper",
            activeTab === "received" ? "bg-acid" : ""
          )}
        >
          Received ({metrics.receivedCount})
        </button>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border-[3px] border-ink shadow-hard p-5">
          <div className="flex justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">
              Total POs
            </span>
            <span className="w-8 h-8 bg-paper border-2 border-ink flex items-center justify-center">
              <Icon icon="ph:clipboard-text-bold" className="text-lg" />
            </span>
          </div>
          <b className="font-display font-[900] text-4xl block mt-3">
            {metrics.totalOrders}
          </b>
          <div className="mt-4 pt-3 border-t-2 border-black/10 font-mono text-[9px] uppercase">
            <span className="font-bold">+12</span> this month
          </div>
        </div>

        <div className="bg-white border-[3px] border-ink shadow-hard p-5">
          <div className="flex justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">
              Total Amount
            </span>
            <span className="w-8 h-8 bg-acid border-2 border-ink flex items-center justify-center">
              <Icon icon="ph:currency-dollar-bold" className="text-lg" />
            </span>
          </div>
          <b className="font-display font-[900] text-4xl block mt-3">
            Rp {(metrics.totalSpend / 1000).toFixed(1)}K
          </b>
          <div className="mt-4 pt-3 border-t-2 border-black/10 font-mono text-[9px] uppercase">
            <span className="font-bold">+8.2%</span> vs last month
          </div>
        </div>

        <div className="bg-white border-[3px] border-ink shadow-hard p-5">
          <div className="flex justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">
              Pending Approval
            </span>
            <span className="w-8 h-8 bg-orange-400 border-2 border-ink flex items-center justify-center">
              <Icon icon="ph:warning-bold" className="text-lg" />
            </span>
          </div>
          <b className="font-display font-[900] text-4xl block mt-3">18</b>
          <div className="mt-4 pt-3 border-t-2 border-black/10 font-mono text-[9px] uppercase">
            <span className="font-bold text-orange-700">2 urgent</span> need review
          </div>
        </div>

        <div className="bg-ink text-paper border-[3px] border-ink shadow-hard p-5">
          <div className="flex justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-paper/50">
              Received This Month
            </span>
            <span className="w-8 h-8 bg-acid text-ink border-2 border-paper flex items-center justify-center">
              <Icon icon="ph:check-bold" className="text-lg" />
            </span>
          </div>
          <b className="font-display font-[900] text-4xl text-acid block mt-3">
            {metrics.receivedCount}
          </b>
          <div className="mt-4 pt-3 border-t-2 border-paper/20 font-mono text-[9px] uppercase">
            Rp 89.230 received
          </div>
        </div>
      </section>
    </>
  );
}