import { Metadata } from "next";
import { SuppliersContainer } from "@/features/suppliers";

export const metadata: Metadata = {
  title: "Supplier Network & Partnerships | StockOS",
  description: "Manage vendor directory, track supplier performance, and review order history.",
};

export default function SuppliersPage() {
  return <SuppliersContainer />;
}
