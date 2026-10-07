"use client";

import * as React from "react";
import { Icon } from "@iconify/react";
import type { WarehouseMetrics } from "../types";

interface WarehousesMetricsProps {
  metrics: WarehouseMetrics;
}

export function WarehousesMetrics({
  metrics,
}: WarehousesMetricsProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      <div className="bg-white border-[3px] border-ink shadow-hard p-5">
        <div className="flex justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">
            Total Facilities
          </span>
          <span className="w-8 h-8 bg-paper border-2 border-ink flex items-center justify-center">
            <Icon icon="ph:buildings-bold" className="text-lg" />
          </span>
        </div>
        <b className="font-display font-[900] text-4xl block mt-3">
          {metrics.totalWarehouses}
        </b>
        <div className="mt-4 pt-3 border-t-2 border-black/10 font-mono text-[9px] uppercase">
          <span className="font-bold">+{metrics.activeCount}</span> fully operational
        </div>
      </div>

      <div className="bg-white border-[3px] border-ink shadow-hard p-5">
        <div className="flex justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">
            Avg Utilization
          </span>
          <span className="w-8 h-8 bg-acid border-2 border-ink flex items-center justify-center">
            <Icon icon="ph:chart-pie-slice-bold" className="text-lg" />
          </span>
        </div>
        <b className="font-display font-[900] text-4xl block mt-3">
          {metrics.avgUtilization}%
        </b>
        <div className="h-2 border-[2px] border-ink flex mt-3">
          <span className="bg-ink" style={{ width: `${metrics.avgUtilization}%` }}></span>
          <span className="bg-paper" style={{ width: `${100 - metrics.avgUtilization}%` }}></span>
        </div>
        <div className="mt-2 font-mono text-[9px] uppercase">
          <span className="font-bold text-orange-700">{metrics.fullCount} nearing</span> max capacity
        </div>
      </div>

      <div className="bg-white border-[3px] border-ink shadow-hard p-5">
        <div className="flex justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">
            Total Inventory Value
          </span>
          <span className="w-8 h-8 bg-white border-2 border-ink flex items-center justify-center">
            <Icon icon="ph:currency-circle-dollar-bold" className="text-lg" />
          </span>
        </div>
        <b className="font-display font-[900] text-4xl block mt-3">
          ${(metrics.totalValuation / 1000).toFixed(1)}K
        </b>
        <div className="mt-4 pt-3 border-t-2 border-black/10 font-mono text-[9px] uppercase">
          <span className="font-bold">+12%</span> vs last quarter
        </div>
      </div>

      <div className="bg-ink text-paper border-[3px] border-ink shadow-hard p-5">
        <div className="flex justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-paper/50">
            Total Units Stored
          </span>
          <span className="w-8 h-8 bg-acid text-ink border-2 border-paper flex items-center justify-center">
            <Icon icon="ph:package-bold" className="text-lg" />
          </span>
        </div>
        <b className="font-display font-[900] text-4xl text-acid block mt-3">
          {(metrics.totalStockUnits / 1000).toFixed(1)}K
        </b>
        <div className="mt-4 pt-3 border-t-2 border-paper/20 font-mono text-[9px] uppercase">
          <span className="text-acid">Healthy</span> distribution
        </div>
      </div>
    </section>
  );
}