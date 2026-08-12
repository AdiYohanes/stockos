import { Metadata } from "next";
import { WarehousesContainer } from "@/features/warehouses";

export const metadata: Metadata = {
  title: "Warehouse Hubs & Facilities | StockOS",
  description: "Monitor storage capacity, zones allocation, and inter-facility stock movements.",
};

export default function WarehousesPage() {
  return <WarehousesContainer />;
}
