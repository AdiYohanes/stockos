import * as React from "react";
import { cn } from "@/lib/utils";

interface StockOSLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

/**
 * Vector logo for StockOS: Warehouse hangar arch enclosing an isometric stock cube.
 */
export function StockOSLogo({ className, size = 24, ...props }: StockOSLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      {...props}
    >
      {/* Warehouse Hangar Silhouette */}
      <path
        d="M3 10.5L12 3.5L21 10.5V20.5H18V12.5L12 7.8L6 12.5V20.5H3V10.5Z"
        fill="currentColor"
        opacity="0.95"
      />
      {/* Center Isometric Inventory Cube */}
      <path
        d="M12 11.5L16 13.8V18.2L12 20.5L8 18.2V13.8L12 11.5Z"
        fill="currentColor"
      />
      {/* Top Face Highlight */}
      <path
        d="M12 11.5L16 13.8L12 16.1L8 13.8L12 11.5Z"
        fill="white"
        opacity="0.28"
      />
    </svg>
  );
}
