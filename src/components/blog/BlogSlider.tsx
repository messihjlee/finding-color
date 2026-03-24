"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BlogPost } from "@/types";
import { BlogCard } from "./BlogCard";

const ITEMS_PER_PAGE = 9;

export function BlogSlider({ posts }: { posts: BlogPost[] }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
  const start = page * ITEMS_PER_PAGE;
  const current = posts.slice(start, start + ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-center w-full gap-4">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="shrink-0 text-muted transition-colors hover:text-foreground disabled:opacity-30"
          aria-label="Previous page"
        >
          <ChevronLeft size={28} className="sm:hidden" />
          <ChevronLeft size={40} className="hidden sm:block" />
        </button>

        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {current.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>

        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page === totalPages - 1}
          className="shrink-0 text-muted transition-colors hover:text-foreground disabled:opacity-30"
          aria-label="Next page"
        >
          <ChevronRight size={28} className="sm:hidden" />
          <ChevronRight size={40} className="hidden sm:block" />
        </button>
      </div>

      {totalPages > 1 && (
        <span className="mt-6 text-base text-muted">
          {page + 1} / {totalPages}
        </span>
      )}
    </div>
  );
}
