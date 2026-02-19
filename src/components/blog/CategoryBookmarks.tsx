"use client";

import { useState, useEffect } from "react";
import type { BlogPost } from "@/types";
import { BlogGrid } from "./BlogGrid";

const CATEGORIES = ["books", "art", "travel"] as const;
type Category = (typeof CATEGORIES)[number];

export function CategoryBookmarks({ posts }: { posts: BlogPost[] }) {
  const [active, setActive] = useState<Category | null>(null);

  // Randomly pick a category on mount
  useEffect(() => {
    const idx = Math.floor(Math.random() * CATEGORIES.length);
    setActive(CATEGORIES[idx]);
  }, []);

  const filtered = active
    ? posts.filter((p) => p.tags.includes(active))
    : posts;

  if (active === null) return null;

  return (
    <div>
      <div className="grid grid-cols-3 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className="py-2 text-sm font-medium capitalize transition-colors"
            style={{
              background: active === cat ? "var(--foreground)" : "transparent",
              color: active === cat ? "var(--background)" : "var(--muted)",
              borderTop: active === cat ? "1px solid var(--foreground)" : "1px solid var(--border)",
              borderLeft: "1px solid " + (active === cat ? "var(--foreground)" : "var(--border)"),
              borderRight: "1px solid " + (active === cat ? "var(--foreground)" : "var(--border)"),
              borderBottom: active === cat ? "none" : "1px solid var(--border)",
              marginBottom: active === cat ? "-1px" : "0",
              borderRadius: "4px 4px 0 0",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <BlogGrid posts={filtered} />
      ) : (
        <p className="text-muted text-sm">No posts in this category yet.</p>
      )}
    </div>
  );
}
