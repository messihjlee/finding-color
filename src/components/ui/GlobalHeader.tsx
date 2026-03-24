"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "./SiteHeader";

// Render the site header on every page except the home page,
// which has its own controls embedded in the WebGL canvas.
export function GlobalHeader() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <SiteHeader />;
}
