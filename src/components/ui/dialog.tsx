"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const DialogRoot = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogPortal = DialogPrimitive.Portal;
const DialogTitle = DialogPrimitive.Title;
const DialogDescription = DialogPrimitive.Description;

function DialogBackdrop({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Backdrop>) {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]",
        "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
        "transition-opacity duration-200",
        className
      )}
      {...props}
    />
  );
}

function DialogPopup({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Popup>) {
  return (
    <DialogPrimitive.Popup
      className={cn(
        "fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
        "w-[calc(100vw-2rem)] max-w-lg",
        "rounded-lg border border-border bg-card p-0 shadow-xl",
        "data-[starting-style]:opacity-0 data-[starting-style]:scale-95",
        "data-[ending-style]:opacity-0 data-[ending-style]:scale-95",
        "transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Popup>
  );
}

function DialogHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 border-b border-border px-5 py-4",
        className
      )}
      {...props}
    >
      <div className="flex-1 space-y-1">{children}</div>
      <DialogPrimitive.Close
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground transition-all hover:border-black hover:bg-foreground hover:text-background active:translate-y-px cursor-pointer"
        aria-label="Close dialog"
      >
        <X className="h-3.5 w-3.5" />
      </DialogPrimitive.Close>
    </div>
  );
}

function DialogBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-5 py-4 space-y-4", className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 border-t border-border px-5 py-3",
        className
      )}
      {...props}
    />
  );
}

export {
  DialogRoot,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
