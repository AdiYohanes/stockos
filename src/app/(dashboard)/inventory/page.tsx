import { Metadata } from "next";
import { InventoryContainer } from "@/features/inventory";

export const metadata: Metadata = {
  title: "Inventory Control | StockOS",
  description: "Monitor shop stock levels, minimum thresholds, and movement history.",
};

export default function InventoryPage() {
  return <InventoryContainer />;
}
