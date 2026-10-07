"use client";

import * as React from "react";
import { Icon } from "@iconify/react";
import type { SupplierItem, SupplierStatus, SupplierTier } from "../types";

interface SuppliersTableProps {
  suppliers: SupplierItem[];
  currentPage: number;
  totalPages: number;
  totalFilteredCount: number;
  onPageChange: (page: number) => void;
  onSelectSupplier: (id: string) => void;
  onEditSupplier: (supplier: SupplierItem) => void;
  onDeleteSupplier: (supplier: SupplierItem) => void;
}

export function SuppliersTable({
  suppliers,
  currentPage,
  totalPages,
  totalFilteredCount,
  onPageChange,
  onSelectSupplier,
  onEditSupplier,
  onDeleteSupplier,
}: SuppliersTableProps) {
  const startIndex = (currentPage - 1) * 10 + 1;
  const endIndex = Math.min(currentPage * 10, totalFilteredCount);

  const getStatusBadge = (status: SupplierStatus) => {
    switch (status) {
      case "active":
        return (
          <span className="bg-acid border-2 border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase">
            Active
          </span>
        );
      case "on_hold":
        return (
          <span className="bg-orange-400 border-2 border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase">
            On Hold
          </span>
        );
      case "inactive":
        return (
          <span className="bg-paper border-2 border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase">
            Inactive
          </span>
        );
    }
  };

  const getTierBadge = (tier: SupplierTier) => {
    switch (tier) {
      case "platinum":
        return (
          <span className="bg-ink text-acid border-2 border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase">
            Platinum
          </span>
        );
      case "gold":
        return (
          <span className="bg-white border-2 border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase">
            Gold
          </span>
        );
      case "silver":
        return (
          <span className="bg-paper border-2 border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase text-ink/70">
            Silver
          </span>
        );
      case "bronze":
        return (
          <span className="bg-paper border-2 border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase text-ink/50">
            Bronze
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
      <table className="w-full min-w-[1000px] text-left">
        <thead className="bg-paper border-b-[3px] border-ink font-mono text-[9px] uppercase tracking-widest">
          <tr>
            <th className="px-5 py-4">Supplier Name</th>
            <th className="px-5 py-4">Tier</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4 text-center">Avg Lead Time</th>
            <th className="px-5 py-4">On-Time %</th>
            <th className="px-5 py-4 text-right">Total Spend</th>
            <th className="px-5 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y-[2px] divide-black/10">
          {suppliers.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <p className="font-display font-bold uppercase text-ink text-lg mt-4">
                    No matching suppliers
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink/50 max-w-sm">
                    Try adjusting your search or filters
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            suppliers.map((sup) => (
              <tr
                key={sup.id}
                className="hover:bg-acid/10 cursor-pointer"
                onClick={() => onSelectSupplier(sup.id)}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 ${getSupplierAvatarColor(
                        sup.name
                      )} border-2 border-ink flex items-center justify-center font-display font-bold text-xs`}
                    >
                      {getSupplierInitials(sup.name)}
                    </span>
                    <div>
                      <p className="font-display font-bold text-sm uppercase">
                        {sup.name}
                      </p>
                      <p className="font-mono text-[9px] opacity-45">
                        {sup.code} • {sup.contactName}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">{getTierBadge(sup.tier)}</td>
                <td className="px-5 py-4">{getStatusBadge(sup.status)}</td>
                <td className="px-5 py-4 text-center font-bold">
                  {sup.leadTimeDays} <span className="font-mono text-[9px] font-normal opacity-50 uppercase">days</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-[900] text-lg">
                      {sup.onTimeDeliveryRate}%
                    </span>
                    <div className="w-16 h-2 border-2 border-ink bg-paper hidden sm:block">
                      <div
                        className="h-full bg-ink"
                        style={{ width: `${sup.onTimeDeliveryRate}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-right font-display font-bold">
                  ${(sup.totalSpend / 1000).toFixed(1)}K
                </td>
                <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEditSupplier(sup)}
                      title="Edit Supplier"
                      className="press w-8 h-8 border-2 border-ink bg-white flex items-center justify-center"
                    >
                      <Icon icon="ph:pencil-bold" className="text-lg" />
                    </button>
                    <button
                      onClick={() => onSelectSupplier(sup.id)}
                      title="View Details"
                      className="press w-8 h-8 border-2 border-ink bg-white flex items-center justify-center"
                    >
                      <Icon icon="ph:eye-bold" className="text-lg" />
                    </button>
                    <button
                      onClick={() => onDeleteSupplier(sup)}
                      title="Delete"
                      className="press w-8 h-8 border-2 border-ink bg-white flex items-center justify-center"
                    >
                      <Icon icon="ph:trash-bold" className="text-lg" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalFilteredCount > 0 && (
        <div className="p-4 border-t-[3px] border-ink flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-widest opacity-50 text-ink">
            Showing {startIndex}-{endIndex} of {totalFilteredCount} vendors
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="press border-2 border-ink bg-white w-8 h-8 flex items-center justify-center text-ink disabled:opacity-50"
            >
              <Icon icon="ph:caret-left-bold" className="text-lg" />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="press border-2 border-ink bg-acid w-8 h-8 flex items-center justify-center text-ink disabled:opacity-50"
            >
              <Icon icon="ph:caret-right-bold" className="text-lg" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}