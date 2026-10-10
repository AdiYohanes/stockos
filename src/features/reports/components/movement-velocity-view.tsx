"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { MovementVelocityItem, MovementTrendPoint } from "../types";

interface MovementVelocityViewProps {
  velocityItems: MovementVelocityItem[];
  trends: MovementTrendPoint[];
  onInspect: (id: string, type: "velocity" | "reorder") => void;
}

const emptySubscribe = () => () => {};

export function MovementVelocityView({
  velocityItems,
  trends,
  onInspect,
}: MovementVelocityViewProps) {
  const { t } = useI18n();
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  return (
    <div className="space-y-6">
      {/* Stock Volume Flow Trend Chart */}
      <Card className="border-[3px] border-ink bg-white shadow-neo-sm">
        <CardHeader className="border-b border-ink pb-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="font-heading text-base font-bold text-foreground">
              Trend Arus Stok Masuk vs Keluar
            </CardTitle>
            <div className="flex items-center gap-4 font-mono text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-none bg-[#543afd]" />
                <span className="text-muted-foreground">{t.dashboard.stockInbound || "Stok Masuk"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-none bg-[#09090b]" />
                <span className="text-muted-foreground">{t.dashboard.stockOutbound || "Stok Keluar"}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[280px] w-full">
            {isMounted && trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#543afd" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#543afd" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#09090b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#09090b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
                  <YAxis tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-none border-[3px] border-ink bg-white p-3 font-mono text-xs shadow-neo">
                          <p className="font-bold text-foreground mb-1">{label}</p>
                          <div className="space-y-1">
                            <p className="text-[#543afd]">{t.dashboard.stockIn || "Masuk"}: +{formatNumber(data.stockIn)} unit</p>
                            <p className="text-[#09090b]">{t.dashboard.stockOut || "Keluar"}: -{formatNumber(data.stockOut)} unit</p>
                            <p className={cn("font-bold", data.netFlow >= 0 ? "text-[#15803d]" : "text-[#b91c1c]")}>
                              {t.dashboard.netFlow || "Arus Bersih"}: {data.netFlow >= 0 ? "+" : ""}{formatNumber(data.netFlow)}
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area type="monotone" dataKey="stockIn" stroke="#543afd" strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" />
                  <Area type="monotone" dataKey="stockOut" stroke="#09090b" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : isMounted ? (
              <div className="flex h-full items-center justify-center text-xs font-mono text-muted-foreground">
                Belum ada aktivitas mutasi pada periode yang dipilih.
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-mono text-muted-foreground">
                {t.common.loading || "Memuat grafik pergerakan..."}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Movement Velocity Table */}
      <Card className="border-[3px] border-ink bg-white shadow-neo-sm">
        <CardHeader className="border-b border-ink pb-3">
          <CardTitle className="font-heading text-base font-bold text-foreground">
            Pergerakan Stok per Produk dalam Periode
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#f8f9fa]">
                <TableRow className="border-b border-ink">
                  <TableHead className="font-mono text-xs font-bold text-foreground">{t.common.sku || "SKU / Kode"}</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground">{t.common.name || "Nama Produk"}</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground">{t.common.category || "Kategori"}</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Stok Awal</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Stok Masuk</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Stok Terjual</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Selisih Opname</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Stok Terkini</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Pergerakan Terakhir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {velocityItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-xs font-mono text-muted-foreground">
                      Tidak ada pergerakan stok dalam periode ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  velocityItems.map((item) => (
                    <TableRow
                      key={item.productId}
                      onClick={() => onInspect(item.productId, "velocity")}
                      className="border-b border-ink hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <TableCell>
                        <span className="inline-flex rounded-none border-[3px] border-ink bg-[#f8f9fa] px-1.5 py-0.5 font-mono text-[11px] font-bold text-foreground">
                          {item.sku}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-foreground">
                        {item.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {item.category}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-right font-medium">
                        {formatNumber(item.openingQty ?? 0)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-right text-[#543afd] font-bold">
                        +{formatNumber(item.stockInQty)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-right text-foreground font-bold">
                        -{formatNumber(item.stockOutQty)}
                      </TableCell>
                      <TableCell className={cn("font-mono text-xs text-right font-medium", (item.opnameDelta ?? 0) < 0 ? "text-red-700" : (item.opnameDelta ?? 0) > 0 ? "text-emerald-700" : "text-muted-foreground")}>
                        {(item.opnameDelta ?? 0) > 0 ? `+${item.opnameDelta}` : item.opnameDelta ?? 0}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-right font-bold text-foreground">
                        {formatNumber(item.currentStock)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-right text-muted-foreground">
                        {item.lastMovementDate && item.lastMovementDate !== "-" ? item.lastMovementDate.slice(0, 10) : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
