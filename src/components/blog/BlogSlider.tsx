"use client";

import { useState } from "react";
import type { BlogPost } from "@/types";
import { BlogCard } from "./BlogCard";

const COLS = 3;
const ROWS = 3;

function sample9<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, 9);
}

export function BlogSlider({ posts }: { posts: BlogPost[] }) {
  const [sampled] = useState(() => sample9(posts));

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          gap: 12,
          width: "100%",
          height: "100%",
        }}
      >
        {sampled.map((post) => (
          <div key={post.slug} style={{ minHeight: 0, minWidth: 0 }}>
            <BlogCard post={post} />
          </div>
        ))}
      </div>
    </div>
  );
}
