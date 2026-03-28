"use client";

import { useState, useEffect } from "react";
import type { BlogPost } from "@/types";
import { BlogCard } from "./BlogCard";

const COLS = 3;
const ROWS = 3;
const GAP = 12;

function sample9<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, 9);
}

export function BlogSlider({ posts }: { posts: BlogPost[] }) {
  const [cellSize, setCellSize] = useState({ w: 150, h: 150 });
  const [sampled] = useState(() => sample9(posts));

  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth < 640;

      const outerVertPad = Math.round(window.innerHeight * 0.03);
      const innerVertPad = 64;
      const availH = window.innerHeight - outerVertPad - innerVertPad;
      const cellH = Math.max(Math.floor((availH - (ROWS - 1) * GAP) / ROWS), 80);

      const innerHorizPad = 32;
      const availW = window.innerWidth - innerHorizPad;
      const cellW = Math.max(Math.floor((availW - (COLS - 1) * GAP) / COLS), 80);

      setCellSize({ w: cellW, h: cellH });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="flex items-center justify-center w-full">
      <div
        className="grid overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${COLS}, ${cellSize.w}px)`,
          gridTemplateRows: `repeat(${ROWS}, ${cellSize.h}px)`,
          gap: `${GAP}px`,
        }}
      >
        {sampled.map((post) => (
          <div key={post.slug} style={{ width: cellSize.w, height: cellSize.h }}>
            <BlogCard post={post} />
          </div>
        ))}
      </div>
    </div>
  );
}
