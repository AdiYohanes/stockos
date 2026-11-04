import { redirect } from "next/navigation";
import { listProducts } from "@/features/products/server";
import { KasirContainer } from "@/features/kasir";

export const metadata = {
  title: "Kasir Harian | StockOS",
  description: "Catat penjualan cepat dan rekonsiliasi kas harian warung.",
};

export default async function KasirPage() {
  const productsResult = await listProducts({
    archive: "active",
    pageSize: 100,
    sort: "name",
    direction: "asc",
  });

  if (!productsResult.ok) {
    if (productsResult.code === "UNAUTHENTICATED") {
      redirect("/login");
    }
  }

  const products = productsResult.ok ? productsResult.data.items : [];

  return <KasirContainer products={products} />;
}
