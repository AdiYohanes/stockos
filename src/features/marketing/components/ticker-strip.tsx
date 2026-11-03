"use client";

import * as React from "react";

interface TickerProduct {
  sku: string;
  name: string;
  stock: string;
  price: string;
  status: "safe" | "low" | "critical";
}

const TICKER_PRODUCTS: TickerProduct[] = [
  { sku: "SNK-001", name: "Indomie Goreng Spesial", stock: "48 pcs", price: "Rp 3.500", status: "safe" },
  { sku: "SEM-002", name: "Minyak Goreng Bimoli 1L", stock: "4 btl", price: "Rp 21.000", status: "low" },
  { sku: "MIN-003", name: "Kopi Kapal Api Mix", stock: "60 sachet", price: "Rp 1.500", status: "safe" },
  { sku: "SEM-004", name: "Telur Ayam Negeri 1kg", stock: "15 kg", price: "Rp 29.000", status: "safe" },
  { sku: "MIN-005", name: "Teh Pucuk Harum 350ml", stock: "0 btl", price: "Rp 4.000", status: "critical" },
  { sku: "ROK-006", name: "Gudang Garam Surya 16", stock: "8 bks", price: "Rp 35.000", status: "low" },
  { sku: "SEM-007", name: "Beras Ramos Wangi 5kg", stock: "10 sak", price: "Rp 74.000", status: "safe" },
  { sku: "MND-008", name: "Sabun Lifebuoy Total 10", stock: "24 pcs", price: "Rp 4.500", status: "safe" },
];

export function TickerStrip() {
  return (
    <div
      aria-label="Pemantau Cepat Stok Warung"
      className="w-full overflow-hidden border-y-[3px] border-ink bg-ink py-2.5 text-white"
    >
      <div className="animate-marquee gap-8">
        {[...TICKER_PRODUCTS, ...TICKER_PRODUCTS].map((item, idx) => (
          <div
            key={`${item.sku}-${idx}`}
            className="flex items-center gap-3 font-mono text-xs whitespace-nowrap"
          >
            <span className="bg-white px-1.5 py-0.5 text-[10px] font-bold text-ink">
              {item.sku}
            </span>
            <span className="font-semibold text-white/95">{item.name}</span>
            <span className="text-white/60">({item.stock})</span>
            <span className="font-bold text-[#00e676]">{item.price}</span>
            <span
              className={`h-2 w-2 border border-white ${
                item.status === "safe"
                  ? "bg-[#00e676]"
                  : item.status === "low"
                  ? "bg-[#ff9100]"
                  : "bg-[#ff1744]"
              }`}
              title={
                item.status === "safe"
                  ? "Stok Aman"
                  : item.status === "low"
                  ? "Stok Menipis"
                  : "Stok Habis"
              }
            />
            <span className="text-white/30">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}
