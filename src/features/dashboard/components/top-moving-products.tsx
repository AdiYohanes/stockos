import * as React from "react";
import { Flame } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/format";
import type { TopMovingProduct } from "../types";
import { MOCK_TOP_MOVING_PRODUCTS } from "../mock-data";

interface TopMovingProductsProps {
  products?: TopMovingProduct[];
}

export function TopMovingProducts({ products = MOCK_TOP_MOVING_PRODUCTS }: TopMovingProductsProps) {
  const maxMovement = Math.max(...products.map((p) => p.movementQty), 1);

  return (
    <Card className="flex flex-col justify-between overflow-hidden">
      <CardHeader className="pb-2 pt-4 px-4 sm:px-5 space-y-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-black bg-[#fef3c7] text-[#b45309] shadow-neo-sm">
              <Flame className="h-4 w-4" />
            </div>
            <CardTitle className="text-base sm:text-lg font-bold text-foreground">
              Top Moving Products
            </CardTitle>
          </div>
          <Badge variant="secondary">
            30 Days
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 px-4 sm:px-5 pb-4 pt-1 font-mono">
        {products.slice(0, 3).map((product, idx) => {
          const percentage = Math.round((product.movementQty / maxMovement) * 100);

          return (
            <div
              key={product.id}
              className="group rounded-md border border-border bg-slate-50/50 px-3 py-2 transition-all hover:bg-slate-100/60"
            >
              {/* Row: Rank, Name, Movement Total */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-black bg-white text-[11px] font-bold text-foreground group-hover:bg-[#543afd] group-hover:text-white transition-colors">
                    {idx + 1}
                  </span>
                  <div className="truncate text-xs font-semibold font-sans text-foreground group-hover:text-primary transition-colors">
                    {product.name}
                  </div>
                </div>

                <div className="text-right shrink-0 text-xs font-bold text-foreground">
                  {formatNumber(product.movementQty)}{" "}
                  <span className="text-[10px] font-normal text-muted-foreground">{product.unit}</span>
                </div>
              </div>

              {/* Progress bar and In/Out split */}
              <div className="mt-1.5 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div
                    style={{ width: `${percentage}%` }}
                    className="h-full rounded-full bg-[#543afd] transition-all duration-300"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0 font-medium">
                  <span className="text-emerald-600">+{product.stockIn}</span>
                  <span className="text-muted-foreground/40">/</span>
                  <span className="text-amber-600">-{product.stockOut}</span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
