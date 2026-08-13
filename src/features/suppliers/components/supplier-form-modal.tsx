"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DialogRoot,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SupplierItem, SupplierStatus, SupplierTier, PaymentTerms } from "../types";
import type { SupplierFormData } from "../hooks/use-suppliers";
import { SUPPLIER_CATEGORIES, PAYMENT_TERMS_LABELS } from "../mock-data";

interface SupplierFormModalProps {
  supplier: SupplierItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: SupplierFormData) => void;
}

export function SupplierFormModal({
  supplier,
  open,
  onClose,
  onSave,
}: SupplierFormModalProps) {
  return (
    <DialogRoot open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="max-w-lg p-0 border-[1.5px] border-black shadow-neo">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold tracking-tight">
              {supplier ? "Edit Supplier" : "Add New Supplier"}
            </DialogTitle>
          </DialogHeader>
          {/* Keyed form sub-component to avoid useEffect for edit state */}
          <SupplierFormContent
            key={supplier?.id ?? "new"}
            supplier={supplier}
            onClose={onClose}
            onSave={onSave}
          />
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}

interface SupplierFormContentProps {
  supplier: SupplierItem | null;
  onClose: () => void;
  onSave: (data: SupplierFormData) => void;
}

function SupplierFormContent({ supplier, onClose, onSave }: SupplierFormContentProps) {
  const isEdit = !!supplier;

  const [code, setCode] = React.useState(supplier?.code ?? "");
  const [name, setName] = React.useState(supplier?.name ?? "");
  const [status, setStatus] = React.useState<SupplierStatus>(supplier?.status ?? "active");
  const [tier, setTier] = React.useState<SupplierTier>(supplier?.tier ?? "bronze");
  const [contactName, setContactName] = React.useState(supplier?.contactName ?? "");
  const [contactEmail, setContactEmail] = React.useState(supplier?.contactEmail ?? "");
  const [contactPhone, setContactPhone] = React.useState(supplier?.contactPhone ?? "");
  const [street, setStreet] = React.useState(supplier?.address.street ?? "");
  const [city, setCity] = React.useState(supplier?.address.city ?? "");
  const [province, setProvince] = React.useState(supplier?.address.province ?? "");
  const [postalCode, setPostalCode] = React.useState(supplier?.address.postalCode ?? "");
  const [website, setWebsite] = React.useState(supplier?.website ?? "");
  const [paymentTerms, setPaymentTerms] = React.useState<PaymentTerms>(
    supplier?.paymentTerms ?? "net_30"
  );
  const [leadTimeDays, setLeadTimeDays] = React.useState(
    supplier?.leadTimeDays?.toString() ?? "7"
  );
  const [categories, setCategories] = React.useState<string[]>(supplier?.categories ?? []);
  const [notes, setNotes] = React.useState(supplier?.notes ?? "");

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!code.trim()) newErrors.code = "Required";
    if (!name.trim()) newErrors.name = "Required";
    if (!contactName.trim()) newErrors.contactName = "Required";
    if (!contactEmail.trim()) newErrors.contactEmail = "Required";
    if (!contactPhone.trim()) newErrors.contactPhone = "Required";
    if (!street.trim()) newErrors.street = "Required";
    if (!city.trim()) newErrors.city = "Required";
    if (!province.trim()) newErrors.province = "Required";
    if (!postalCode.trim()) newErrors.postalCode = "Required";

    const leadNum = parseInt(leadTimeDays, 10);
    if (isNaN(leadNum) || leadNum < 1) newErrors.leadTimeDays = "Must be at least 1";

    if (categories.length === 0) newErrors.categories = "Select at least one category";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      code,
      name,
      status,
      tier,
      contactName,
      contactEmail,
      contactPhone,
      street,
      city,
      province,
      postalCode,
      website: website || undefined,
      paymentTerms,
      leadTimeDays: parseInt(leadTimeDays, 10),
      categories,
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogBody>
        <ScrollArea className="max-h-[55vh]">
          <div className="space-y-5 pr-3">
            {/* Basic Info */}
            <div className="space-y-3">
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sup-code" className="text-xs">
                    Supplier Code
                  </Label>
                  <Input
                    id="sup-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="SUP-012"
                    className={cn(
                      "h-8 text-xs font-mono uppercase",
                      errors.code && "border-red-500"
                    )}
                  />
                  {errors.code && (
                    <p className="text-[10px] text-red-500">{errors.code}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sup-status" className="text-xs">
                    Status
                  </Label>
                  <Select
                    value={status}
                    onValueChange={(val) => val && setStatus(val as SupplierStatus)}
                  >
                    <SelectTrigger id="sup-status" className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sup-name" className="text-xs">
                  Company Name
                </Label>
                <Input
                  id="sup-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Supplier name"
                  className={cn("h-8 text-xs", errors.name && "border-red-500")}
                />
                {errors.name && (
                  <p className="text-[10px] text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sup-tier" className="text-xs">
                    Tier
                  </Label>
                  <Select
                    value={tier}
                    onValueChange={(val) => val && setTier(val as SupplierTier)}
                  >
                    <SelectTrigger id="sup-tier" className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="platinum">Platinum</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="bronze">Bronze</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sup-payment" className="text-xs">
                    Payment Terms
                  </Label>
                  <Select
                    value={paymentTerms}
                    onValueChange={(val) => val && setPaymentTerms(val as PaymentTerms)}
                  >
                    <SelectTrigger id="sup-payment" className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_TERMS_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sup-lead" className="text-xs">
                  Lead Time (days)
                </Label>
                <Input
                  id="sup-lead"
                  type="number"
                  min={1}
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(e.target.value)}
                  className={cn(
                    "h-8 text-xs w-32",
                    errors.leadTimeDays && "border-red-500"
                  )}
                />
                {errors.leadTimeDays && (
                  <p className="text-[10px] text-red-500">{errors.leadTimeDays}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Contact */}
            <div className="space-y-3">
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Contact Person
              </h3>
              <div className="space-y-1.5">
                <Label htmlFor="sup-contact-name" className="text-xs">
                  Contact Name
                </Label>
                <Input
                  id="sup-contact-name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Full name"
                  className={cn(
                    "h-8 text-xs",
                    errors.contactName && "border-red-500"
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sup-contact-email" className="text-xs">
                    Email
                  </Label>
                  <Input
                    id="sup-contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="email@example.com"
                    className={cn(
                      "h-8 text-xs",
                      errors.contactEmail && "border-red-500"
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sup-contact-phone" className="text-xs">
                    Phone
                  </Label>
                  <Input
                    id="sup-contact-phone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+62 812-..."
                    className={cn(
                      "h-8 text-xs",
                      errors.contactPhone && "border-red-500"
                    )}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sup-website" className="text-xs">
                  Website (optional)
                </Label>
                <Input
                  id="sup-website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <Separator />

            {/* Address */}
            <div className="space-y-3">
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Address
              </h3>
              <div className="space-y-1.5">
                <Label htmlFor="sup-street" className="text-xs">
                  Street
                </Label>
                <Input
                  id="sup-street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Street address"
                  className={cn(
                    "h-8 text-xs",
                    errors.street && "border-red-500"
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sup-city" className="text-xs">
                    City
                  </Label>
                  <Input
                    id="sup-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={cn(
                      "h-8 text-xs",
                      errors.city && "border-red-500"
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sup-province" className="text-xs">
                    Province
                  </Label>
                  <Input
                    id="sup-province"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className={cn(
                      "h-8 text-xs",
                      errors.province && "border-red-500"
                    )}
                  />
                </div>
              </div>
              <div className="space-y-1.5 w-1/2">
                <Label htmlFor="sup-postal" className="text-xs">
                  Postal Code
                </Label>
                <Input
                  id="sup-postal"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className={cn(
                    "h-8 text-xs",
                    errors.postalCode && "border-red-500"
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Categories */}
            <div className="space-y-3">
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Product Categories Supplied
              </h3>
              {errors.categories && (
                <p className="text-[10px] text-red-500">{errors.categories}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {SUPPLIER_CATEGORIES.map((cat) => {
                  const isSelected = categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        "inline-flex items-center rounded-sm border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition-all",
                        isSelected
                          ? "border-[1.5px] border-black bg-foreground text-white shadow-neo-sm"
                          : "border-border bg-white text-muted-foreground hover:border-slate-400 hover:text-foreground"
                      )}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="sup-notes" className="text-xs">
                Internal Notes (optional)
              </Label>
              <textarea
                id="sup-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any internal notes about this supplier..."
                className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:border-black focus-visible:shadow-[2px_2px_0px_#543afd] resize-none"
              />
            </div>
          </div>
        </ScrollArea>
      </DialogBody>

      {/* Footer Actions */}
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          className="h-8 text-xs border-border"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          className="h-8 gap-1.5 bg-[#543afd] hover:bg-[#462ee0] text-white border-[1.5px] border-black font-semibold text-xs shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          {isEdit ? "Save Changes" : "Add Supplier"}
        </Button>
      </DialogFooter>
    </form>
  );
}
