"use client";

import * as React from "react";
import { X, ArrowLeftRight, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  InterWarehouseTransferPayload,
  StoredInventorySummary,
  WarehouseItem,
} from "../types";

interface StockTransferModalProps {
  warehouses: WarehouseItem[];
  initialSourceWarehouseId: string | null;
  open: boolean;
  onClose: () => void;
  onTransfer: (payload: InterWarehouseTransferPayload) => void;
}

export function StockTransferModal({
  warehouses,
  initialSourceWarehouseId,
  open,
  onClose,
  onTransfer,
}: StockTransferModalProps) {
  if (!open) return null;

  return (
    <StockTransferInner
      key={initialSourceWarehouseId || "transfer-modal"}
      warehouses={warehouses}
      initialSourceWarehouseId={initialSourceWarehouseId}
      onClose={onClose}
      onTransfer={onTransfer}
    />
  );
}

interface StockTransferInnerProps {
  warehouses: WarehouseItem[];
  initialSourceWarehouseId: string | null;
  onClose: () => void;
  onTransfer: (payload: InterWarehouseTransferPayload) => void;
}

function StockTransferInner({
  warehouses,
  initialSourceWarehouseId,
  onClose,
  onTransfer,
}: StockTransferInnerProps) {
  // Find initial source
  const validSource =
    warehouses.find((w) => w.id === initialSourceWarehouseId) ||
    warehouses.find((w) => (w.storedInventory?.length || 0) > 0) ||
    warehouses[0];

  const [sourceWarehouseId, setSourceWarehouseId] = React.useState<string>(
    validSource?.id || ""
  );

  // Available destinations (all except source)
  const availableDestinations = React.useMemo(() => {
    return warehouses.filter((w) => w.id !== sourceWarehouseId);
  }, [warehouses, sourceWarehouseId]);

  const [destinationWarehouseId, setDestinationWarehouseId] = React.useState<string>(
    availableDestinations[0]?.id || ""
  );

  // Current source warehouse object
  const sourceWarehouse = React.useMemo(() => {
    return warehouses.find((w) => w.id === sourceWarehouseId) || null;
  }, [warehouses, sourceWarehouseId]);

  // Current destination warehouse object
  const destinationWarehouse = React.useMemo(() => {
    return warehouses.find((w) => w.id === destinationWarehouseId) || null;
  }, [warehouses, destinationWarehouseId]);

  // Available items in selected source warehouse
  const sourceItems = React.useMemo(() => {
    return (sourceWarehouse?.storedInventory || []).filter((i) => i.available > 0);
  }, [sourceWarehouse]);

  const [selectedSku, setSelectedSku] = React.useState<string>(
    sourceItems[0]?.sku || ""
  );

  // When source warehouse changes, pick first available SKU
  React.useEffect(() => {
    if (sourceItems.length > 0) {
      setSelectedSku(sourceItems[0].sku);
    } else {
      setSelectedSku("");
    }
  }, [sourceWarehouseId, sourceItems]);

  const selectedItem: StoredInventorySummary | null = React.useMemo(() => {
    return sourceItems.find((i) => i.sku === selectedSku) || null;
  }, [sourceItems, selectedSku]);

  // Transfer quantity
  const [quantity, setQuantity] = React.useState<number>(10);

  // Reference number & notes
  const [reference, setReference] = React.useState<string>(() => {
    const timestampSuffix = Math.floor(1000 + Math.random() * 9000);
    return `TRF-2026-${timestampSuffix}`;
  });
  const [dispatchedBy, setDispatchedBy] = React.useState<string>(
    sourceWarehouse?.manager.name || "Alex Morgan"
  );
  const [notes, setNotes] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  // Find destination item stock if already present
  const destinationItem = React.useMemo(() => {
    if (!destinationWarehouse || !selectedSku) return null;
    return (
      destinationWarehouse.storedInventory?.find((i) => i.sku === selectedSku) || null
    );
  }, [destinationWarehouse, selectedSku]);

  const maxAvailable = selectedItem ? selectedItem.available : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceWarehouseId || !destinationWarehouseId) {
      setError("Please select both source and destination warehouses.");
      return;
    }
    if (sourceWarehouseId === destinationWarehouseId) {
      setError("Source and destination warehouses cannot be the same.");
      return;
    }
    if (!selectedItem) {
      setError("Please select a product item to transfer.");
      return;
    }
    if (quantity <= 0) {
      setError("Transfer quantity must be greater than 0.");
      return;
    }
    if (quantity > maxAvailable) {
      setError(
        `Quantity cannot exceed available stock at source warehouse (${maxAvailable} units).`
      );
      return;
    }
    if (!reference.trim()) {
      setError("Please provide a transfer reference number.");
      return;
    }

    onTransfer({
      sourceWarehouseId,
      destinationWarehouseId,
      sku: selectedItem.sku,
      itemName: selectedItem.name,
      quantity,
      reference: reference.trim().toUpperCase(),
      notes: notes.trim() || undefined,
      dispatchedBy: dispatchedBy.trim() || "Operations Team",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-lg border-[1.5px] border-black bg-white shadow-neo overflow-hidden animate-in zoom-in-95">
        {/* Dialog Header */}
        <div className="flex items-center justify-between border-b border-border bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#543afd] text-white border border-black shadow-neo-sm">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-foreground">
                Inter-Warehouse Stock Transfer
              </h2>
              <p className="font-mono text-[11px] text-muted-foreground uppercase">
                Dispatch and rebalance inventory between storage hubs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-slate-200 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Dialog Form */}
        <form onSubmit={handleSubmit}>
          <div className="max-h-[70vh] overflow-y-auto p-5 space-y-4 text-xs">
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-red-300 bg-red-50 p-2.5 text-xs text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Warehouse Routing: Source & Destination */}
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
              {/* Source Warehouse */}
              <div>
                <Label className="text-[11px] font-mono font-semibold uppercase text-slate-700">
                  Source Hub (From) *
                </Label>
                <select
                  value={sourceWarehouseId}
                  onChange={(e) => setSourceWarehouseId(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold text-foreground focus:border-black focus:shadow-neo-primary focus:outline-none"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
                  Available SKUs: {sourceItems.length}
                </span>
              </div>

              {/* Destination Warehouse */}
              <div>
                <Label className="text-[11px] font-mono font-semibold uppercase text-slate-700">
                  Destination Hub (To) *
                </Label>
                <select
                  value={destinationWarehouseId}
                  onChange={(e) => setDestinationWarehouseId(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold text-foreground focus:border-black focus:shadow-neo-primary focus:outline-none"
                >
                  {availableDestinations.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
                  City: {destinationWarehouse?.address.city}
                </span>
              </div>
            </div>

            {/* Product Item Selection */}
            <div>
              <Label className="text-[11px] font-mono font-semibold uppercase text-muted-foreground">
                Select Product to Transfer *
              </Label>
              {sourceItems.length > 0 ? (
                <select
                  value={selectedSku}
                  onChange={(e) => setSelectedSku(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-foreground focus:border-black focus:shadow-neo-primary focus:outline-none"
                >
                  {sourceItems.map((item) => (
                    <option key={item.id} value={item.sku}>
                      [{item.sku}] {item.name} — (Avail: {item.available} {item.unit})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="mt-1 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 font-medium">
                  No products with available stock in this source warehouse.
                </div>
              )}
            </div>

            {/* Quantity & Reference */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-mono font-semibold uppercase text-muted-foreground">
                    Transfer Quantity *
                  </Label>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    Max: <strong>{maxAvailable}</strong>
                  </span>
                </div>
                <Input
                  type="number"
                  min="1"
                  max={maxAvailable}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="mt-1 h-9 font-mono text-xs font-bold"
                  required
                />
              </div>

              <div>
                <Label className="text-[11px] font-mono font-semibold uppercase text-muted-foreground">
                  Transfer Reference *
                </Label>
                <Input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="mt-1 h-9 font-mono text-xs uppercase font-bold"
                  required
                />
              </div>
            </div>

            {/* Live Balance Impact Preview Box */}
            {selectedItem && destinationWarehouse && (
              <div className="rounded-lg border border-border bg-purple-50/40 p-3.5 space-y-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#543afd] block">
                  Projected Stock Balance Impact
                </span>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Source Hub Impact */}
                  <div className="rounded border border-purple-200 bg-white p-2.5 space-y-1">
                    <div className="font-mono text-[10px] text-muted-foreground uppercase font-bold truncate">
                      {sourceWarehouse?.code} (Source)
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-500 line-through">
                        {selectedItem.quantity}
                      </span>
                      <ArrowRight className="h-3 w-3 text-amber-600" />
                      <span className="font-bold text-slate-900">
                        {Math.max(0, selectedItem.quantity - quantity)} {selectedItem.unit}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-amber-600 font-semibold block">
                      -{quantity} units dispatched
                    </span>
                  </div>

                  {/* Destination Hub Impact */}
                  <div className="rounded border border-purple-200 bg-white p-2.5 space-y-1">
                    <div className="font-mono text-[10px] text-muted-foreground uppercase font-bold truncate">
                      {destinationWarehouse?.code} (Destination)
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-500">
                        {destinationItem?.quantity || 0}
                      </span>
                      <ArrowRight className="h-3 w-3 text-emerald-600" />
                      <span className="font-bold text-emerald-700">
                        {(destinationItem?.quantity || 0) + quantity} {selectedItem.unit}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-emerald-700 font-semibold block">
                      +{quantity} units received
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Dispatched By & Operational Notes */}
            <div className="space-y-3 pt-1">
              <div>
                <Label className="text-[11px] font-mono text-muted-foreground">
                  Dispatched By (PIC Name)
                </Label>
                <Input
                  type="text"
                  value={dispatchedBy}
                  onChange={(e) => setDispatchedBy(e.target.value)}
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <div>
                <Label className="text-[11px] font-mono text-muted-foreground">
                  Operational Notes / Reason
                </Label>
                <Input
                  type="text"
                  placeholder="e.g. Urgent stock replenishment for regional orders"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Dialog Action Footer */}
          <div className="flex items-center justify-end gap-2.5 border-t border-border bg-slate-50 px-5 py-3.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 border-slate-300 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={sourceItems.length === 0}
              className="h-9 bg-[#543afd] hover:bg-[#462ee0] text-white border border-black shadow-neo-sm font-semibold text-xs active:translate-x-0.5 active:translate-y-0.5 transition-all gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Confirm Stock Transfer</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
