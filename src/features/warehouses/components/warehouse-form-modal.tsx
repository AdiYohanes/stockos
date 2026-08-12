"use client";

import * as React from "react";
import { X, Building2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WarehouseItem, WarehouseStatus, WarehouseType } from "../types";
import { WAREHOUSE_STATUSES, WAREHOUSE_TYPES } from "../mock-data";

interface WarehouseFormModalProps {
  warehouse: WarehouseItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    code: string;
    type: WarehouseType;
    status: WarehouseStatus;
    street: string;
    city: string;
    province: string;
    postalCode: string;
    managerName: string;
    managerEmail: string;
    managerPhone: string;
    totalCapacityUnits: number;
  }) => void;
}

export function WarehouseFormModal({
  warehouse,
  open,
  onClose,
  onSave,
}: WarehouseFormModalProps) {
  if (!open) return null;

  return (
    <WarehouseFormInner
      key={warehouse?.id || "new"}
      warehouse={warehouse}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

interface WarehouseFormInnerProps {
  warehouse: WarehouseItem | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    code: string;
    type: WarehouseType;
    status: WarehouseStatus;
    street: string;
    city: string;
    province: string;
    postalCode: string;
    managerName: string;
    managerEmail: string;
    managerPhone: string;
    totalCapacityUnits: number;
  }) => void;
}

function WarehouseFormInner({
  warehouse,
  onClose,
  onSave,
}: WarehouseFormInnerProps) {
  const isEditing = !!warehouse;

  const [name, setName] = React.useState(warehouse?.name || "");
  const [code, setCode] = React.useState(warehouse?.code || "");
  const [type, setType] = React.useState<WarehouseType>(
    warehouse?.type || "regional_depot"
  );
  const [status, setStatus] = React.useState<WarehouseStatus>(
    warehouse?.status || "active"
  );
  const [totalCapacityUnits, setTotalCapacityUnits] = React.useState<number>(
    warehouse?.totalCapacityUnits || 3000
  );
  const [street, setStreet] = React.useState(warehouse?.address?.street || "");
  const [city, setCity] = React.useState(warehouse?.address?.city || "");
  const [province, setProvince] = React.useState(
    warehouse?.address?.province || "DKI Jakarta"
  );
  const [postalCode, setPostalCode] = React.useState(
    warehouse?.address?.postalCode || ""
  );
  const [managerName, setManagerName] = React.useState(
    warehouse?.manager?.name || ""
  );
  const [managerEmail, setManagerEmail] = React.useState(
    warehouse?.manager?.email || ""
  );
  const [managerPhone, setManagerPhone] = React.useState(
    warehouse?.manager?.phone || ""
  );

  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a facility name.");
      return;
    }
    if (!code.trim()) {
      setError("Please provide a hub code (e.g. WH-06).");
      return;
    }
    if (totalCapacityUnits <= 0) {
      setError("Capacity must be greater than 0 units.");
      return;
    }
    if (!managerName.trim()) {
      setError("Please specify a manager / PIC name.");
      return;
    }
    if (!city.trim()) {
      setError("Please enter the facility city.");
      return;
    }

    onSave({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type,
      status,
      street: street.trim() || "Industrial Zone",
      city: city.trim(),
      province: province.trim() || "Indonesia",
      postalCode: postalCode.trim() || "10000",
      managerName: managerName.trim(),
      managerEmail: managerEmail.trim() || "manager@stockos.internal",
      managerPhone: managerPhone.trim() || "+62 811-0000-0000",
      totalCapacityUnits,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-lg border-[1.5px] border-black bg-white shadow-neo overflow-hidden animate-in zoom-in-95">
        {/* Dialog Header */}
        <div className="flex items-center justify-between border-b border-border bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-black text-white border border-black shadow-neo-sm">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-foreground">
                {isEditing ? `Edit Facility: ${warehouse.code}` : "Add New Warehouse"}
              </h2>
              <p className="font-mono text-[11px] text-muted-foreground uppercase">
                {isEditing ? "Update specifications & contacts" : "Register a new storage facility"}
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

            {/* Row 1: Code & Facility Name */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-[11px] font-mono font-semibold uppercase text-muted-foreground">
                  Hub Code *
                </Label>
                <Input
                  type="text"
                  placeholder="WH-06"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="mt-1 h-9 font-mono font-bold text-xs uppercase"
                  required
                />
              </div>
              <div className="col-span-2">
                <Label className="text-[11px] font-mono font-semibold uppercase text-muted-foreground">
                  Facility Name *
                </Label>
                <Input
                  type="text"
                  placeholder="e.g. South Logistics Depot"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 h-9 text-xs"
                  required
                />
              </div>
            </div>

            {/* Row 2: Type, Status, Max Capacity */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-[11px] font-mono font-semibold uppercase text-muted-foreground">
                  Facility Type
                </Label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as WarehouseType)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-foreground focus:border-black focus:shadow-neo-primary focus:outline-none"
                >
                  {WAREHOUSE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-[11px] font-mono font-semibold uppercase text-muted-foreground">
                  Status
                </Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as WarehouseStatus)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-foreground focus:border-black focus:shadow-neo-primary focus:outline-none"
                >
                  {WAREHOUSE_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-[11px] font-mono font-semibold uppercase text-muted-foreground">
                  Max Capacity *
                </Label>
                <Input
                  type="number"
                  min="100"
                  step="50"
                  placeholder="3000"
                  value={totalCapacityUnits}
                  onChange={(e) => setTotalCapacityUnits(Number(e.target.value))}
                  className="mt-1 h-9 font-mono text-xs"
                  required
                />
              </div>
            </div>

            {/* Section: Location */}
            <div className="border-t border-slate-100 pt-3 space-y-3">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-foreground block">
                Facility Address & Location
              </span>
              <div>
                <Label className="text-[11px] font-mono text-muted-foreground">
                  Street Address
                </Label>
                <Input
                  type="text"
                  placeholder="Jl. Raya Pergudangan No. 12"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-[11px] font-mono text-muted-foreground">City *</Label>
                  <Input
                    type="text"
                    placeholder="Jakarta"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1 h-9 text-xs"
                    required
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-mono text-muted-foreground">Province</Label>
                  <Input
                    type="text"
                    placeholder="DKI Jakarta"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-mono text-muted-foreground">Postal Code</Label>
                  <Input
                    type="text"
                    placeholder="12345"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="mt-1 h-9 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Section: Manager / PIC */}
            <div className="border-t border-slate-100 pt-3 space-y-3">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-foreground block">
                Manager / PIC Details
              </span>
              <div>
                <Label className="text-[11px] font-mono text-muted-foreground">
                  Full Name *
                </Label>
                <Input
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className="mt-1 h-9 text-xs"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-mono text-muted-foreground">Email</Label>
                  <Input
                    type="email"
                    placeholder="manager@stockos.internal"
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-mono text-muted-foreground">Phone</Label>
                  <Input
                    type="text"
                    placeholder="+62 811-XXXX-XXXX"
                    value={managerPhone}
                    onChange={(e) => setManagerPhone(e.target.value)}
                    className="mt-1 h-9 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Action Footer */}
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
              className="h-9 bg-[#543afd] hover:bg-[#462ee0] text-white border border-black shadow-neo-sm font-semibold text-xs active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              {isEditing ? "Save Changes" : "Create Warehouse"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
