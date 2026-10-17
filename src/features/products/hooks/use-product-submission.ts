"use client";

import * as React from "react";
import { useI18n } from "@/lib/i18n/context";
import { getProductAction } from "../actions";
import type { ProductDto, ProductMutationResult } from "../schemas/product-rpc.schema";
export type OnProductCommitted = (product: ProductDto) => void | Promise<void>;

export function useProductSubmission(
  action: (input: unknown) => Promise<ProductMutationResult>,
  onCommitted: OnProductCommitted,
) {
  const { t } = useI18n();
  const [pending, setPending] = React.useState(false);
  const [uncertain, setUncertain] = React.useState(false);
  const [refreshFailed, setRefreshFailed] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [code, setCode] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [current, setCurrent] = React.useState<ProductDto | null>(null);
  const running = React.useRef(false);
  const request = React.useRef<Readonly<Record<string, unknown>> | null>(null);
  const committed = React.useRef<ProductDto | null>(null);
  const unresolved = React.useRef(false);
  const conflictProductId = React.useRef<string | null>(null);

  async function readCurrent(productId: string) {
    try {
      const detail = await getProductAction({ id: productId });
      if (detail.ok) setCurrent(detail.data);
      else setError(t.products.persistent.errors[detail.code] || t.common.error);
    } catch { setError(t.common.error); }
  }

  async function execute(payload?: Record<string, unknown>) {
    if (running.current) return;
    running.current = true;
    setPending(true);
    setError(null);
    try {
      if (!committed.current) {
        if (!request.current) {
          if (!payload) return;
          request.current = Object.freeze(structuredClone({ ...payload, requestId: crypto.randomUUID() }));
        }
        let result: ProductMutationResult;
        try {
          result = await action(request.current);
        } catch {
          unresolved.current = true;
          setUncertain(true);
          setError(t.products.persistent.uncertain);
          return;
        }
        if (!result.ok) {
          setCode(result.code);
          setFieldErrors(result.fieldErrors ?? {});
          if (unresolved.current || result.code === "INTERNAL_ERROR") {
            unresolved.current = true;
            setUncertain(true);
            setError(t.products.persistent.uncertain);
            return;
          }
          const productId = request.current.productId;
          request.current = null;
          setUncertain(false);
          setError(t.products.persistent.errors[result.code] || t.common.error);
          if (result.code === "VERSION_CONFLICT" && typeof productId === "string") {
            conflictProductId.current = productId;
            await readCurrent(productId);
          }
          return;
        }
        committed.current = result.data.product;
        unresolved.current = false;
        setUncertain(false);
      }
      try {
        await onCommitted(committed.current);
        request.current = null;
        committed.current = null;
        setRefreshFailed(false);
        setCode(null);
        setFieldErrors({});
      } catch {
        setRefreshFailed(true);
        setError(t.products.persistent.refreshError);
      }
    } finally {
      running.current = false;
      setPending(false);
    }
  }

  return {
    pending, uncertain, refreshFailed, error, code, fieldErrors, current,
    blocked: pending || uncertain || refreshFailed,
    submit: (payload: Record<string, unknown>) => React.startTransition(() => { void execute(payload); }),
    retry: () => React.startTransition(() => { void execute(); }),
    reportError: setError,
    reloadCurrent: () => React.startTransition(() => { if (conflictProductId.current) void readCurrent(conflictProductId.current); }),
    review: () => { if (!current) return; conflictProductId.current = null; setCurrent(null); setCode(null); setError(null); },
  };
}
