"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle({ style }: { style?: React.CSSProperties }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div style={{ width: 48, height: 20 }} />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      style={{
        background: "none",
        border: "1px solid var(--border)",
        color: "var(--muted)",
        padding: "3px 8px",
        cursor: "pointer",
        fontSize: 9,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        lineHeight: 1.6,
        fontFamily: "inherit",
        ...style,
      }}
    >
      {isDark ? "LIGHT" : "DARK"}
    </button>
  );
}
