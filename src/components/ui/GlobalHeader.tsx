"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "./SiteHeader";

export function GlobalHeader() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <SiteHeader />;
}
