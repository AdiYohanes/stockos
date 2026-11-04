export interface MarketingTranslations {
  nav: {
    features: string;
    simulator: string;
    faq: string;
    demo: string;
    login: string;
    dashboard: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    dashboardCta: string;
    secondaryCta: string;
    previewTag: string;
    previewCashierTitle: string;
    previewStockTitle: string;
    previewStatusSafe: string;
    previewStatusLow: string;
  };
  problems: {
    title: string;
    subtitle: string;
    item1Title: string;
    item1Desc: string;
    item2Title: string;
    item2Desc: string;
    item3Title: string;
    item3Desc: string;
  };
  features: {
    title: string;
    subtitle: string;
    f1Badge: string;
    f1Title: string;
    f1Desc: string;
    f1Bullet1: string;
    f1Bullet2: string;
    f1Bullet3: string;
    f2Badge: string;
    f2Title: string;
    f2Desc: string;
    f2Bullet1: string;
    f2Bullet2: string;
    f2Bullet3: string;
    f3Badge: string;
    f3Title: string;
    f3Desc: string;
    f3Bullet1: string;
    f3Bullet2: string;
    f3Bullet3: string;
  };
  simulator: {
    title: string;
    subtitle: string;
    dailyTurnover: string;
    estimatedLeakage: string;
    monthlyPreserved: string;
    calculationNote: string;
    actionPrompt: string;
  };
  faq: {
    title: string;
    subtitle: string;
    q1: string;
    a1: string;
    q2: string;
    a2: string;
    q3: string;
    a3: string;
    q4: string;
    a4: string;
  };
  footer: {
    tagline: string;
    architectureBadge: string;
    linksTitle: string;
    operationsTitle: string;
    copyright: string;
    disclaimer: string;
  };
}

