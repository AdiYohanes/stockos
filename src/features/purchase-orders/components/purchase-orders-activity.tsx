"use client";

import * as React from "react";
import { Icon } from "@iconify/react";

export function PurchaseOrdersActivity() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-[1.3fr_.7fr] gap-8 mt-8">
      <div className="bg-white border-[3px] border-ink shadow-hard p-5">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-display font-[900] uppercase text-xl">
              Recent PO Activity
            </h2>
            <p className="font-mono text-[10px] uppercase tracking-widest opacity-50 mt-1">
              Live procurement timeline
            </p>
          </div>
          <span className="w-3 h-3 bg-acid border-2 border-ink"></span>
        </div>
        <div className="space-y-5">
          <div className="flex gap-3">
            <span className="w-9 h-9 bg-acid border-2 border-ink flex items-center justify-center shrink-0">
              <Icon icon="ph:plus-bold" className="text-lg text-ink" />
            </span>
            <div>
              <p className="font-display font-bold text-sm uppercase">
                PO-2026-0156 created
              </p>
              <p className="text-sm opacity-70">
                Maya Chen created an order with Apex Components
              </p>
              <p className="font-mono text-[9px] uppercase opacity-50 mt-1">
                8 minutes ago
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="w-9 h-9 bg-green-400 border-2 border-ink flex items-center justify-center shrink-0">
              <Icon icon="ph:check-bold" className="text-lg text-ink" />
            </span>
            <div>
              <p className="font-display font-bold text-sm uppercase">
                PO-2026-0155 approved
              </p>
              <p className="text-sm opacity-70">
                Demo User approved Rp 9.280 for Northstar Fulfillment
              </p>
              <p className="font-mono text-[9px] uppercase opacity-50 mt-1">
                42 minutes ago
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="w-9 h-9 bg-ink text-acid border-2 border-ink flex items-center justify-center shrink-0">
              <Icon icon="ph:package-bold" className="text-lg" />
            </span>
            <div>
              <p className="font-display font-bold text-sm uppercase">
                PO-2026-0154 received
              </p>
              <p className="text-sm opacity-70">
                38 items received at Main Hub WH-1
              </p>
              <p className="font-mono text-[9px] uppercase opacity-50 mt-1">
                2 hours ago
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-acid border-[3px] border-ink shadow-hard p-5">
        <h2 className="font-display font-[900] uppercase text-xl mb-4 text-ink">
          Supplier Pulse
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-widest mb-5 text-ink">
          On-time delivery rate
        </p>
        <b className="font-display font-[900] text-6xl text-ink">94%</b>
        <div className="h-5 border-[3px] border-ink flex mt-5">
          <span className="bg-ink w-[94%]"></span>
          <span className="bg-paper w-[6%]"></span>
        </div>
        <p className="font-mono text-[9px] uppercase tracking-widest mt-4 text-ink">
          +4.2% vs previous month
        </p>
      </div>
    </section>
  );
}