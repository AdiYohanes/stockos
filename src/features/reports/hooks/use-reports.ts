"use client";

import * as React from "react";
import type { ReportTab, ReportTimeframe } from "../types";
import {
  MOCK_VALUATION_SUMMARY,
  MOCK_MOVEMENT_VELOCITY,
  MOCK_REORDER_RISK,
  MOCK_SUPPLIER_PERFORMANCE,
  MOCK_MOVEMENT_TRENDS_30D,
} from "../mock-data";

export function useReports() {
  const [activeTab, setActiveTab] = React.useState<ReportTab>("valuation");
  const [timeframe, setTimeframe] = React.useState<ReportTimeframe>("30d");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  
  // Slide-over inspection state
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = React.useState<"velocity" | "reorder" | null>(null);

  // Modal export state
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);

  // Filtered velocity items
  const filteredVelocity = React.useMemo(() => {
    return MOCK_MOVEMENT_VELOCITY.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Filtered reorder risk items
  const filteredReorderRisk = React.useMemo(() => {
    return MOCK_REORDER_RISK.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Reset all filters
  const resetFilters = React.useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("all");
  }, []);

  // Inspect detail handler
  const handleInspect = React.useCallback(
    (id: string, type: "velocity" | "reorder") => {
      setSelectedItemId(id);
      setSelectedItemType(type);
    },
    []
  );

  const handleCloseInspect = React.useCallback(() => {
    setSelectedItemId(null);
    setSelectedItemType(null);
  }, []);

  // CSV Export Trigger
  const exportToCSV = React.useCallback((type: ReportTab) => {
    let headers: string[] = [];
    let rows: string[][] = [];
    const filename = `stockos-report-${type}-${new Date().toISOString().slice(0, 10)}.csv`;

    if (type === "valuation") {
      headers = ["Category", "Item Count", "Stock Quantity", "Total Cost ($)", "Retail Value ($)", "Margin (%)"];
      rows = MOCK_VALUATION_SUMMARY.categories.map((c) => [
        `"${c.categoryName}"`,
        c.itemCount.toString(),
        c.stockQty.toString(),
        c.totalCost.toFixed(2),
        c.totalRetailValue.toFixed(2),
        `${c.marginPercent.toFixed(1)}%`,
      ]);
    } else if (type === "velocity") {
      headers = ["SKU", "Product Name", "Category", "Stock In", "Stock Out", "Turnover Ratio", "Velocity Tier"];
      rows = filteredVelocity.map((v) => [
        `"${v.sku}"`,
        `"${v.name}"`,
        `"${v.category}"`,
        v.stockInQty.toString(),
        v.stockOutQty.toString(),
        v.turnoverRatio.toFixed(1),
        v.velocityTier.toUpperCase(),
      ]);
    } else if (type === "reorder") {
      headers = ["SKU", "Product Name", "Current Stock", "Min Threshold", "Days Remaining", "Suggested Reorder Qty", "Unit Cost ($)", "Est. Total Cost ($)", "Urgency"];
      rows = filteredReorderRisk.map((r) => [
        `"${r.sku}"`,
        `"${r.name}"`,
        r.currentStock.toString(),
        r.minThreshold.toString(),
        r.daysRemaining.toString(),
        r.suggestedReorderQty.toString(),
        r.unitCost.toFixed(2),
        r.totalReorderCost.toFixed(2),
        r.urgency.toUpperCase(),
      ]);
    } else if (type === "performance") {
      headers = ["Supplier Code", "Supplier Name", "Deliveries", "On-Time (%)", "Rating", "Total Spend ($)"];
      rows = MOCK_SUPPLIER_PERFORMANCE.map((supplier) => [
        `"${supplier.code}"`,
        `"${supplier.name}"`,
        supplier.fulfilledOrders.toString(),
        supplier.onTimeDeliveryRate.toFixed(1),
        supplier.qualityRating.toFixed(1),
        supplier.totalSpend.toFixed(2),
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredVelocity, filteredReorderRisk]);

  return {
    activeTab,
    setActiveTab,
    timeframe,
    setTimeframe,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    resetFilters,
    // Inspection
    selectedItemId,
    selectedItemType,
    handleInspect,
    handleCloseInspect,
    // Export Modal
    isExportModalOpen,
    setIsExportModalOpen,
    exportToCSV,
    // Data
    valuationSummary: MOCK_VALUATION_SUMMARY,
    velocityList: filteredVelocity,
    reorderRiskList: filteredReorderRisk,
    supplierList: MOCK_SUPPLIER_PERFORMANCE,
    movementTrends: MOCK_MOVEMENT_TRENDS_30D,
  };
}