export const marketingTranslations: Record<"id" | "en", MarketingTranslations> = {
  id: {
    nav: {
      features: "Fitur Operasional",
      simulator: "Simulasi Margin",
      faq: "Tanya Jawab",
      demo: "Coba Demo",
      login: "Masuk Pemilik",
      dashboard: "Buka Dashboard",
    },
    hero: {
      badge: "SISTEM OPERASI WARUNG TUNGGAL",
      title: "Sistem Stok & Kasir Nyata untuk Warung Kelontong",
      subtitle:
        "Bukan ERP rumit dengan puluhan menu gudang. Catat barang masuk dari kulakan, pantau barang menipis sebelum habis, hitung potensi laba kotor otomatis, dan catat penjualan walk-in dalam satu layar kilat.",
      primaryCta: "Coba Demo Kasir",
      dashboardCta: "Buka Dashboard Utama",
      secondaryCta: "Lihat Bukti Operasional",
      previewTag: "LIVE RECORD",
      previewCashierTitle: "Struk Kasir Terakhir",
      previewStockTitle: "Buku Kendali Rak",
      previewStatusSafe: "STOK AMAN",
      previewStatusLow: "MENIPIS",
    },
    problems: {
      title: "3 Masalah Nyata di Meja Kasir Warung",
      subtitle:
        "Kebocoran margin warung hampir tidak pernah terjadi karena perampokan besar, melainkan karena pencatatan manual yang bocor sedikit demi sedikit setiap hari.",
      item1Title: "Buku Bon Basah, Hilang, atau Robek",
      item1Desc:
        "Saat antrean pembeli ramai di pagi hari, catatan penjualan di buku sering terlewat. Kertas bon basah terkena minyak atau tercecer, membuat uang laci dan catatan tidak pernah cocok.",
      item2Title: "Modal Mandek di Barang Lambat Laku",
      item2Desc:
        "Tanpa data riwayat mutasi, uang kulakan habis dibelikan barang yang akhirnya mengendap berbulan-bulan di rak belakang. Modal kerja terkunci sementara barang laris kehabisan stok.",
      item3Title: "Kehabisan Barang Laku Mendadak",
      item3Desc:
        "Pembeli datang mencari beras atau minyak goreng, namun fisik di rak ternyata sudah kosong. Pelanggan pindah ke warung sebelah karena tidak ada peringatan dini batas minimum stok.",
    },
    features: {
      title: "3 Solusi Langsung Tanpa Fitur Pabrik",
      subtitle:
        "StockOS dirancang khusus untuk ritel satu toko fisik. Nol istilah logistik pabrik, langsung siap pakai di meja kasir warung.",
      f1Badge: "TRANSAKSI KILAT",
      f1Title: "Kasir Harian Walk-In Meja Depan",
      f1Desc:
        "Antarmuka kasir cepat dengan dukungan shortcut keyboard. Cari barang, masukkan jumlah, hitung otomatis uang diterima serta uang kembalian, lalu cetak bukti transaksi tanpa lag.",
      f1Bullet1: "Pencarian instan nama produk atau kode PLU",
      f1Bullet2: "Kalkulator kembalian otomatis anti-salah hitung",
      f1Bullet3: "Pengurangan stok otomatis saat transaksi disimpan",
      f2Badge: "KONTROL RAK",
      f2Title: "Peringatan Dini Stok Kritis & Opname",
      f2Desc:
        "Tentukan ambang batas minimum untuk tiap produk. Sistem otomatis mengelompokkan stok sehat, stok menipis, dan stok habis agar daftar belanja kulakan selalu tepat sasaran.",
      f2Bullet1: "Daftar belanja kulakan terbit otomatis saat stok kritis",
      f2Bullet2: "Pencatatan opname fisik berkala tanpa tutup warung",
      f2Bullet3: "Riwayat mutasi keluar-masuk terlacak dengan nomor bukti",
      f3Badge: "KEUANGAN WARUNG",
      f3Title: "Potensi Laba Kotor & HPP Otomatis",
      f3Desc:
        "Setiap stok masuk mencatat harga modal beli (HPP). Sistem menghitung selisih harga jual secara riil sehingga potensi laba kotor di rak toko terbaca langsung setiap hari.",
      f3Bullet1: "Pemantauan modal tertanam di rak secara transparan",
      f3Bullet2: "Estimasi laba kotor sebelum dipotong beban listrik dan sewa",
      f3Bullet3: "Evaluasi produk dengan margin paling menguntungkan",
    },
    simulator: {
      title: "Simulasi Kebocoran Modal Terselamatkan",
      subtitle:
        "Geser estimasi omzet harian warung Anda untuk melihat perkiraan nominal modal yang berhasil diselamatkan dengan pencatatan disiplin.",
      dailyTurnover: "Estimasi Omzet Penjualan Harian",
      estimatedLeakage: "Estimasi Kebocoran Tercegah (3% per hari)",
      monthlyPreserved: "Modal Bersih Terselamatkan per Bulan",
      calculationNote:
        "Berdasarkan pola warung kelontong mandiri, rata-rata selisih kembalian, barang kedaluwarsa terlambat obral, dan stok terselip berkisar antara 2% sampai 5% dari total omzet.",
      actionPrompt: "Gunakan StockOS untuk mengunci setiap rupiah modal warung Anda.",
    },
    faq: {
      title: "Pertanyaan Praktis Pemilik Warung",
      subtitle:
        "Jawaban lugas seputar penggunaan StockOS untuk operasional harian warung Anda.",
      q1: "Apakah saya harus membeli mesin kasir POS yang mahal?",
      a1: "Tidak perlu. StockOS bekerja penuh di browser standar. Anda bisa menggunakan laptop lama, tablet, maupun smartphone yang sudah ada di warung.",
      q2: "Apakah StockOS mendukung banyak cabang atau gudang terpisah?",
      a2: "Tidak. StockOS sengaja didesain khusus untuk satu toko fisik (single-shop warung). Tidak ada fitur transfer antar-gudang atau pesanan pembelian rumit yang memperlambat kasir.",
      q3: "Bagaimana jika koneksi internet di warung sedang lambat?",
      a3: "Antarmuka StockOS dibangun sangat ringan tanpa aset berat. Halaman dimuat cepat bahkan pada jaringan seluler 4G biasa di ponsel konter.",
      q4: "Apakah data stok dan transaksi warung saya bisa hilang?",
      a4: "Seluruh data transaksi, mutasi barang masuk, dan opname tersimpan di basis data terenkripsi dengan jejak bukti mutasi yang permanen.",
    },
    footer: {
      tagline: "Sistem Manajemen Stok & Kasir Ringan untuk Warung Kelontong Indonesia.",
      architectureBadge: "ARSITEKTUR SINGLE-SHOP",
      linksTitle: "Navigasi",
      operationsTitle: "Operasional",
      copyright: "Hak Cipta Terpelihara. Didesain untuk operasional warung mandiri.",
      disclaimer: "StockOS adalah sistem manajemen stok independen untuk satu toko fisik.",
    },
  },
  en: {
    nav: {
      features: "Operations",
      simulator: "Margin Simulator",
      faq: "FAQ",
      demo: "Try Demo",
      login: "Owner Login",
      dashboard: "Open Dashboard",
    },
    hero: {
      badge: "SINGLE-SHOP OPERATING SYSTEM",
      title: "Practical Stock & Cashier System for Neighborhood Shops",
      subtitle:
        "No bloated ERPs with dozens of warehouse layers. Track restock shipments, catch low inventory before shelves empty, calculate gross profit automatically, and tally daily walk-in cash sales on one fast screen.",
      primaryCta: "Try Live Cashier Demo",
      dashboardCta: "Open Main Dashboard",
      secondaryCta: "View Operational Proof",
      previewTag: "LIVE RECORD",
      previewCashierTitle: "Latest Counter Receipt",
      previewStockTitle: "Shelf Inventory Ledger",
      previewStatusSafe: "IN STOCK",
      previewStatusLow: "LOW STOCK",
    },
    problems: {
      title: "3 Real Leaks on Manual Shop Counters",
      subtitle:
        "Retail margin loss rarely happens through major incidents. It bleeds away quietly through unrecorded transactions day after day.",
      item1Title: "Lost, Torn, or Soiled Paper Receipts",
      item1Desc:
        "During busy morning rushes, handwriting sales in a notebook gets skipped. Paper receipts tear or get misplaced, leaving cash drawers out of balance.",
      item2Title: "Working Capital Trapped in Dead Stock",
      item2Desc:
        "Without restock history, purchasing funds go into slow-moving products that sit on back shelves for months while popular goods run out.",
      item3Title: "Unexpected Stockouts of Fast Sellers",
      item3Desc:
        "Customers ask for cooking oil or rice only to find empty shelves. Shoppers go to the shop across the street because there was no low-stock alert.",
    },
    features: {
      title: "3 Focused Operational Workflows",
      subtitle:
        "StockOS is engineered strictly for single-location retail counters. Zero warehouse overhead, ready for daily counter work.",
      f1Badge: "FAST COUNTER",
      f1Title: "Walk-In Daily Cashier Register",
      f1Desc:
        "Fast counter checkout with keyboard shortcut support. Look up items, specify quantity, calculate tendered cash and exact change, and log daily receipts instantly.",
      f1Bullet1: "Instant product name or PLU code search",
      f1Bullet2: "Automatic change calculator prevents manual errors",
      f1Bullet3: "Real-time stock deduction upon saving receipt",
      f2Badge: "SHELF CONTROL",
      f2Title: "Low Stock Alerts & Physical Opname",
      f2Desc:
        "Set safety thresholds for every product. The system groups healthy, low, and out-of-stock items so replenishment lists are clear and accurate.",
      f2Bullet1: "Automatic restock suggestions when stock dips below minimum",
      f2Bullet2: "Routine physical inventory counts without closing shop",
      f2Bullet3: "Complete stock movement history with reference numbers",
      f3Badge: "FINANCIAL CLARITY",
      f3Title: "Purchase Cost (HPP) & Gross Margin",
      f3Desc:
        "Every incoming restock records its unit purchase cost. The system tracks true markup against selling price so your gross margin is visible every day.",
      f3Bullet1: "Transparent valuation of working capital on shelves",
      f3Bullet2: "Estimated gross profit before shop overhead and utilities",
      f3Bullet3: "Identify top margin products that drive shop income",
    },
    simulator: {
      title: "Simulate Preserved Shop Margin",
      subtitle:
        "Adjust your estimated daily turnover to see capital protected by structured stock and cash records.",
      dailyTurnover: "Estimated Daily Sales Turnover",
      estimatedLeakage: "Estimated Prevented Leakage (3% daily)",
      monthlyPreserved: "Net Capital Preserved per Month",
      calculationNote:
        "Small neighborhood retail shops lose an average of 2% to 5% of turnover to manual calculation mistakes, unsellable expired goods, and untracked shrinkage.",
      actionPrompt: "Use StockOS to protect every rupiah of your shop's working capital.",
    },
    faq: {
      title: "Practical Operator Questions",
      subtitle:
        "Clear answers about using StockOS for daily neighborhood shop operations.",
      q1: "Do I need to buy an expensive POS cash register machine?",
      a1: "No. StockOS runs in any modern browser. You can use an existing laptop, tablet, or smartphone already at your shop.",
      q2: "Does StockOS support multiple warehouses or store branches?",
      a2: "No. StockOS is intentionally built for one physical shop. There are no inter-warehouse transfers or complex purchasing hierarchies to slow down checkout.",
      q3: "What if the shop's mobile internet connection is slow?",
      a3: "The StockOS interface is ultra-lightweight with zero heavy media assets. It loads swiftly even over modest mobile data connections.",
      q4: "Can my shop stock and sales transaction data get lost?",
      a4: "All transactions, stock receipts, and adjustments are stored in an encrypted PostgreSQL database with permanent audit trail references.",
    },
    footer: {
      tagline: "Lightweight Stock Management & Cashier System for Neighborhood Shops.",
      architectureBadge: "SINGLE-SHOP ARCHITECTURE",
      linksTitle: "Navigation",
      operationsTitle: "Operations",
      copyright: "All Rights Reserved. Engineered for independent single-shop retail.",
      disclaimer: "StockOS is an independent operational software for one physical retail shop.",
    },
  },
};
