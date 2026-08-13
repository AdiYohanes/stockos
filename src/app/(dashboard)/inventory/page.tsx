import { Metadata } from "next";
import { InventoryContainer } from "@/features/inventory";

export const metadata: Metadata = {
  title: "Inventory Control | StockOS",
  description: "Monitor real-time warehouse stock balance, thresholds, and movement audit logs.",
};

export default function InventoryPage() {
  return <InventoryContainer />;
}
