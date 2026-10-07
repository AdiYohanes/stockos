"use client";

import * as React from "react";
import { Icon } from "@iconify/react";
import type { SupplierMetrics } from "../types";

interface SuppliersMetricsProps {
  metrics: SupplierMetrics;
}

export function SuppliersMetrics({
  metrics,
}: SuppliersMetricsProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      <div className="bg-white border-[3px] border-ink shadow-hard p-5">
        <div className="flex justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">
            Total Vendors
          </span>
          <span className="w-8 h-8 bg-paper border-2 border-ink flex items-center justify-center">
            <Icon icon="ph:users-bold" className="text-lg" />
          </span>
        </div>
        <b className="font-display font-[900] text-4xl block mt-3">
          {metrics.totalSuppliers}
        </b>
        <div className="mt-4 pt-3 border-t-2 border-black/10 font-mono text-[9px] uppercase">
          <span className="font-bold">2 pending</span> compliance review
        </div>
      </div>
      <div className="bg-white border-[3px] border-ink shadow-hard p-5">
        <div className="flex justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">
            Avg Delivery Score
          </span>
          <span className="w-8 h-8 bg-acid border-2 border-ink flex items-center justify-center">
            <Icon icon="ph:target-bold" className="text-lg" />
          </span>
        </div>
        <b className="font-display font-[900] text-4xl block mt-3">
          {metrics.avgOnTimeDelivery}%
        </b>
        <div className="mt-4 pt-3 border-t-2 border-black/10 font-mono text-[9px] uppercase">
          <span className="font-bold">+1.2%</span> vs last month
        </div>
      </div>
      <div className="bg-white border-[3px] border-ink shadow-hard p-5">
        <div className="flex justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">
            Active Contracts
          </span>
          <span className="w-8 h-8 bg-white border-2 border-ink flex items-center justify-center">
            <Icon icon="ph:file-text-bold" className="text-lg" />
          </span>
        </div>
        <b className="font-display font-[900] text-4xl block mt-3">
          {metrics.activeCount}
        </b>
        <div className="mt-4 pt-3 border-t-2 border-black/10 font-mono text-[9px] uppercase">
          <span className="font-bold text-orange-700">3 expiring</span> in 30 days
        </div>
      </div>
      <div className="bg-ink text-paper border-[3px] border-ink shadow-hard p-5">
        <div className="flex justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-paper/50">
            Total Spend (YTD)
          </span>
          <span className="w-8 h-8 bg-acid text-ink border-2 border-paper flex items-center justify-center">
            <Icon icon="ph:currency-dollar-bold" className="text-lg" />
          </span>
        </div>
        <b className="font-display font-[900] text-4xl text-acid block mt-3">
          ${(metrics.totalSpend / 1000).toFixed(1)}K
        </b>
        <div className="mt-4 pt-3 border-t-2 border-paper/20 font-mono text-[9px] uppercase">
          Across {metrics.totalSuppliers} suppliers
        </div>
      </div>
    </section>
  );
}