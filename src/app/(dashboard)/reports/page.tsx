"use client";

import * as React from "react";
import {
  useReports,
  ReportsHeader,
  ReportsMetricCards,
  ReportsToolbar,
  ValuationReportView,
  MovementVelocityView,
  ReorderRiskView,
  PerformanceAnalyticsView,
  ExportReportModal,
  ReportDetailSheet,
} from "@/features/reports";

export default function ReportsPage() {
  const {
    activeTab,
    setActiveTab,
    timeframe,
    setTimeframe,
    searchQuery,
    setSearchQuery,
    selectedWarehouse,
    setSelectedWarehouse,
    selectedCategory,
    setSelectedCategory,
    resetFilters,
    selectedItemId,
    selectedItemType,
    handleInspect,
    handleCloseInspect,
    isExportModalOpen,
    setIsExportModalOpen,
    exportToCSV,
    valuationSummary,
    velocityList,
    reorderRiskList,
    warehouseList,
    supplierList,
    movementTrends,
  } = useReports();

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <ReportsHeader
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Top Metric Cards */}
      <ReportsMetricCards
        valuationSummary={valuationSummary}
        reorderRiskList={reorderRiskList}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

        {/* Toolbar & Filter Controls */}
        <ReportsToolbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedWarehouse={selectedWarehouse}
          onWarehouseChange={setSelectedWarehouse}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onResetFilters={resetFilters}
        />

        {/* Sub-report Views */}
        {activeTab === "valuation" && (
          <ValuationReportView summary={valuationSummary} />
        )}

        {activeTab === "velocity" && (
          <MovementVelocityView
            velocityItems={velocityList}
            trends={movementTrends}
            onInspect={handleInspect}
          />
        )}

        {activeTab === "reorder" && (
          <ReorderRiskView
            reorderItems={reorderRiskList}
            onInspect={handleInspect}
          />
        )}

        {activeTab === "performance" && (
          <PerformanceAnalyticsView
            warehouses={warehouseList}
            suppliers={supplierList}
          />
        )}

      {/* Export Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        activeTab={activeTab}
        onExport={exportToCSV}
      />

      {/* Detail Slide-Over Inspector */}
      <ReportDetailSheet
        selectedId={selectedItemId}
        selectedType={selectedItemType}
        onClose={handleCloseInspect}
      />
    </div>
  );
}
