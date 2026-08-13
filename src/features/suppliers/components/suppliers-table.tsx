"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import type { SupplierItem } from "../types";
import { SupplierRowActions } from "./supplier-row-actions";

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

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: {
    label: "ACTIVE",
    className: "bg-emerald-50 text-emerald-700 border-emerald-300",
  },
  on_hold: {
    label: "ON HOLD",
    className: "bg-amber-50 text-amber-700 border-amber-300",
  },
  inactive: {
    label: "INACTIVE",
    className: "bg-slate-100 text-slate-500 border-slate-300",
  },
};

const TIER_CONFIG: Record<string, { label: string; dotColor: string; className: string }> = {
  platinum: {
    label: "PLATINUM",
    dotColor: "bg-violet-500",
    className: "bg-violet-50 text-violet-700 border-violet-300",
  },
  gold: {
    label: "GOLD",
    dotColor: "bg-amber-500",
    className: "bg-amber-50 text-amber-700 border-amber-300",
  },
  silver: {
    label: "SILVER",
    dotColor: "bg-slate-400",
    className: "bg-slate-50 text-slate-600 border-slate-300",
  },
  bronze: {
    label: "BRONZE",
    dotColor: "bg-orange-500",
    className: "bg-orange-50 text-orange-700 border-orange-300",
  },
};

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
  if (suppliers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-white py-16">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="font-heading text-sm font-semibold text-foreground">
            No suppliers found
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground w-[90px]">
                Code
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground min-w-[180px]">
                Supplier
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground w-[90px]">
                Status
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground w-[100px]">
                Tier
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground w-[150px]">
                Categories
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-right w-[80px]">
                Lead
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-right w-[70px]">
                Orders
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-right w-[120px]">
                Total Spend
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground w-[130px]">
                On-Time
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground w-[50px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => {
              const statusConfig = STATUS_CONFIG[supplier.status];
              const tierConfig = TIER_CONFIG[supplier.tier];
              const onTimeColor =
                supplier.onTimeDeliveryRate >= 95
                  ? "text-emerald-600"
                  : supplier.onTimeDeliveryRate >= 85
                    ? "text-amber-600"
                    : "text-red-600";

              return (
                <TableRow
                  key={supplier.id}
                  className="group cursor-pointer hover:bg-slate-50/50"
                  onClick={() => onSelectSupplier(supplier.id)}
                >
                  {/* Code */}
                  <TableCell>
                    <span className="font-mono text-[11px] font-bold tracking-wider text-foreground bg-slate-100 border border-slate-300 rounded-sm px-1.5 py-0.5">
                      {supplier.code}
                    </span>
                  </TableCell>

                  {/* Name + Contact */}
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                        {supplier.name}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[200px]">
                        {supplier.contactName}
                      </span>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
                        statusConfig?.className
                      )}
                    >
                      {statusConfig?.label}
                    </span>
                  </TableCell>

                  {/* Tier */}
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
                        tierConfig?.className
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          tierConfig?.dotColor
                        )}
                      />
                      {tierConfig?.label}
                    </span>
                  </TableCell>

                  {/* Categories */}
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {supplier.categories.slice(0, 2).map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex rounded-sm border border-border bg-slate-50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground"
                        >
                          {cat}
                        </span>
                      ))}
                      {supplier.categories.length > 2 && (
                        <span className="font-mono text-[9px] text-muted-foreground/60">
                          +{supplier.categories.length - 2}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Lead Time */}
                  <TableCell className="text-right">
                    <span className="font-mono text-xs tabular-nums text-foreground">
                      {supplier.leadTimeDays}d
                    </span>
                  </TableCell>

                  {/* Orders */}
                  <TableCell className="text-right">
                    <span className="font-mono text-xs tabular-nums text-foreground">
                      {supplier.totalOrders}
                    </span>
                  </TableCell>

                  {/* Total Spend */}
                  <TableCell className="text-right">
                    <span className="font-mono text-xs tabular-nums font-medium text-foreground">
                      {formatCurrency(supplier.totalSpend)}
                    </span>
                  </TableCell>

                  {/* On-Time Rate */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={supplier.onTimeDeliveryRate}
                        className="h-1.5 w-16 bg-slate-100"
                      />
                      <span
                        className={cn(
                          "font-mono text-[11px] font-semibold tabular-nums",
                          onTimeColor
                        )}
                      >
                        {supplier.onTimeDeliveryRate}%
                      </span>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <SupplierRowActions
                      supplier={supplier}
                      onViewDetails={onSelectSupplier}
                      onEdit={onEditSupplier}
                      onDelete={onDeleteSupplier}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Page {currentPage} of {totalPages} • {totalFilteredCount} total
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="h-7 w-7 p-0 border-border"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="h-7 w-7 p-0 border-border"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
