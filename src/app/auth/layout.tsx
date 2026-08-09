import type { Metadata } from "next";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: {
    template: "%s — StockOS",
    default: "Authentication — StockOS",
  },
};

/**
 * Shared layout for all /auth/* routes.
 * Centers a card vertically and horizontally with StockOS branding.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-8"
      style={
        {
          "--primary": "#543afd",
          "--primary-foreground": "#ffffff",
          "--ring": "#543afd",
        } as React.CSSProperties
      }
    >
      <div className="mb-8 text-center">
        <h2 className="text-lg font-semibold tracking-tight">StockOS</h2>
        <p className="text-sm text-muted-foreground">
          Stock Management System
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardContent className="pt-2">
          {children}
        </CardContent>
      </Card>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} StockOS. All rights reserved.
      </p>
    </div>
  );
}
